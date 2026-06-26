from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.cart import Cart
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.models.coupon import Coupon
from app.utils.decorators import admin_required
from app.utils.validators import validate_checkout_data

order_bp = Blueprint("orders", __name__)

VALID_STATUSES = {"pending", "processing", "shipped", "delivered", "cancelled"}


@order_bp.route("/checkout", methods=["POST"])
@jwt_required()
def checkout():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    errors = validate_checkout_data(data)
    if errors:
        return jsonify({"error": "Validation failed", "errors": errors}), 400

    cart_items = Cart.query.filter_by(user_id=user_id).all()
    if not cart_items:
        return jsonify({"error": "Empty cart", "message": "Your cart is empty"}), 400

    # Validate stock for every item before committing anything
    for item in cart_items:
        product = item.product
        if not product or not product.is_active:
            return jsonify({"error": "Unavailable product", "message": f"A product in your cart is no longer available"}), 400
        if product.stock < item.quantity:
            return jsonify({
                "error": "Insufficient stock",
                "message": f"Sorry, only {product.stock} left in stock for {product.name}"
            }), 400

    total_amount = 0
    order_items_data = []
    for item in cart_items:
        product = item.product
        unit_price = float(product.discount_price) if product.discount_price else float(product.price)
        subtotal = round(unit_price * item.quantity, 2)
        total_amount += subtotal
        order_items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "price": unit_price,
            "quantity": item.quantity,
            "subtotal": subtotal,
        })

    subtotal_amount = round(total_amount, 2)

    # Apply coupon if provided — re-validated server-side; never trust the client total.
    applied_coupon = None
    discount_amount = 0.0
    coupon_code = data.get("coupon_code")
    if coupon_code:
        applied_coupon, discount_amount, coupon_error = Coupon.validate_for(coupon_code, subtotal_amount)
        if coupon_error:
            return jsonify({"error": "Invalid coupon", "message": coupon_error}), 400

    final_amount = round(subtotal_amount - discount_amount, 2)

    user_order_number = Order.query.filter_by(user_id=user_id).count() + 1

    order = Order(
        user_id=user_id,
        user_order_number=user_order_number,
        total_amount=final_amount,
        status="pending",
        payment_method="COD",
        shipping_name=data.get("shipping_name").strip(),
        shipping_phone=data.get("shipping_phone").strip(),
        shipping_address=data.get("shipping_address").strip(),
        shipping_city=data.get("shipping_city").strip(),
        shipping_state=data.get("shipping_state").strip(),
        shipping_pincode=data.get("shipping_pincode").strip(),
        applied_coupon_code=applied_coupon.code if applied_coupon else None,
        discount_amount=discount_amount,
    )
    db.session.add(order)
    db.session.flush()  # get order.id before commit

    for item_data in order_items_data:
        db.session.add(OrderItem(order_id=order.id, **item_data))

    # Reduce stock (atomic with this commit; never below 0)
    for item in cart_items:
        item.product.stock = max(0, item.product.stock - item.quantity)

    # Increment coupon usage ONLY on successful placement
    if applied_coupon:
        applied_coupon.used_count += 1

    # Clear cart
    Cart.query.filter_by(user_id=user_id).delete()

    db.session.commit()

    return jsonify({"message": "Order placed successfully", "order": order.to_dict()}), 201


@order_bp.route("/buy-now", methods=["POST"])
@jwt_required()
def buy_now():
    """Instant checkout for a single product — cart is never read or modified."""
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    errors = validate_checkout_data(data)

    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not product_id:
        errors["product_id"] = "Product is required"

    try:
        quantity = int(quantity)
        if quantity < 1:
            errors["quantity"] = "Quantity must be at least 1"
    except (TypeError, ValueError):
        errors["quantity"] = "Quantity must be a valid integer"

    if errors:
        return jsonify({"error": "Validation failed", "errors": errors}), 400

    product = Product.query.get(product_id)
    if not product or not product.is_active:
        return jsonify({"error": "Unavailable", "message": "Product not found or unavailable"}), 400

    if product.stock < quantity:
        return jsonify({
            "error": "Insufficient stock",
            "message": f"Sorry, only {product.stock} left in stock for {product.name}",
        }), 400

    unit_price = float(product.discount_price) if product.discount_price else float(product.price)
    subtotal = round(unit_price * quantity, 2)

    # Apply coupon if provided — re-validated server-side.
    applied_coupon = None
    discount_amount = 0.0
    coupon_code = data.get("coupon_code")
    if coupon_code:
        applied_coupon, discount_amount, coupon_error = Coupon.validate_for(coupon_code, subtotal)
        if coupon_error:
            return jsonify({"error": "Invalid coupon", "message": coupon_error}), 400

    final_amount = round(subtotal - discount_amount, 2)

    user_order_number = Order.query.filter_by(user_id=user_id).count() + 1

    order = Order(
        user_id=user_id,
        user_order_number=user_order_number,
        total_amount=final_amount,
        status="pending",
        payment_method="COD",
        shipping_name=data.get("shipping_name").strip(),
        shipping_phone=data.get("shipping_phone").strip(),
        shipping_address=data.get("shipping_address").strip(),
        shipping_city=data.get("shipping_city").strip(),
        shipping_state=data.get("shipping_state").strip(),
        shipping_pincode=data.get("shipping_pincode").strip(),
        applied_coupon_code=applied_coupon.code if applied_coupon else None,
        discount_amount=discount_amount,
    )
    db.session.add(order)
    db.session.flush()

    db.session.add(OrderItem(
        order_id=order.id,
        product_id=product.id,
        product_name=product.name,
        price=unit_price,
        quantity=quantity,
        subtotal=subtotal,
    ))

    product.stock = max(0, product.stock - quantity)  # never below 0; atomic with commit
    # Cart is intentionally not touched.

    # Increment coupon usage ONLY on successful placement
    if applied_coupon:
        applied_coupon.used_count += 1

    db.session.commit()
    return jsonify({"message": "Order placed successfully", "order": order.to_dict()}), 201


@order_bp.route("", methods=["GET"])
@jwt_required()
def get_order_history():
    user_id = get_jwt_identity()
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    return jsonify({"orders": [o.to_dict() for o in orders]}), 200


@order_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order_detail(order_id):
    user_id = get_jwt_identity()
    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    if not order:
        return jsonify({"error": "Not found", "message": "Order not found"}), 404
    return jsonify({"order": order.to_dict()}), 200


@order_bp.route("/<int:order_id>/cancel", methods=["PUT"])
@jwt_required()
def cancel_order(order_id):
    user_id = get_jwt_identity()
    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    if not order:
        return jsonify({"error": "Not found", "message": "Order not found"}), 404

    if order.status not in ("pending", "processing"):
        return jsonify({"error": "Invalid action", "message": "This order can no longer be cancelled"}), 400

    # restock items
    for item in order.items:
        if item.product:
            item.product.stock += item.quantity

    order.status = "cancelled"
    db.session.commit()
    return jsonify({"message": "Order cancelled", "order": order.to_dict()}), 200


# ------------------ ADMIN ROUTES ------------------

@order_bp.route("/admin/all", methods=["GET"])
@admin_required()
def admin_list_orders():
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    status = request.args.get("status")

    query = Order.query
    if status and status in VALID_STATUSES:
        query = query.filter_by(status=status)
    query = query.order_by(Order.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "orders": [o.to_dict(include_items=False) for o in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    }), 200


@order_bp.route("/admin/<int:order_id>", methods=["GET"])
@admin_required()
def admin_get_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Not found", "message": "Order not found"}), 404
    return jsonify({"order": order.to_dict()}), 200


@order_bp.route("/admin/<int:order_id>/status", methods=["PUT"])
@admin_required()
def admin_update_order_status(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Not found", "message": "Order not found"}), 404

    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    if new_status not in VALID_STATUSES:
        return jsonify({"error": "Validation failed", "errors": {"status": f"Status must be one of {sorted(VALID_STATUSES)}"}}), 400

    if new_status == "cancelled" and order.status != "cancelled":
        for item in order.items:
            if item.product:
                item.product.stock += item.quantity

    order.status = new_status
    db.session.commit()
    return jsonify({"message": "Order status updated", "order": order.to_dict()}), 200
