"""
Seed script — adds 4 new categories and 37 new products.

Run from the backend/ directory:
    python seed_catalog.py

Safe to re-run: categories and products are skipped if their slug / SKU
already exists.  Nothing already in the database is modified.

Images: every product gets a stable Picsum placeholder URL seeded by its SKU
(https://picsum.photos/seed/<SKU>/800/800).  The frontend handles external
https:// URLs natively, so no file download is needed.
"""

import sys
import os

# ── make sure the backend package is on the path ─────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.category import Category
from app.models.product import Product
from app.utils.helpers import slugify

# ─────────────────────────────────────────────────────────────────────────────
# DATA
# ─────────────────────────────────────────────────────────────────────────────

NEW_CATEGORIES = [
    {
        "name": "Beauty & Personal Care",
        "slug": "beauty-personal-care",
        "description": "Skincare, haircare, fragrances and personal grooming essentials",
    },
    {
        "name": "Toys & Games",
        "slug": "toys-games",
        "description": "Educational toys, board games, puzzles and remote-control vehicles",
    },
    {
        "name": "Automotive",
        "slug": "automotive",
        "description": "Car accessories, dash cams, cleaning tools and seat covers",
    },
    {
        "name": "Food & Groceries",
        "slug": "food-groceries",
        "description": "Dry fruits, organic foods, teas and pantry staples",
    },
]

# Each product entry references its category by slug so the script resolves
# the correct category_id after insertion.
NEW_PRODUCTS = [
    # ── Electronics ──────────────────────────────────────────────────────────
    {
        "name": "Laptop 15.6-inch FHD Intel i5",
        "description": (
            "Thin and light laptop with a 15.6-inch Full HD IPS display, "
            "Intel Core i5 processor, 8 GB RAM and 512 GB SSD. "
            "Up to 10 hours of battery life. Ideal for students and professionals."
        ),
        "price": 52999.00,
        "discount_price": 47999.00,
        "stock": 20,
        "sku": "ELEC-003",
        "category_slug": "electronics",
    },
    {
        "name": "Smartwatch with Health Monitor",
        "description": (
            "Feature-packed smartwatch with heart-rate monitoring, SpO2 sensor, "
            "sleep tracking and 7-day battery life. Water-resistant up to 50 m. "
            "Compatible with Android and iOS."
        ),
        "price": 3999.00,
        "discount_price": 3299.00,
        "stock": 45,
        "sku": "ELEC-004",
        "category_slug": "electronics",
    },
    {
        "name": "True Wireless Earbuds with ANC",
        "description": (
            "Compact TWS earbuds featuring active noise cancellation, "
            "10 mm drivers, 6-hour playback plus 18 hours via charging case, "
            "and IPX5 sweat resistance. One-tap touch controls."
        ),
        "price": 1799.00,
        "discount_price": 1399.00,
        "stock": 60,
        "sku": "ELEC-005",
        "category_slug": "electronics",
    },
    {
        "name": '10-inch Android Tablet 64 GB',
        "description": (
            "Versatile 10-inch Android tablet with Full HD display, "
            "octa-core processor, 4 GB RAM, 64 GB storage (expandable to 256 GB) "
            "and a 7,000 mAh battery. Includes stylus holder."
        ),
        "price": 14499.00,
        "discount_price": 12999.00,
        "stock": 25,
        "sku": "ELEC-006",
        "category_slug": "electronics",
    },
    # ── Fashion ──────────────────────────────────────────────────────────────
    {
        "name": "Women's Printed Cotton Kurti",
        "description": (
            "Breathable 100% cotton kurti with a vibrant floral block print. "
            "A-line silhouette with a mandarin collar and three-quarter sleeves. "
            "Available in sizes XS–3XL."
        ),
        "price": 699.00,
        "discount_price": 549.00,
        "stock": 80,
        "sku": "FASH-003",
        "category_slug": "fashion",
    },
    {
        "name": "Men's Formal Oxford Shoes",
        "description": (
            "Classic lace-up Oxford shoes in genuine leather with a cushioned "
            "insole and anti-slip rubber outsole. Available in black and brown, "
            "sizes 6–12."
        ),
        "price": 2299.00,
        "discount_price": 1799.00,
        "stock": 35,
        "sku": "FASH-004",
        "category_slug": "fashion",
    },
    {
        "name": "Unisex Hooded Sweatshirt",
        "description": (
            "Warm fleece-lined hoodie in a relaxed fit. "
            "Double-stitched seams, kangaroo pocket and adjustable drawstring. "
            "Available in 6 colours, sizes XS–XXL."
        ),
        "price": 1299.00,
        "discount_price": 999.00,
        "stock": 70,
        "sku": "FASH-005",
        "category_slug": "fashion",
    },
    {
        "name": "Polarised Aviator Sunglasses",
        "description": (
            "UV400-protected polarised lenses with a lightweight metal frame. "
            "Reduces glare for driving and outdoor activities. "
            "Includes microfibre pouch and hard case."
        ),
        "price": 899.00,
        "discount_price": None,
        "stock": 55,
        "sku": "FASH-006",
        "category_slug": "fashion",
    },
    # ── Home & Kitchen ────────────────────────────────────────────────────────
    {
        "name": "5-Litre Electric Pressure Cooker",
        "description": (
            "14-in-1 multi-function electric pressure cooker with delay start, "
            "keep-warm and auto-seal lid. Stainless steel inner pot, "
            "dishwasher-safe. Cooks rice, dal and meat in minutes."
        ),
        "price": 3299.00,
        "discount_price": 2799.00,
        "stock": 30,
        "sku": "HOME-002",
        "category_slug": "home-kitchen",
    },
    {
        "name": "Digital Air Fryer 4.5 Litre",
        "description": (
            "Rapid-air technology air fryer with a 4.5-litre basket, "
            "8 preset cooking modes and digital touch display. "
            "Uses up to 85% less oil than traditional frying."
        ),
        "price": 5499.00,
        "discount_price": 4499.00,
        "stock": 22,
        "sku": "HOME-003",
        "category_slug": "home-kitchen",
    },
    {
        "name": "Drip Coffee Maker 1.5 Litre",
        "description": (
            "Programmable 12-cup drip coffee maker with a built-in grinder, "
            "permanent filter, thermal carafe and auto-shutoff after 40 minutes. "
            "Pause-and-pour feature for mid-brew cups."
        ),
        "price": 2199.00,
        "discount_price": 1799.00,
        "stock": 18,
        "sku": "HOME-004",
        "category_slug": "home-kitchen",
    },
    {
        "name": "King Size Cotton Bed Sheet Set",
        "description": (
            "400-thread-count pure cotton bed sheet set for king-size beds. "
            "Includes one flat sheet, one fitted sheet and two pillowcases. "
            "Soft, breathable and colour-fast. Machine washable."
        ),
        "price": 1499.00,
        "discount_price": 1199.00,
        "stock": 40,
        "sku": "HOME-005",
        "category_slug": "home-kitchen",
    },
    # ── Books ────────────────────────────────────────────────────────────────
    {
        "name": "Clean Code by Robert C. Martin",
        "description": (
            "A handbook of agile software craftsmanship. "
            "Martin teaches best practices for writing clean, readable, "
            "maintainable code with real-world examples in Java."
        ),
        "price": 799.00,
        "discount_price": 649.00,
        "stock": 50,
        "sku": "BOOK-002",
        "category_slug": "books",
    },
    {
        "name": "The Alchemist by Paulo Coelho",
        "description": (
            "A philosophical novel about a young shepherd's journey to find "
            "treasure and fulfil his Personal Legend. "
            "One of the best-selling books in history, translated into 80 languages."
        ),
        "price": 299.00,
        "discount_price": 249.00,
        "stock": 100,
        "sku": "BOOK-003",
        "category_slug": "books",
    },
    {
        "name": "The Psychology of Money by Morgan Housel",
        "description": (
            "Nineteen timeless lessons on wealth, greed and happiness. "
            "Housel explores how people think about money and how to make "
            "better financial decisions through stories and data."
        ),
        "price": 449.00,
        "discount_price": 379.00,
        "stock": 75,
        "sku": "BOOK-004",
        "category_slug": "books",
    },
    {
        "name": "Atomic Habits by James Clear",
        "description": (
            "Practical strategies for building good habits and breaking bad ones. "
            "Clear explains the science of habit formation and presents "
            "a proven framework for making tiny changes that deliver remarkable results."
        ),
        "price": 499.00,
        "discount_price": 399.00,
        "stock": 90,
        "sku": "BOOK-005",
        "category_slug": "books",
    },
    # ── Sports & Fitness ─────────────────────────────────────────────────────
    {
        "name": "Whey Protein Powder 1 kg — Chocolate",
        "description": (
            "24 g of protein per serving with added BCAA and digestive enzymes. "
            "Low sugar, instantised for smooth mixing. "
            "Suitable for post-workout recovery and muscle building."
        ),
        "price": 1599.00,
        "discount_price": 1399.00,
        "stock": 55,
        "sku": "SPRT-003",
        "category_slug": "sports-fitness",
    },
    {
        "name": "Speed Jump Rope with Digital Counter",
        "description": (
            "Adjustable-length aluminium skipping rope with ball bearings "
            "for smooth, tangle-free rotation and a built-in digital rep counter. "
            "Ideal for cardio, HIIT and boxing training."
        ),
        "price": 399.00,
        "discount_price": 299.00,
        "stock": 85,
        "sku": "SPRT-004",
        "category_slug": "sports-fitness",
    },
    {
        "name": "Resistance Bands Set — 5 Levels",
        "description": (
            "Set of 5 latex resistance bands ranging from 5 lb to 50 lb. "
            "Ideal for strength training, physical therapy and home workouts. "
            "Includes carry bag and exercise guide."
        ),
        "price": 699.00,
        "discount_price": 549.00,
        "stock": 65,
        "sku": "SPRT-005",
        "category_slug": "sports-fitness",
    },
    {
        "name": "Kashmir Willow Cricket Bat — Full Size",
        "description": (
            "Full-size Grade-A Kashmir willow cricket bat with a reinforced "
            "toe guard, cane handle and pre-oiled blade. "
            "Weight: 1.1–1.3 kg. Suitable for leather and tennis balls."
        ),
        "price": 1299.00,
        "discount_price": None,
        "stock": 30,
        "sku": "SPRT-006",
        "category_slug": "sports-fitness",
    },
    # ── Beauty & Personal Care ────────────────────────────────────────────────
    {
        "name": "Vitamin C Face Wash 100 ml",
        "description": (
            "Gentle foaming face wash with 2% Vitamin C and niacinamide. "
            "Removes impurities, brightens skin and reduces dark spots. "
            "Sulphate-free, suitable for all skin types."
        ),
        "price": 299.00,
        "discount_price": 249.00,
        "stock": 120,
        "sku": "BEAU-001",
        "category_slug": "beauty-personal-care",
    },
    {
        "name": "Mineral SPF 50 Sunscreen Lotion 100 ml",
        "description": (
            "Lightweight, non-greasy broad-spectrum SPF 50 sunscreen "
            "with zinc oxide and titanium dioxide. "
            "Water-resistant for 80 minutes. Fragrance-free, dermatologist-tested."
        ),
        "price": 349.00,
        "discount_price": None,
        "stock": 95,
        "sku": "BEAU-002",
        "category_slug": "beauty-personal-care",
    },
    {
        "name": "Professional Hair Dryer 2000 W",
        "description": (
            "Ionic hair dryer with 2,000 W motor, three heat settings, "
            "two speed modes and a cool-shot button. "
            "Includes diffuser and concentrator attachments. Frizz-free finish."
        ),
        "price": 1299.00,
        "discount_price": 999.00,
        "stock": 40,
        "sku": "BEAU-003",
        "category_slug": "beauty-personal-care",
    },
    {
        "name": "Eau de Parfum 100 ml — Woody Musk",
        "description": (
            "Long-lasting unisex fragrance with top notes of bergamot and pepper, "
            "heart notes of cedarwood and vetiver, and a base of musk and amber. "
            "Lasts 8–10 hours. Comes in a premium glass bottle."
        ),
        "price": 1899.00,
        "discount_price": 1599.00,
        "stock": 35,
        "sku": "BEAU-004",
        "category_slug": "beauty-personal-care",
    },
    {
        "name": "Hydrating Night Repair Cream 50 g",
        "description": (
            "Rich overnight moisturiser with hyaluronic acid, retinol and "
            "shea butter. Repairs skin barrier while you sleep, reduces fine lines "
            "and leaves skin plump by morning. Suitable for dry and combination skin."
        ),
        "price": 599.00,
        "discount_price": 499.00,
        "stock": 70,
        "sku": "BEAU-005",
        "category_slug": "beauty-personal-care",
    },
    # ── Toys & Games ─────────────────────────────────────────────────────────
    {
        "name": "Creative Building Blocks Set — 500 Pieces",
        "description": (
            "STEM-focused interlocking building blocks with 500 colourful pieces "
            "compatible with major brick brands. "
            "Includes 3 instruction booklets for beginner, intermediate and advanced builds. "
            "Suitable for ages 6 and above."
        ),
        "price": 999.00,
        "discount_price": 799.00,
        "stock": 45,
        "sku": "TOYS-001",
        "category_slug": "toys-games",
    },
    {
        "name": "Strategy Board Game — Family Edition",
        "description": (
            "Classic property-trading strategy board game for 2–6 players aged 8+. "
            "Includes gameboard, 8 tokens, dice, property cards and play money. "
            "Average play time: 60–120 minutes."
        ),
        "price": 799.00,
        "discount_price": 649.00,
        "stock": 38,
        "sku": "TOYS-002",
        "category_slug": "toys-games",
    },
    {
        "name": "Remote Control Racing Car 1:16 Scale",
        "description": (
            "High-speed 1:16 scale RC racing car with 2.4 GHz radio control, "
            "40 km/h top speed, shock-absorber suspension and rechargeable battery. "
            "Range: 50 m. Suitable for ages 8 and above."
        ),
        "price": 1499.00,
        "discount_price": 1199.00,
        "stock": 28,
        "sku": "TOYS-003",
        "category_slug": "toys-games",
    },
    {
        "name": "Wooden Jigsaw Puzzle Set — 6 Puzzles",
        "description": (
            "Set of 6 wooden jigsaw puzzles with 25 to 100 pieces each. "
            "Features animals, landmarks and geometric patterns. "
            "Develops fine motor skills and problem-solving. Ages 3–8."
        ),
        "price": 549.00,
        "discount_price": None,
        "stock": 60,
        "sku": "TOYS-004",
        "category_slug": "toys-games",
    },
    # ── Automotive ────────────────────────────────────────────────────────────
    {
        "name": "Universal Car Phone Mount — Dashboard",
        "description": (
            "Adjustable gravity-lock phone mount fits dashboards and windscreens. "
            "Compatible with phones 4–7 inches wide. "
            "360-degree rotation, one-handed operation, no adhesive required."
        ),
        "price": 399.00,
        "discount_price": 299.00,
        "stock": 100,
        "sku": "AUTO-001",
        "category_slug": "automotive",
    },
    {
        "name": "Full HD 1080p Dash Camera",
        "description": (
            "Loop-recording dashboard camera with Full HD 1080p at 30 fps, "
            "140-degree wide-angle lens, night vision, G-sensor for collision detection "
            "and parking monitor. Supports up to 128 GB microSD."
        ),
        "price": 2499.00,
        "discount_price": 1999.00,
        "stock": 32,
        "sku": "AUTO-002",
        "category_slug": "automotive",
    },
    {
        "name": "Portable Car Vacuum Cleaner 12V",
        "description": (
            "Compact 120 W car vacuum with 12 V DC plug, 5 m cable and "
            "three attachments (crevice, brush, upholstery). "
            "HEPA filter, washable dust canister. Wet and dry pickup."
        ),
        "price": 899.00,
        "discount_price": 749.00,
        "stock": 48,
        "sku": "AUTO-003",
        "category_slug": "automotive",
    },
    {
        "name": "Car Seat Cover Set — 5 Pieces",
        "description": (
            "Universal-fit PU leather seat cover set for front and rear seats "
            "(5-piece set). Waterproof, dustproof, easy to wipe clean. "
            "Compatible with most sedans and hatchbacks."
        ),
        "price": 1799.00,
        "discount_price": 1499.00,
        "stock": 25,
        "sku": "AUTO-004",
        "category_slug": "automotive",
    },
    # ── Food & Groceries ─────────────────────────────────────────────────────
    {
        "name": "Premium California Almonds 500 g",
        "description": (
            "Jumbo-grade raw California almonds, naturally dried with no added oil "
            "or preservatives. Rich in vitamin E, magnesium and healthy fats. "
            "Resealable zip pouch for freshness."
        ),
        "price": 499.00,
        "discount_price": 429.00,
        "stock": 150,
        "sku": "FOOD-001",
        "category_slug": "food-groceries",
    },
    {
        "name": "Raw Organic Forest Honey 500 g",
        "description": (
            "Unprocessed, unfiltered wildflower honey sourced from the forests "
            "of Uttarakhand. No added sugar or artificial flavours. "
            "Rich in antioxidants and natural enzymes."
        ),
        "price": 399.00,
        "discount_price": None,
        "stock": 80,
        "sku": "FOOD-002",
        "category_slug": "food-groceries",
    },
    {
        "name": "Himalayan Green Tea — 100 Bags",
        "description": (
            "Single-origin green tea from the Kangra Valley, Himachal Pradesh. "
            "Light, grassy flavour with floral notes. "
            "Rich in catechins and L-theanine. Individually wrapped, no staples."
        ),
        "price": 299.00,
        "discount_price": 249.00,
        "stock": 110,
        "sku": "FOOD-003",
        "category_slug": "food-groceries",
    },
    {
        "name": "Extra Long Grain Basmati Rice 5 kg",
        "description": (
            "Premium aged (2-year) extra-long grain basmati rice from the "
            "foothills of the Himalayas. Low GI, naturally fragrant, "
            "non-GMO and gluten-free. Cooks fluffy and non-sticky."
        ),
        "price": 699.00,
        "discount_price": 599.00,
        "stock": 200,
        "sku": "FOOD-004",
        "category_slug": "food-groceries",
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# SEED LOGIC
# ─────────────────────────────────────────────────────────────────────────────

def seed():
    app = create_app()
    with app.app_context():
        # ── 1. Insert new categories ──────────────────────────────────────────
        print("=" * 60)
        print("CATEGORIES")
        print("=" * 60)
        cat_ids = {}  # slug -> id  (covers both existing and newly inserted)

        for cat_data in NEW_CATEGORIES:
            existing = Category.query.filter_by(slug=cat_data["slug"]).first()
            if existing:
                print(f"  SKIP  {cat_data['name']} (already exists, id={existing.id})")
                cat_ids[cat_data["slug"]] = existing.id
            else:
                cat = Category(
                    name=cat_data["name"],
                    slug=cat_data["slug"],
                    description=cat_data["description"],
                )
                db.session.add(cat)
                db.session.flush()          # get the auto-assigned id before commit
                cat_ids[cat_data["slug"]] = cat.id
                print(f"  INSERT  {cat_data['name']} -> id={cat.id}")

        # Also index existing categories by slug so product lookups work
        for cat in Category.query.all():
            cat_ids.setdefault(cat.slug, cat.id)

        db.session.commit()
        print()

        # ── 2. Insert new products ────────────────────────────────────────────
        print("=" * 60)
        print("PRODUCTS")
        print("=" * 60)
        inserted = 0
        skipped = 0

        for p in NEW_PRODUCTS:
            sku = p["sku"]

            # skip if SKU already exists
            if Product.query.filter_by(sku=sku).first():
                print(f"  SKIP  {sku}  {p['name'][:45]}")
                skipped += 1
                continue

            cat_id = cat_ids.get(p["category_slug"])
            if cat_id is None:
                print(f"  ERROR  {sku}: category slug '{p['category_slug']}' not found — skipping")
                skipped += 1
                continue

            # generate a unique slug from the product name
            base_slug = slugify(p["name"])
            slug = base_slug
            counter = 1
            while Product.query.filter_by(slug=slug).first():
                slug = f"{base_slug}-{counter}"
                counter += 1

            image_url = f"https://picsum.photos/seed/{sku}/800/800"

            product = Product(
                name=p["name"],
                slug=slug,
                description=p["description"],
                price=p["price"],
                discount_price=p.get("discount_price"),
                stock=p["stock"],
                sku=sku,
                category_id=cat_id,
                image_url=image_url,
                is_active=True,
            )
            db.session.add(product)
            db.session.flush()
            print(f"  INSERT  {sku}  {p['name'][:45]}  -> id={product.id}")
            inserted += 1

        db.session.commit()

        # ── 3. Summary ────────────────────────────────────────────────────────
        print()
        print("=" * 60)
        total_cats = Category.query.count()
        total_prods = Product.query.count()
        print(f"Done.  Inserted {inserted} products  (skipped {skipped})")
        print(f"DB now has {total_cats} categories and {total_prods} products.")
        print("=" * 60)


if __name__ == "__main__":
    seed()
