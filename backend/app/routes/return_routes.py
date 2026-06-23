from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.order import Order
from app.models.return_request import ReturnRequest
from app.utils.decorators import admin_required

return_bp = Blueprint("returns", __name__)              # user routes, url_prefix=/api/orders
admin_return_bp = Blueprint("admin_returns", __name__)  # admin routes, url_prefix=/api/admin/returns

VALID_REASONS = {
    'Damaged product', 'Wrong item received', 'Not as described', 'Changed my mind', 'Other'
}


# ------------------ USER ROUTES ------------------

@return_bp.route("/<int:order_id>/return", methods=["POST"])
@jwt_required()
def create_return(order_id):
    user_id = get_jwt_identity()
    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    if not order:
        return jsonify({"error": "Not found", "message": "Order not found"}), 404

    if order.status != "delivered":
        return jsonify({"error": "Not allowed", "message": "Returns can only be requested for delivered orders"}), 400

    if order.return_request:
        return jsonify({"error": "Already requested", "message": "A return request already exists for this order"}), 400

    data = request.get_json(silent=True) or {}
    reason = (data.get("reason") or "").strip()
    description = (data.get("description") or "").strip() or None

    if reason not in VALID_REASONS:
        return jsonify({"error": "Validation failed", "errors": {"reason": "A valid reason is required"}}), 400

    rr = ReturnRequest(order_id=order.id, user_id=user_id, reason=reason, description=description, status="Requested")
    db.session.add(rr)
    db.session.commit()
    return jsonify({"message": "Return request submitted", "return_request": rr.to_dict()}), 201


@return_bp.route("/<int:order_id>/return", methods=["GET"])
@jwt_required()
def get_return(order_id):
    user_id = get_jwt_identity()
    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    if not order:
        return jsonify({"error": "Not found", "message": "Order not found"}), 404
    return jsonify({"return_request": order.return_request.to_dict() if order.return_request else None}), 200


# ------------------ ADMIN ROUTES ------------------

@admin_return_bp.route("", methods=["GET"])
@admin_required()
def list_returns():
    returns = ReturnRequest.query.order_by(ReturnRequest.created_at.desc()).all()
    data = []
    for rr in returns:
        d = rr.to_dict()
        order = rr.order
        d["order"] = order.to_dict() if order else None
        d["customer_name"] = order.user.name if order and order.user else None
        d["customer_email"] = order.user.email if order and order.user else None
        data.append(d)
    return jsonify({"returns": data}), 200


@admin_return_bp.route("/<int:return_id>/approve", methods=["PUT"])
@admin_required()
def approve_return(return_id):
    rr = ReturnRequest.query.get(return_id)
    if not rr:
        return jsonify({"error": "Not found", "message": "Return request not found"}), 404

    data = request.get_json(silent=True) or {}
    note = (data.get("admin_note") or "").strip() or None

    rr.status = "Approved"
    if note:
        rr.admin_note = note
    db.session.commit()
    return jsonify({"message": "Return approved", "return_request": rr.to_dict()}), 200


@admin_return_bp.route("/<int:return_id>/reject", methods=["PUT"])
@admin_required()
def reject_return(return_id):
    rr = ReturnRequest.query.get(return_id)
    if not rr:
        return jsonify({"error": "Not found", "message": "Return request not found"}), 404

    data = request.get_json(silent=True) or {}
    note = (data.get("admin_note") or "").strip()
    if not note:
        return jsonify({"error": "Validation failed", "errors": {"admin_note": "A rejection note is required"}}), 400

    rr.status = "Rejected"
    rr.admin_note = note
    db.session.commit()
    return jsonify({"message": "Return rejected", "return_request": rr.to_dict()}), 200
