import re

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def is_valid_email(email):
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))


def is_valid_password(password):
    """At least 6 characters."""
    return isinstance(password, str) and len(password) >= 6


def validate_registration_data(data):
    errors = {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not name or len(name) < 2:
        errors["name"] = "Name must be at least 2 characters long"
    if not is_valid_email(email):
        errors["email"] = "A valid email address is required"
    if not is_valid_password(password):
        errors["password"] = "Password must be at least 6 characters long"

    return errors


def validate_login_data(data):
    errors = {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not is_valid_email(email):
        errors["email"] = "A valid email address is required"
    if not password:
        errors["password"] = "Password is required"

    return errors


def validate_product_data(data, is_update=False):
    errors = {}
    name = (data.get("name") or "").strip()
    price = data.get("price")
    stock = data.get("stock")

    if not is_update or "name" in data:
        if not name:
            errors["name"] = "Product name is required"

    if not is_update or "price" in data:
        try:
            if price is None or float(price) <= 0:
                errors["price"] = "Price must be a positive number"
        except (TypeError, ValueError):
            errors["price"] = "Price must be a valid number"

    if "discount_price" in data and data.get("discount_price") not in (None, ""):
        try:
            dp = float(data.get("discount_price"))
            if price is not None and dp >= float(price):
                errors["discount_price"] = "Discount price must be less than regular price"
        except (TypeError, ValueError):
            errors["discount_price"] = "Discount price must be a valid number"

    if not is_update or "stock" in data:
        try:
            if stock is None or int(stock) < 0:
                errors["stock"] = "Stock must be zero or a positive integer"
        except (TypeError, ValueError):
            errors["stock"] = "Stock must be a valid integer"

    return errors


def validate_checkout_data(data):
    errors = {}
    required_fields = {
        "shipping_name": "Full name",
        "shipping_phone": "Phone number",
        "shipping_address": "Address",
        "shipping_city": "City",
        "shipping_state": "State",
        "shipping_pincode": "Pincode",
    }
    for field, label in required_fields.items():
        if not (data.get(field) or "").strip():
            errors[field] = f"{label} is required"

    phone = (data.get("shipping_phone") or "").strip()
    if phone and not re.match(r"^[0-9+\-\s()]{7,20}$", phone):
        errors["shipping_phone"] = "Enter a valid phone number"

    return errors
