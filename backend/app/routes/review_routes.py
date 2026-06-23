from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models.review import Review
from app.models.product import Product
from app.utils.helpers import save_review_image

review_bp = Blueprint("reviews", __name__)


@review_bp.route("", methods=["POST"])
@jwt_required()
def create_review():
    user_id = get_jwt_identity()

    # Accept both multipart/form-data (with image) and application/json
    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})

    # Coerce and validate product_id
    errors = {}
    try:
        product_id = int(data.get("product_id") or 0) or None
    except (TypeError, ValueError):
        product_id = None
    if not product_id:
        errors["product_id"] = "product_id is required"

    # Coerce and validate rating
    try:
        rating = int(data.get("rating"))
        if rating < 1 or rating > 5:
            raise ValueError
    except (TypeError, ValueError):
        rating = None
        errors["rating"] = "rating must be an integer between 1 and 5"

    if errors:
        return jsonify({"error": "Validation failed", "errors": errors}), 400

    if not Product.query.get(product_id):
        return jsonify({"error": "Not found", "message": "Product not found"}), 404

    # Handle optional image upload
    photo_url = None
    image_file = request.files.get("image")
    if image_file and image_file.filename:
        try:
            photo_url = save_review_image(image_file)
        except ValueError as e:
            return jsonify({"error": "Validation failed", "errors": {"image": str(e)}}), 400

    order_item_id = data.get("order_item_id") or None
    if order_item_id:
        try:
            order_item_id = int(order_item_id)
        except (TypeError, ValueError):
            order_item_id = None

    review = Review(
        product_id=product_id,
        user_id=user_id,
        order_item_id=order_item_id,
        rating=rating,
        comment=data.get("comment") or None,
        photo_url=photo_url,
    )
    db.session.add(review)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Conflict", "message": "You have already reviewed this product"}), 409

    return jsonify({"message": "Review submitted", "review": review.to_dict()}), 201


@review_bp.route("/product/<int:product_id>", methods=["GET"])
def get_product_reviews(product_id):
    if not Product.query.get(product_id):
        return jsonify({"error": "Not found", "message": "Product not found"}), 404

    reviews = (
        Review.query
        .filter_by(product_id=product_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return jsonify({"reviews": [r.to_dict() for r in reviews]}), 200


@review_bp.route("/<int:review_id>", methods=["DELETE"])
@jwt_required()
def delete_review(review_id):
    user_id = get_jwt_identity()
    review = Review.query.filter_by(id=review_id, user_id=user_id).first()
    if not review:
        return jsonify({"error": "Not found", "message": "Review not found"}), 404

    db.session.delete(review)
    db.session.commit()
    return jsonify({"message": "Review deleted"}), 200
