"""
Downloads matching Pexels stock photos for the 37 products added by seed_catalog.py
(product IDs 9–45) and updates each product's image_url in MySQL.

All photos sourced from Pexels (free to use under the Pexels License).
Run from the backend/ directory:
    python update_new_product_images.py
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

# ── Upload folder ─────────────────────────────────────────────────────────────
UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "app", "uploads", "products"
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://www.pexels.com/",
}

# ── Product -> Pexels photo mapping ──────────────────────────────────────────
# (db_product_id, pexels_photo_id, filename_slug, label)
#
# Electronics
#   265087   Gray and Black Laptop Computer
#   110471   Space Gray Apple Watch on Wrist
#   8380433  Close-up Photo of White TWS Earbuds (product photography)
#   186464   White Android Tablet Displaying a Graph
#
# Fashion
#   17503286 Model Wearing Traditional Indian Clothing at a Fashion Show
#   2112753  Pair of Black Patent Leather Shoes
#   572463   Person in Gray Pullover Hoodie Photography
#   917597   Man Wearing Black Aviator Sunglasses
#
# Home & Kitchen
#   3768169  Stainless Steel Cooking Pot on Stove
#   35285814 Air fryer appliance (from Pexels air-fryer search)
#   7125760  Faceless Barista Pouring Coffee into Dripper
#   9615237  Clean white bed with white pillows in a bedroom
#
# Books
#   1181359  Woman Programming on a Notebook (Clean Code)
#   46274    Book Opened on White Surface Selective Focus (The Alchemist)
#   5598988  Man Reading a Book (Psychology of Money)
#   26185817 Top View of Open Book (Atomic Habits)
#
# Sports & Fitness
#   6551143  Ethnic Sportsman Standing with Protein Jar and Water Bottle
#   6339602  Person Doing Jump Rope
#   4397831  Set of Fitness Equipment Placed on Marble Surface (includes bands)
#   20652481 Cricket Bat and Ball
#
# Beauty & Personal Care
#   5797999  Skincare Product in Bottle on White Table
#   5163352  Woman Applying Sunscreen Lotion
#   7518702  Close-Up Shot of a Hair Dryer
#   1190829  Clear Glass Perfume Bottle
#   3735626  Beauty Products on Table (cream/skincare jars)
#
# Toys & Games
#   4887167  Close-up of Lego Blocks (colorful building blocks)
#   1329644  Close Up Photo of Monopoly Game Items
#   12765684 RC car (from Pexels rc-car search)
#   4493204  Wooden Puzzle Pieces of a Map
#
# Automotive
#   694424   Close-Up Photography of iPhone mounted on car dashboard
#   12474705 View of the Road from the Windshield of a Car (dash cam POV)
#   5233285  A Person Deep Cleaning a Car Seat (car vacuum context)
#   10054684 Photo of Black Car Seats
#
# Food & Groceries
#   1013420  Close-Up Photography of Almond Nuts
#   4480158  Jar of Honey (glass jar with golden honey)
#   8474179  Green Tea on the Table
#   1311771  Bowl of Rice

PRODUCT_PHOTOS = [
    # ── Electronics ──────────────────────────────────────────────────────────
    (9,  265087,    "laptop",          "Laptop 15.6-inch FHD Intel i5"),
    (10, 110471,    "smartwatch",      "Smartwatch with Health Monitor"),
    (11, 8380433,   "earbuds",         "True Wireless Earbuds with ANC"),
    (12, 186464,    "tablet",          "10-inch Android Tablet 64 GB"),
    # ── Fashion ──────────────────────────────────────────────────────────────
    (13, 17503286,  "kurti",           "Women's Printed Cotton Kurti"),
    (14, 2112753,   "formal_shoes",    "Men's Formal Oxford Shoes"),
    (15, 572463,    "hoodie",          "Unisex Hooded Sweatshirt"),
    (16, 917597,    "sunglasses",      "Polarised Aviator Sunglasses"),
    # ── Home & Kitchen ────────────────────────────────────────────────────────
    (17, 3768169,   "pressure_cooker", "5-Litre Electric Pressure Cooker"),
    (18, 35285814,  "air_fryer",       "Digital Air Fryer 4.5 Litre"),
    (19, 7125760,   "coffee_maker",    "Drip Coffee Maker 1.5 Litre"),
    (20, 9615237,   "bed_sheets",      "King Size Cotton Bed Sheet Set"),
    # ── Books ────────────────────────────────────────────────────────────────
    (21, 1181359,   "clean_code",      "Clean Code by Robert C. Martin"),
    (22, 46274,     "alchemist",       "The Alchemist by Paulo Coelho"),
    (23, 5598988,   "psych_money",     "The Psychology of Money"),
    (24, 26185817,  "atomic_habits",   "Atomic Habits by James Clear"),
    # ── Sports & Fitness ─────────────────────────────────────────────────────
    (25, 6551143,   "protein_powder",  "Whey Protein Powder 1 kg"),
    (26, 6339602,   "jump_rope",       "Speed Jump Rope with Digital Counter"),
    (27, 4397831,   "resistance_bands","Resistance Bands Set 5 Levels"),
    (28, 20652481,  "cricket_bat",     "Kashmir Willow Cricket Bat"),
    # ── Beauty & Personal Care ────────────────────────────────────────────────
    (29, 5797999,   "face_wash",       "Vitamin C Face Wash 100 ml"),
    (30, 5163352,   "sunscreen",       "Mineral SPF 50 Sunscreen Lotion"),
    (31, 7518702,   "hair_dryer",      "Professional Hair Dryer 2000 W"),
    (32, 1190829,   "perfume",         "Eau de Parfum 100 ml Woody Musk"),
    (33, 3735626,   "night_cream",     "Hydrating Night Repair Cream"),
    # ── Toys & Games ─────────────────────────────────────────────────────────
    (34, 4887167,   "building_blocks", "Creative Building Blocks Set"),
    (35, 1329644,   "board_game",      "Strategy Board Game Family Edition"),
    (36, 12765684,  "rc_car",          "Remote Control Racing Car 1:16 Scale"),
    (37, 4493204,   "wooden_puzzle",   "Wooden Jigsaw Puzzle Set"),
    # ── Automotive ────────────────────────────────────────────────────────────
    (38, 694424,    "phone_mount",     "Universal Car Phone Mount Dashboard"),
    (39, 12474705,  "dash_cam",        "Full HD 1080p Dash Camera"),
    (40, 5233285,   "car_vacuum",      "Portable Car Vacuum Cleaner 12V"),
    (41, 10054684,  "seat_covers",     "Car Seat Cover Set 5 Pieces"),
    # ── Food & Groceries ─────────────────────────────────────────────────────
    (42, 1013420,   "almonds",         "Premium California Almonds 500 g"),
    (43, 4480158,   "honey",           "Raw Organic Forest Honey 500 g"),
    (44, 8474179,   "green_tea",       "Himalayan Green Tea 100 Bags"),
    (45, 1311771,   "basmati_rice",    "Extra Long Grain Basmati Rice 5 kg"),
]


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
                    if len(data) < 1000:        # too small -> error page
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
    failed = []

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
                failed.append((product_id, label))

    print(f"\nDone: {ok}/{len(PRODUCT_PHOTOS)} products updated.")
    if failed:
        print("\nFailed products (still have Picsum placeholder URLs):")
        for pid, lbl in failed:
            print(f"  [{pid}] {lbl}")


if __name__ == "__main__":
    main()
