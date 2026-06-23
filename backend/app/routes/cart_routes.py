from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.cart import Cart
from app.models.product import Product

cart_bp = Blueprint("cart", __name__)


@cart_bp.route("", methods=["GET"])
@jwt_required()
def get_cart():
    user_id = get_jwt_identity()
    items = Cart.query.filter_by(user_id=user_id).order_by(Cart.created_at.desc()).all()
    cart_data = [item.to_dict() for item in items]
    total = sum(item["subtotal"] for item in cart_data if item["subtotal"] is not None)
    item_count = sum(item["quantity"] for item in cart_data)
    return jsonify({"cart": cart_data, "total": round(total, 2), "item_count": item_count}), 200


@cart_bp.route("", methods=["POST"])
@jwt_required()
def add_to_cart():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not product_id:
        return jsonify({"error": "Validation failed", "errors": {"product_id": "Product ID is required"}}), 400

    try:
        quantity = int(quantity)
        if quantity < 1:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({"error": "Validation failed", "errors": {"quantity": "Quantity must be a positive integer"}}), 400

    product = Product.query.get(product_id)
    if not product or not product.is_active:
        return jsonify({"error": "Not found", "message": "Product not found"}), 404

    if product.stock < quantity:
        return jsonify({"error": "Insufficient stock", "message": f"Only {product.stock} item(s) available"}), 400

    existing = Cart.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        new_qty = existing.quantity + quantity
        if new_qty > product.stock:
            return jsonify({"error": "Insufficient stock", "message": f"Only {product.stock} item(s) available"}), 400
        existing.quantity = new_qty
    else:
        existing = Cart(user_id=user_id, product_id=product_id, quantity=quantity)
        db.session.add(existing)

    db.session.commit()
    return jsonify({"message": "Added to cart", "item": existing.to_dict()}), 201


@cart_bp.route("/<int:cart_id>", methods=["PUT"])
@jwt_required()
def update_cart_item(cart_id):
    user_id = get_jwt_identity()
    item = Cart.query.filter_by(id=cart_id, user_id=user_id).first()
    if not item:
        return jsonify({"error": "Not found", "message": "Cart item not found"}), 404

    data = request.get_json(silent=True) or {}
    quantity = data.get("quantity")

    try:
        quantity = int(quantity)
        if quantity < 1:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({"error": "Validation failed", "errors": {"quantity": "Quantity must be a positive integer"}}), 400

    if item.product.stock < quantity:
        return jsonify({"error": "Insufficient stock", "message": f"Only {item.product.stock} item(s) available"}), 400

    item.quantity = quantity
    db.session.commit()
    return jsonify({"message": "Cart updated", "item": item.to_dict()}), 200


@cart_bp.route("/<int:cart_id>", methods=["DELETE"])
@jwt_required()
def remove_from_cart(cart_id):
    user_id = get_jwt_identity()
    item = Cart.query.filter_by(id=cart_id, user_id=user_id).first()
    if not item:
        return jsonify({"error": "Not found", "message": "Cart item not found"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item removed from cart"}), 200


@cart_bp.route("/clear", methods=["DELETE"])
@jwt_required()
def clear_cart():
    user_id = get_jwt_identity()
    Cart.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({"message": "Cart cleared"}), 200
