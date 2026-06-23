from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.wishlist import Wishlist
from app.models.product import Product

wishlist_bp = Blueprint("wishlist", __name__)


@wishlist_bp.route("", methods=["GET"])
@jwt_required()
def get_wishlist():
    user_id = get_jwt_identity()
    items = Wishlist.query.filter_by(user_id=user_id).order_by(Wishlist.created_at.desc()).all()
    return jsonify({"wishlist": [item.to_dict() for item in items]}), 200


@wishlist_bp.route("", methods=["POST"])
@jwt_required()
def add_to_wishlist():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")

    if not product_id:
        return jsonify({"error": "Validation failed", "errors": {"product_id": "Product ID is required"}}), 400

    product = Product.query.get(product_id)
    if not product or not product.is_active:
        return jsonify({"error": "Not found", "message": "Product not found"}), 404

    existing = Wishlist.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        return jsonify({"message": "Already in wishlist", "item": existing.to_dict()}), 200

    item = Wishlist(user_id=user_id, product_id=product_id)
    db.session.add(item)
    db.session.commit()
    return jsonify({"message": "Added to wishlist", "item": item.to_dict()}), 201


@wishlist_bp.route("/<int:wishlist_id>", methods=["DELETE"])
@jwt_required()
def remove_from_wishlist(wishlist_id):
    user_id = get_jwt_identity()
    item = Wishlist.query.filter_by(id=wishlist_id, user_id=user_id).first()
    if not item:
        return jsonify({"error": "Not found", "message": "Wishlist item not found"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Removed from wishlist"}), 200


@wishlist_bp.route("/product/<int:product_id>", methods=["DELETE"])
@jwt_required()
def remove_from_wishlist_by_product(product_id):
    user_id = get_jwt_identity()
    item = Wishlist.query.filter_by(product_id=product_id, user_id=user_id).first()
    if not item:
        return jsonify({"error": "Not found", "message": "Wishlist item not found"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Removed from wishlist"}), 200
