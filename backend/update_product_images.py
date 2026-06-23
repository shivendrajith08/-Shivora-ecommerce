"""
Downloads matching free stock photos from Pexels CDN for each product
and updates the product image_url in MySQL.

Pexels photos used (all free to use under Pexels License):
  1  Wireless Headphones  -> Pexels #5081398
  2  Smartphone           -> Pexels #163065
  3  Men's T-Shirt        -> Pexels #2769290
  4  Running Shoes        -> Pexels #1027130
  5  Cookware Set         -> Pexels #2544829
  6  Programming Book     -> Pexels #270488
  7  Yoga Mat             -> Pexels #6740753
  8  Dumbbells            -> Pexels #2652236
"""

import os
import sys
import uuid
import pymysql
import urllib.request
import urllib.error

# ── DB config (matches backend/.env) ─────────────────────────────────────────
DB_HOST     = "localhost"
DB_PORT     = 3306
DB_USER     = "root"
DB_PASSWORD = "NewPass123"
DB_NAME     = "ecommerce_db"

# ── Upload folder (same path Flask uses) ─────────────────────────────────────
UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "app", "uploads", "products"
)

# ── Product → Pexels photo mapping ───────────────────────────────────────────
# (db_product_id, pexels_photo_id, filename_slug, product_label)
PRODUCT_PHOTOS = [
    (1, 5081398,  "headphones",   "Wireless Bluetooth Headphones"),
    (2, 1482061,  "smartphone",   "Smartphone 128GB"),
    (3, 2769290,  "tshirt",       "Men's Cotton T-Shirt"),
    (4, 1027130,  "running_shoes","Women's Running Shoes"),
    (5, 2544829,  "cookware",     "Non-Stick Cookware Set"),
    (6, 270488,   "prog_book",    "The Pragmatic Programmer"),
    (7, 6740753,  "yoga_mat",     "Yoga Mat Premium"),
    (8, 2652236,  "dumbbells",    "Adjustable Dumbbells Set"),
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://www.pexels.com/",
}


def download_pexels_photo(photo_id: int, slug: str) -> str | None:
    """Try common Pexels CDN extensions; return saved filename or None."""
    for ext in ("jpeg", "jpg", "png", "webp"):
        url = (
            f"https://images.pexels.com/photos/{photo_id}"
            f"/pexels-photo-{photo_id}.{ext}"
            f"?auto=compress&cs=tinysrgb&w=800"
        )
        filename = f"{slug}_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                if resp.status == 200:
                    data = resp.read()
                    if len(data) < 1000:          # too small → probably an error page
                        continue
                    with open(filepath, "wb") as fh:
                        fh.write(data)
                    print(f"    saved  {filename}  ({len(data)//1024} KB)")
                    return filename
        except (urllib.error.HTTPError, urllib.error.URLError, OSError) as err:
            print(f"    {ext}: {err}")

    return None


def main():
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # ── Connect to MySQL ──────────────────────────────────────────────────────
    try:
        conn = pymysql.connect(
            host=DB_HOST, port=DB_PORT,
            user=DB_USER, password=DB_PASSWORD,
            database=DB_NAME, charset="utf8mb4",
            autocommit=False,
        )
        print("Connected to MySQL\n")
    except pymysql.Error as exc:
        print(f"MySQL connection failed: {exc}")
        sys.exit(1)

    ok = 0
    with conn:
        for product_id, photo_id, slug, label in PRODUCT_PHOTOS:
            print(f"[{product_id}] {label}  (Pexels #{photo_id})")
            filename = download_pexels_photo(photo_id, slug)

            if filename:
                image_url = f"/uploads/products/{filename}"
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE products SET image_url = %s WHERE id = %s",
                        (image_url, product_id),
                    )
                conn.commit()
                print(f"    DB updated -> {image_url}")
                ok += 1
            else:
                print(f"    FAILED – no image downloaded for product {product_id}")

    print(f"\nDone: {ok}/{len(PRODUCT_PHOTOS)} products updated.")


if __name__ == "__main__":
    main()
