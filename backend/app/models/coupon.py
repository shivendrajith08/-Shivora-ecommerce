from datetime import datetime
from app.extensions import db


class Coupon(db.Model):
    __tablename__ = "coupons"

    id               = db.Column(db.Integer, primary_key=True)
    code             = db.Column(db.String(20), nullable=False, unique=True, index=True)
    discount_percent = db.Column(db.Integer, nullable=False)
    min_order_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    max_uses         = db.Column(db.Integer)                       # NULL = unlimited
    used_count       = db.Column(db.Integer, nullable=False, default=0)
    active           = db.Column(db.Boolean, nullable=False, default=True)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def validate_for(cls, code, order_total):
        """Shared validation used by the validate endpoint AND order placement.
        Returns (coupon | None, discount_amount, error | None). Does NOT increment used_count."""
        code = (code or "").strip().upper()
        if not code:
            return None, 0.0, "Invalid coupon code"
        coupon = cls.query.filter_by(code=code).first()
        if not coupon:
            return None, 0.0, "Invalid coupon code"
        if not coupon.active:
            return None, 0.0, "Coupon is inactive"
        if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
            return None, 0.0, "Coupon usage limit reached"
        min_amount = float(coupon.min_order_amount)
        if order_total < min_amount:
            disp = int(min_amount) if min_amount == int(min_amount) else min_amount
            return None, 0.0, f"Minimum order amount is ₹{disp}"
        discount_amount = round(order_total * coupon.discount_percent / 100, 2)
        return coupon, discount_amount, None

    def to_dict(self):
        return {
            "id":               self.id,
            "code":             self.code,
            "discount_percent": self.discount_percent,
            "min_order_amount": float(self.min_order_amount),
            "max_uses":         self.max_uses,
            "used_count":       self.used_count,
            "active":           self.active,
            "created_at":       self.created_at.isoformat() if self.created_at else None,
        }
