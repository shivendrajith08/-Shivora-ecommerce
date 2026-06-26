"""
One-time backfill: assigns user_order_number to all existing orders.
Run from the backend/ directory after flask db upgrade:
    python backfill_user_order_numbers.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.order import Order

app = create_app()
with app.app_context():
    users_orders = {}
    orders = Order.query.order_by(Order.user_id, Order.created_at.asc()).all()
    for order in orders:
        uid = order.user_id
        users_orders[uid] = users_orders.get(uid, 0) + 1
        order.user_order_number = users_orders[uid]
    db.session.commit()
    print(f"Backfilled user_order_number for {len(orders)} order(s) across {len(users_orders)} user(s).")
