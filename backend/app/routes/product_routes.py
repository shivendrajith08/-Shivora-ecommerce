import json
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import or_, func
from app.extensions import db
from app.models.product import Product
from app.models.category import Category
from app.models.review import Review
from app.utils.decorators import admin_required
from app.utils.validators import validate_product_data
from app.utils.helpers import generate_unique_slug, save_product_image, delete_product_image, generate_sku

product_bp = Blueprint("products", __name__)


@product_bp.route("", methods=["GET"])
def list_products():
    """Public: list products with search, category filter, sort, pagination."""
    query = Product.query.filter_by(is_active=True)

    search = request.args.get("search", "").strip()
    if search:
        like_pattern = f"%{search}%"
        query = query.filter(or_(Product.name.ilike(like_pattern), Product.description.ilike(like_pattern)))

    category_id = request.args.get("category_id", type=int)
    if category_id:
        query = query.filter_by(category_id=category_id)

    category_slug = request.args.get("category")
    if category_slug:
        category = Category.query.filter_by(slug=category_slug).first()
        if category:
            query = query.filter_by(category_id=category.id)
        else:
            query = query.filter(False)

    min_price = request.args.get("min_price", type=float)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    max_price = request.args.get("max_price", type=float)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    sort = request.args.get("sort", "newest")
    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "name_asc":
        query = query.order_by(Product.name.asc())
    else:
        query = query.order_by(Product.created_at.desc())

    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 12, type=int), 50)

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    # Single aggregation query for all products on this page — no N+1
    product_ids = [p.id for p in pagination.items]
    agg_rows = (
        db.session.query(
            Review.product_id,
            func.round(func.avg(Review.rating), 1).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        )
        .filter(Review.product_id.in_(product_ids))
        .group_by(Review.product_id)
        .all()
    )
    agg = {row.product_id: (float(row.avg_rating), row.review_count) for row in agg_rows}

    products_data = []
    for p in pagination.items:
        d = p.to_dict()
        avg, count = agg.get(p.id, (None, 0))
        d["avg_rating"] = avg
        d["review_count"] = count
        products_data.append(d)

    return jsonify({
        "products": products_data,
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "per_page": per_page,
    }), 200


def _add_rating(product):
    avg, count = db.session.query(
        func.round(func.avg(Review.rating), 1),
        func.count(Review.id),
    ).filter(Review.product_id == product.id).one()
    d = product.to_dict()
    d["avg_rating"] = float(avg) if avg is not None else None
    d["review_count"] = count
    return d


@product_bp.route("/search", methods=["GET"])
@product_bp.route("/search/suggestions", methods=["GET"])
def search_suggestions():
    """Autocomplete endpoint — returns up to 8 matching products with category."""
    q = request.args.get("q", "").strip()
    if len(q) < 2:
        return jsonify({"suggestions": []}), 200

    like = f"%{q}%"
    products = (
        Product.query
        .outerjoin(Category, Product.category_id == Category.id)
        .filter(Product.is_active == True)
        .filter(or_(
            Product.name.ilike(like),
            Category.name.ilike(like),
            Product.description.ilike(like),
        ))
        .order_by(Product.name.asc())
        .limit(8)
        .all()
    )

    return jsonify({
        "suggestions": [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category.name if p.category else None,
                "price": float(p.discount_price or p.price),
                "image": p.image_url,
                "image_url": p.image_url,
            }
            for p in products
        ]
    }), 200


@product_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product or not product.is_active:
        return jsonify({"error": "Not found", "message": "Product not found"}), 404
    return jsonify({"product": _add_rating(product)}), 200


@product_bp.route("/slug/<string:slug>", methods=["GET"])
def get_product_by_slug(slug):
    product = Product.query.filter_by(slug=slug, is_active=True).first()
    if not product:
        return jsonify({"error": "Not found", "message": "Product not found"}), 404
    return jsonify({"product": _add_rating(product)}), 200


# ------------------ ADMIN ROUTES ------------------

@product_bp.route("/admin/all", methods=["GET"])
@admin_required()
def admin_list_products():
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    search = request.args.get("search", "").strip()

    query = Product.query
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    query = query.order_by(Product.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "products": [p.to_dict() for p in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    }), 200


@product_bp.route("", methods=["POST"])
@admin_required()
def create_product():
    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})
    errors = validate_product_data(data)
    if errors:
        return jsonify({"error": "Validation failed", "errors": errors}), 400

    image_url = None
    if "image" in request.files:
        try:
            image_url = save_product_image(request.files["image"])
        except ValueError as e:
            return jsonify({"error": "Validation failed", "errors": {"image": str(e)}}), 400

    slug = generate_unique_slug(Product, data.get("name"))
    sku = data.get("sku", "").strip() or generate_sku(data.get("name", "PROD")[:4])

    sizes_raw = data.get("sizes", "")
    if sizes_raw and isinstance(sizes_raw, str) and sizes_raw.strip().startswith("["):
        sizes = json.loads(sizes_raw)
    elif sizes_raw:
        sizes = [s.strip() for s in sizes_raw.split(",") if s.strip()]
    else:
        sizes = None

    colors_raw = data.get("colors", "")
    try:
        colors = json.loads(colors_raw) if colors_raw else None
    except (json.JSONDecodeError, TypeError):
        colors = None

    product = Product(
        name=data.get("name").strip(),
        slug=slug,
        description=data.get("description", "").strip() or None,
        price=float(data.get("price")),
        discount_price=float(data["discount_price"]) if data.get("discount_price") else None,
        stock=int(data.get("stock", 0)),
        sku=sku,
        category_id=int(data["category_id"]) if data.get("category_id") else None,
        image_url=image_url or data.get("image_url") or None,
        is_active=True,
        sizes=sizes,
        colors=colors,
    )

    db.session.add(product)
    db.session.commit()

    return jsonify({"message": "Product created successfully", "product": product.to_dict()}), 201


@product_bp.route("/<int:product_id>", methods=["PUT"])
@admin_required()
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Not found", "message": "Product not found"}), 404

    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})
    errors = validate_product_data(data, is_update=True)
    if errors:
        return jsonify({"error": "Validation failed", "errors": errors}), 400

    if "name" in data and data["name"].strip():
        product.name = data["name"].strip()
        product.slug = generate_unique_slug(Product, product.name, exclude_id=product.id)
    if "description" in data:
        product.description = data["description"].strip() or None
    if "price" in data:
        product.price = float(data["price"])
    if "discount_price" in data:
        product.discount_price = float(data["discount_price"]) if data["discount_price"] else None
    if "stock" in data:
        product.stock = int(data["stock"])
    if "sku" in data and data["sku"].strip():
        product.sku = data["sku"].strip()
    if "category_id" in data:
        product.category_id = int(data["category_id"]) if data["category_id"] else None
    if "is_active" in data:
        product.is_active = str(data["is_active"]).lower() in ("true", "1", "yes")

    if "sizes" in data:
        sizes_raw = data.get("sizes", "")
        if sizes_raw and isinstance(sizes_raw, str) and sizes_raw.strip().startswith("["):
            product.sizes = json.loads(sizes_raw)
        elif sizes_raw:
            product.sizes = [s.strip() for s in sizes_raw.split(",") if s.strip()]
        else:
            product.sizes = None

    if "colors" in data:
        colors_raw = data.get("colors", "")
        try:
            product.colors = json.loads(colors_raw) if colors_raw else None
        except (json.JSONDecodeError, TypeError):
            product.colors = None

    if "image" in request.files and request.files["image"].filename:
        try:
            new_image_url = save_product_image(request.files["image"])
            if new_image_url:
                delete_product_image(product.image_url)
                product.image_url = new_image_url
        except ValueError as e:
            return jsonify({"error": "Validation failed", "errors": {"image": str(e)}}), 400
    elif "image_url" in data:
        product.image_url = data["image_url"] or None

    db.session.commit()
    return jsonify({"message": "Product updated successfully", "product": product.to_dict()}), 200


@product_bp.route("/<int:product_id>", methods=["DELETE"])
@admin_required()
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Not found", "message": "Product not found"}), 404

    delete_product_image(product.image_url)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted successfully"}), 200
