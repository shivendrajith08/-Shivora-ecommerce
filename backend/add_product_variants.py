"""
One-time migration: adds sizes and colors JSON columns to the products table.
Run from the backend/ directory:
    python add_product_variants.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    with db.engine.connect() as conn:
        for col in ("sizes", "colors"):
            result = conn.execute(text(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'products' "
                f"AND COLUMN_NAME = '{col}'"
            ))
            if result.scalar() == 0:
                conn.execute(text(f"ALTER TABLE `products` ADD COLUMN `{col}` JSON NULL"))
                conn.commit()
                print(f"Column {col} added.")
            else:
                print(f"Column {col} already exists, skipping.")
