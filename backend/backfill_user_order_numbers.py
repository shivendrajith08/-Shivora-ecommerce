"""
One-time migration + backfill: adds user_order_number column and numbers
each user's orders chronologically starting from 1.
Run from the backend/ directory:
    python backfill_user_order_numbers.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    with db.engine.connect() as conn:
        # 1. Add column if it doesn't exist yet
        result = conn.execute(text(
            "SELECT COUNT(*) FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() "
            "AND TABLE_NAME = 'orders' "
            "AND COLUMN_NAME = 'user_order_number'"
        ))
        if result.scalar() == 0:
            conn.execute(text(
                "ALTER TABLE `orders` ADD COLUMN `user_order_number` INT NULL AFTER `user_id`"
            ))
            conn.commit()
            print("Column user_order_number added.")
        else:
            print("Column user_order_number already exists, skipping ALTER TABLE.")

        # 2. Backfill using window function (MySQL 8.0+)
        conn.execute(text("""
            UPDATE `orders` o
            JOIN (
                SELECT id,
                       ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS rn
                FROM `orders`
            ) ranked ON o.id = ranked.id
            SET o.user_order_number = ranked.rn
        """))
        conn.commit()

        count = conn.execute(text(
            "SELECT COUNT(*) FROM `orders` WHERE user_order_number IS NOT NULL"
        )).scalar()
        print(f"Backfilled user_order_number for {count} order(s).")
