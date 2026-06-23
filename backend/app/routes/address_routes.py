from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.address import Address

address_bp = Blueprint("addresses", __name__)

_REQUIRED = {
    "full_name":     "Full name",
    "phone":         "Phone number",
    "address_line1": "Address line 1",
    "city":          "City",
    "state":         "State",
    "pincode":       "Pincode",
}


@address_bp.route("", methods=["GET"])
@jwt_required()
def get_addresses():
    user_id = get_jwt_identity()
    addresses = (
        Address.query
        .filter_by(user_id=user_id)
        .order_by(Address.is_default.desc(), Address.id.desc())
        .all()
    )
    return jsonify({"addresses": [a.to_dict() for a in addresses]}), 200


@address_bp.route("", methods=["POST"])
@jwt_required()
def create_address():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    errors = {
        field: f"{label} is required"
        for field, label in _REQUIRED.items()
        if not (data.get(field) or "").strip()
    }
    if errors:
        return jsonify({"error": "Validation failed", "errors": errors}), 400

    is_first = Address.query.filter_by(user_id=user_id).count() == 0
    make_default = bool(data.get("is_default")) or is_first

    if make_default:
        Address.query.filter_by(user_id=user_id, is_default=True).update({"is_default": False})

    address = Address(
        user_id=user_id,
        full_name=data["full_name"].strip(),
        phone=data["phone"].strip(),
        address_line1=data["address_line1"].strip(),
        address_line2=(data.get("address_line2") or "").strip() or None,
        city=data["city"].strip(),
        state=data["state"].strip(),
        pincode=data["pincode"].strip(),
        is_default=make_default,
    )
    db.session.add(address)
    db.session.commit()
    return jsonify({"message": "Address saved", "address": address.to_dict()}), 201


@address_bp.route("/<int:address_id>", methods=["PUT"])
@jwt_required()
def update_address(address_id):
    user_id = get_jwt_identity()
    address = Address.query.filter_by(id=address_id, user_id=user_id).first()
    if not address:
        return jsonify({"error": "Not found", "message": "Address not found"}), 404

    data = request.get_json(silent=True) or {}

    if data.get("is_default"):
        Address.query.filter_by(user_id=user_id, is_default=True).update({"is_default": False})
        address.is_default = True

    for field in _REQUIRED:
        if field in data:
            value = (data[field] or "").strip()
            if not value:
                return jsonify({
                    "error": "Validation failed",
                    "errors": {field: f"{_REQUIRED[field]} is required"},
                }), 400
            setattr(address, field, value)

    if "address_line2" in data:
        address.address_line2 = (data["address_line2"] or "").strip() or None

    db.session.commit()
    return jsonify({"message": "Address updated", "address": address.to_dict()}), 200


@address_bp.route("/<int:address_id>/set-default", methods=["PUT"])
@jwt_required()
def set_default_address(address_id):
    user_id = get_jwt_identity()
    address = Address.query.filter_by(id=address_id, user_id=user_id).first()
    if not address:
        return jsonify({"error": "Not found", "message": "Address not found"}), 404

    Address.query.filter_by(user_id=user_id, is_default=True).update({"is_default": False})
    address.is_default = True
    db.session.commit()
    return jsonify({"message": "Default address updated", "address": address.to_dict()}), 200


@address_bp.route("/<int:address_id>", methods=["DELETE"])
@jwt_required()
def delete_address(address_id):
    user_id = get_jwt_identity()
    address = Address.query.filter_by(id=address_id, user_id=user_id).first()
    if not address:
        return jsonify({"error": "Not found", "message": "Address not found"}), 404

    was_default = address.is_default
    db.session.delete(address)
    db.session.flush()

    if was_default:
        next_address = (
            Address.query
            .filter_by(user_id=user_id)
            .order_by(Address.id.desc())
            .first()
        )
        if next_address:
            next_address.is_default = True

    db.session.commit()
    return jsonify({"message": "Address deleted"}), 200
