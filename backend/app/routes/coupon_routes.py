from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.coupon import Coupon
from app.utils.decorators import admin_required

coupon_bp = Blueprint("coupons", __name__)
admin_coupon_bp = Blueprint("admin_coupons", __name__)


# ------------------ PUBLIC (logged-in) ------------------

@coupon_bp.route("/validate", methods=["POST"])
@jwt_required()
def validate_coupon():
    data = request.get_json(silent=True) or {}
    code = data.get("code")
    try:
        order_total = float(data.get("order_total"))
    except (TypeError, ValueError):
        return jsonify({"valid": False, "error": "Invalid order total"}), 400

    # validate_for never increments used_count (that happens only on order placement)
    coupon, discount_amount, error = Coupon.validate_for(code, order_total)
    if error:
        return jsonify({"valid": False, "error": error}), 200

    return jsonify({
        "valid": True,
        "code": coupon.code,
        "discount_percent": coupon.discount_percent,
        "discount_amount": discount_amount,
        "final_total": round(order_total - discount_amount, 2),
    }), 200


# ------------------ ADMIN ------------------

def _parse_coupon_payload(data, partial=False):
    """Returns (fields_dict, errors_dict). When partial=True, only validates present keys."""
    fields = {}
    errors = {}

    if not partial or "code" in data:
        code = (data.get("code") or "").strip().upper()
        if not code:
            errors["code"] = "Code is required"
        elif len(code) > 20:
            errors["code"] = "Code must be 20 characters or fewer"
        else:
            fields["code"] = code

    if not partial or "discount_percent" in data:
        try:
            dp = int(data.get("discount_percent"))
            if dp < 1 or dp > 100:
                errors["discount_percent"] = "Discount must be between 1 and 100"
            else:
                fields["discount_percent"] = dp
        except (TypeError, ValueError):
            errors["discount_percent"] = "Discount must be a number between 1 and 100"

    if not partial or "min_order_amount" in data:
        raw = data.get("min_order_amount")
        if raw in (None, ""):
            fields["min_order_amount"] = 0
        else:
            try:
                moa = float(raw)
                if moa < 0:
                    errors["min_order_amount"] = "Minimum order amount cannot be negative"
                else:
                    fields["min_order_amount"] = moa
            except (TypeError, ValueError):
                errors["min_order_amount"] = "Minimum order amount must be a number"

    if not partial or "max_uses" in data:
        raw = data.get("max_uses")
        if raw in (None, ""):
            fields["max_uses"] = None
        else:
            try:
                mu = int(raw)
                if mu < 1:
                    errors["max_uses"] = "Max uses must be at least 1"
                else:
                    fields["max_uses"] = mu
            except (TypeError, ValueError):
                errors["max_uses"] = "Max uses must be a whole number"

    if "active" in data:
        fields["active"] = str(data.get("active")).lower() in ("true", "1", "yes") if not isinstance(data.get("active"), bool) else data.get("active")

    return fields, errors


@admin_coupon_bp.route("", methods=["GET"])
@admin_required()
def list_coupons():
    coupons = Coupon.query.order_by(Coupon.created_at.desc()).all()
    return jsonify({"coupons": [c.to_dict() for c in coupons]}), 200


@admin_coupon_bp.route("", methods=["POST"])
@admin_required()
def create_coupon():
    data = request.get_json(silent=True) or {}
    fields, errors = _parse_coupon_payload(data, partial=False)
    if errors:
        return jsonify({"error": "Validation failed", "errors": errors}), 400

    if Coupon.query.filter_by(code=fields["code"]).first():
        return jsonify({"error": "Validation failed", "errors": {"code": "Coupon code already exists"}}), 409

    coupon = Coupon(
        code=fields["code"],
        discount_percent=fields["discount_percent"],
        min_order_amount=fields.get("min_order_amount", 0),
        max_uses=fields.get("max_uses"),
        active=fields.get("active", True),
    )
    db.session.add(coupon)
    db.session.commit()
    return jsonify({"message": "Coupon created", "coupon": coupon.to_dict()}), 201


@admin_coupon_bp.route("/<int:coupon_id>", methods=["PUT"])
@admin_required()
def update_coupon(coupon_id):
    coupon = Coupon.query.get(coupon_id)
    if not coupon:
        return jsonify({"error": "Not found", "message": "Coupon not found"}), 404

    data = request.get_json(silent=True) or {}
    fields, errors = _parse_coupon_payload(data, partial=True)
    if errors:
        return jsonify({"error": "Validation failed", "errors": errors}), 400

    if "code" in fields and fields["code"] != coupon.code:
        if Coupon.query.filter_by(code=fields["code"]).first():
            return jsonify({"error": "Validation failed", "errors": {"code": "Coupon code already exists"}}), 409

    for key, value in fields.items():
        setattr(coupon, key, value)

    db.session.commit()
    return jsonify({"message": "Coupon updated", "coupon": coupon.to_dict()}), 200


@admin_coupon_bp.route("/<int:coupon_id>", methods=["DELETE"])
@admin_required()
def delete_coupon(coupon_id):
    coupon = Coupon.query.get(coupon_id)
    if not coupon:
        return jsonify({"error": "Not found", "message": "Coupon not found"}), 404
    db.session.delete(coupon)
    db.session.commit()
    return jsonify({"message": "Coupon deleted"}), 200
