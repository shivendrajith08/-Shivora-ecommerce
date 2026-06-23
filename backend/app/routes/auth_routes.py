from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.utils.validators import validate_registration_data, validate_login_data, is_valid_email, is_valid_password

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    errors = validate_registration_data(data)
    if errors:
        return jsonify({"error": "Validation failed", "errors": errors}), 400

    email = data.get("email").strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Validation failed", "errors": {"email": "Email is already registered"}}), 409

    user = User(
        name=data.get("name").strip(),
        email=email,
        phone=data.get("phone", "").strip() or None,
        role="user",
    )
    user.set_password(data.get("password"))

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})

    return jsonify({
        "message": "Registration successful",
        "token": access_token,
        "user": user.to_dict(),
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    errors = validate_login_data(data)
    if errors:
        return jsonify({"error": "Validation failed", "errors": errors}), 400

    email = data.get("email").strip().lower()
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials", "message": "Incorrect email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account disabled", "message": "Your account has been deactivated"}), 403

    access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})

    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    # ⚠️ DEMO-ONLY PASSWORD RESET — INSECURE BY DESIGN. DO NOT USE IN PRODUCTION.
    # This endpoint performs NO identity verification: anyone who knows an
    # account's email address can set a new password for it. There is no email
    # confirmation, no reset token, and no expiry. It exists purely to make the
    # demo flow work without an email service. A real implementation MUST send a
    # one-time, time-limited reset link/token to the account's verified email and
    # only allow the change after that token is presented.
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()
    new_password = data.get("new_password") or ""

    errors = {}
    if not is_valid_email(email):
        errors["email"] = "A valid email address is required"
    # Reuse the SAME password rule as registration (min length etc.)
    if not is_valid_password(new_password):
        errors["new_password"] = "Password must be at least 6 characters long"
    if errors:
        return jsonify({"error": "Validation failed", "errors": errors}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "No account found with that email"}), 404

    # Hash + store exactly like registration does (User.set_password)
    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password reset successful. You can now log in with your new password."}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found", "message": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
