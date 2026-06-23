from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.category import Category
from app.models.review import Review
from app.utils.decorators import admin_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/dashboard", methods=["GET"])
@admin_required()
def dashboard_stats():
    total_revenue = db.session.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
        Order.status != "cancelled"
    ).scalar()

    total_orders = Order.query.count()
    total_products = Product.query.count()
    total_users = User.query.filter_by(role="user").count()
    pending_orders = Order.query.filter_by(status="pending").count()
    low_stock_products = Product.query.filter(Product.stock <= 5, Product.is_active.is_(True)).count()

    # Orders by status
    status_counts = dict(
        db.session.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    )

    # Sales over the last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    daily_sales_raw = (
        db.session.query(
            func.date(Order.created_at).label("date"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
            func.count(Order.id).label("order_count"),
        )
        .filter(Order.created_at >= seven_days_ago, Order.status != "cancelled")
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
        .all()
    )
    daily_sales = [
        {"date": str(row.date), "revenue": float(row.revenue), "order_count": row.order_count}
        for row in daily_sales_raw
    ]

    # Top selling products
    top_products_raw = (
        db.session.query(
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.subtotal).label("total_revenue"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status != "cancelled")
        .group_by(OrderItem.product_name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )
    top_products = [
        {"name": row.product_name, "total_sold": int(row.total_sold), "total_revenue": float(row.total_revenue)}
        for row in top_products_raw
    ]

    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()

    return jsonify({
        "total_revenue": float(total_revenue),
        "total_orders": total_orders,
        "total_products": total_products,
        "total_users": total_users,
        "pending_orders": pending_orders,
        "low_stock_products": low_stock_products,
        "total_categories": Category.query.count(),
        "orders_by_status": status_counts,
        "daily_sales": daily_sales,
        "top_products": top_products,
        "recent_orders": [o.to_dict(include_items=False) for o in recent_orders],
    }), 200


@admin_bp.route("/users", methods=["GET"])
@admin_required()
def list_users():
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    search = request.args.get("search", "").strip()

    query = User.query.filter_by(role="user")
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(User.name.ilike(like), User.email.ilike(like)))
    query = query.order_by(User.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "users": [u.to_dict() for u in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    }), 200


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@admin_required()
def get_user_detail(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found", "message": "User not found"}), 404
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    data = user.to_dict()
    data["orders"] = [o.to_dict(include_items=False) for o in orders]
    return jsonify({"user": data}), 200


@admin_bp.route("/users/<int:user_id>/toggle-status", methods=["PUT"])
@admin_required()
def toggle_user_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found", "message": "User not found"}), 404
    if user.role == "admin":
        return jsonify({"error": "Forbidden", "message": "Cannot modify admin accounts"}), 403

    user.is_active = not user.is_active
    db.session.commit()
    status = "activated" if user.is_active else "deactivated"
    return jsonify({"message": f"User {status} successfully", "user": user.to_dict()}), 200


@admin_bp.route("/reviews", methods=["GET"])
@admin_required()
def admin_list_reviews():
    reviews = Review.query.order_by(Review.created_at.desc()).all()
    data = []
    for r in reviews:
        d = r.to_dict()
        d["product_name"] = r.product.name if r.product else None
        data.append(d)
    return jsonify({"reviews": data, "total": len(data)}), 200


@admin_bp.route("/reviews/<int:review_id>", methods=["DELETE"])
@admin_required()
def admin_delete_review(review_id):
    review = Review.query.get(review_id)
    if not review:
        return jsonify({"error": "Not found", "message": "Review not found"}), 404
    db.session.delete(review)
    db.session.commit()
    return jsonify({"message": "Review deleted"}), 200
