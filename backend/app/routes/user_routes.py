from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User

user_bp = Blueprint("users", __name__)


@user_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found", "message": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


@user_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found", "message": "User not found"}), 404

    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = data["name"].strip()
        if not name or len(name) < 2:
            return jsonify({"error": "Validation failed", "errors": {"name": "Name must be at least 2 characters"}}), 400
        user.name = name

    for field in ["phone", "address", "city", "state", "pincode"]:
        if field in data:
            setattr(user, field, (data[field] or "").strip() or None)

    db.session.commit()
    return jsonify({"message": "Profile updated successfully", "user": user.to_dict()}), 200


@user_bp.route("/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found", "message": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not user.check_password(current_password):
        return jsonify({"error": "Validation failed", "errors": {"current_password": "Current password is incorrect"}}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Validation failed", "errors": {"new_password": "New password must be at least 6 characters"}}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password changed successfully"}), 200
