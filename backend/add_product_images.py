"""
add_product_images.py

Downloads a placeholder photo for each seeded product from Picsum Photos
(https://picsum.photos - free, no API key required) and updates the
product's image_url in the database directly via SQLAlchemy.

NOTE: Picsum gives random stock photos, not images that actually match
each product (e.g. the headphones product might get a photo of a
landscape). This is purely cosmetic -- it replaces the gray "no image"
placeholder icon with *some* real photo, so the site looks more finished.
For genuinely matching product photos, search free sites like Pexels or
Unsplash manually and upload them through the admin "Edit Product" form.

Run this from inside the backend/ folder, with the venv activated:
    python add_product_images.py

Requires: requests (already installed if you ran pip install -r requirements.txt;
otherwise: pip install requests)
"""
import os
import sys
import uuid
import requests

sys.path.insert(0, os.getcwd())

from app import create_app
from app.extensions import db
from app.models.product import Product

PRODUCT_SEEDS = {
    "ELEC-001": "shopease-headphones",
    "ELEC-002": "shopease-smartphone",
    "FASH-001": "shopease-tshirt",
    "FASH-002": "shopease-shoes",
    "HOME-001": "shopease-cookware",
    "BOOK-001": "shopease-book",
    "SPRT-001": "shopease-yogamat",
    "SPRT-002": "shopease-dumbbells",
}

UPLOAD_DIR = os.path.join(os.getcwd(), "app", "uploads", "products")


def download_image(seed, save_path):
    url = f"https://picsum.photos/seed/{seed}/500/500"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    resp = requests.get(url, headers=headers, timeout=20, allow_redirects=True)
    resp.raise_for_status()
    content_type = resp.headers.get("Content-Type", "")
    if "image" not in content_type:
        raise ValueError(f"Response was not an image (Content-Type: {content_type})")
    with open(save_path, "wb") as f:
        f.write(resp.content)


def main():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    app = create_app()

    with app.app_context():
        updated = 0
        skipped = 0
        failed = 0

        for sku, seed in PRODUCT_SEEDS.items():
            product = Product.query.filter_by(sku=sku).first()
            if not product:
                print(f"  [SKIP] No product found with SKU {sku}")
                skipped += 1
                continue

            filename = f"{uuid.uuid4().hex}.jpg"
            save_path = os.path.join(UPLOAD_DIR, filename)

            try:
                print(f"  Downloading placeholder image for '{product.name}'...")
                download_image(seed, save_path)
                product.image_url = f"/uploads/products/{filename}"
                db.session.commit()
                print(f"  [OK] {product.name} -> {product.image_url}")
                updated += 1
            except Exception as e:
                print(f"  [FAIL] Could not get image for '{product.name}': {e}")
                failed += 1

        print()
        print(f"Done. Updated: {updated}, Skipped: {skipped}, Failed: {failed}")
        print("Refresh your browser (hard refresh: Ctrl+Shift+R) to see the new images.")


if __name__ == "__main__":
    main()