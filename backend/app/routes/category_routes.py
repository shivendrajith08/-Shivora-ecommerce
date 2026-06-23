from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.category import Category
from app.models.product import Product
from app.utils.decorators import admin_required
from app.utils.helpers import generate_unique_slug

category_bp = Blueprint("categories", __name__)


@category_bp.route("", methods=["GET"])
def list_categories():
    categories = Category.query.order_by(Category.name.asc()).all()
    with_count = request.args.get("with_count", "false").lower() == "true"
    return jsonify({"categories": [c.to_dict(with_product_count=with_count) for c in categories]}), 200


@category_bp.route("/<int:category_id>", methods=["GET"])
def get_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"error": "Not found", "message": "Category not found"}), 404
    return jsonify({"category": category.to_dict()}), 200


@category_bp.route("", methods=["POST"])
@admin_required()
def create_category():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Validation failed", "errors": {"name": "Category name is required"}}), 400

    if Category.query.filter_by(name=name).first():
        return jsonify({"error": "Validation failed", "errors": {"name": "Category already exists"}}), 409

    category = Category(
        name=name,
        slug=generate_unique_slug(Category, name),
        description=(data.get("description") or "").strip() or None,
    )
    db.session.add(category)
    db.session.commit()
    return jsonify({"message": "Category created successfully", "category": category.to_dict()}), 201


@category_bp.route("/<int:category_id>", methods=["PUT"])
@admin_required()
def update_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"error": "Not found", "message": "Category not found"}), 404

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if name and name != category.name:
        if Category.query.filter(Category.name == name, Category.id != category.id).first():
            return jsonify({"error": "Validation failed", "errors": {"name": "Category name already in use"}}), 409
        category.name = name
        category.slug = generate_unique_slug(Category, name, exclude_id=category.id)

    if "description" in data:
        category.description = (data.get("description") or "").strip() or None

    db.session.commit()
    return jsonify({"message": "Category updated successfully", "category": category.to_dict()}), 200


@category_bp.route("/<int:category_id>", methods=["DELETE"])
@admin_required()
def delete_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"error": "Not found", "message": "Category not found"}), 404

    product_count = Product.query.filter_by(category_id=category.id).count()
    if product_count > 0:
        return jsonify({
            "error": "Conflict",
            "message": f"Cannot delete category with {product_count} product(s) assigned. Reassign or delete them first."
        }), 409

    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Category deleted successfully"}), 200
