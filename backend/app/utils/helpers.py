import os
import re
import uuid
from flask import current_app


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or str(uuid.uuid4())[:8]


def generate_unique_slug(model, base_text, exclude_id=None):
    base_slug = slugify(base_text)
    slug = base_slug
    counter = 1
    query = model.query.filter_by(slug=slug)
    if exclude_id:
        query = query.filter(model.id != exclude_id)
    while query.first() is not None:
        slug = f"{base_slug}-{counter}"
        counter += 1
        query = model.query.filter_by(slug=slug)
        if exclude_id:
            query = query.filter(model.id != exclude_id)
    return slug


def allowed_file(filename):
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in current_app.config["ALLOWED_EXTENSIONS"]


def save_product_image(file_storage):
    """Saves an uploaded image file and returns the public URL path."""
    if not file_storage or file_storage.filename == "":
        return None
    if not allowed_file(file_storage.filename):
        raise ValueError("Invalid file type. Allowed: png, jpg, jpeg, webp, gif")

    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_name)
    file_storage.save(save_path)
    return f"/uploads/products/{unique_name}"


_REVIEW_ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def save_review_image(file_storage):
    """Saves an uploaded review photo and returns the public URL path."""
    if not file_storage or file_storage.filename == "":
        return None
    ext = file_storage.filename.rsplit(".", 1)[-1].lower() if "." in file_storage.filename else ""
    if ext not in _REVIEW_ALLOWED_EXTENSIONS:
        raise ValueError("Invalid file type. Allowed: jpg, jpeg, png, webp")
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(current_app.config["REVIEW_UPLOAD_FOLDER"], unique_name)
    file_storage.save(save_path)
    return f"/uploads/reviews/{unique_name}"


def delete_product_image(image_url):
    if not image_url:
        return
    filename = image_url.rsplit("/", 1)[-1]
    file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass


def generate_sku(category_prefix="PROD"):
    return f"{category_prefix.upper()[:4]}-{uuid.uuid4().hex[:8].upper()}"
