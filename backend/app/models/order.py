from datetime import datetime
from app.extensions import db


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(
        db.Enum("pending", "processing", "shipped", "delivered", "cancelled", name="order_status"),
        nullable=False,
        default="pending",
    )
    payment_method = db.Column(db.String(50), nullable=False, default="COD")
    shipping_name = db.Column(db.String(100), nullable=False)
    shipping_phone = db.Column(db.String(20), nullable=False)
    shipping_address = db.Column(db.String(255), nullable=False)
    shipping_city = db.Column(db.String(100), nullable=False)
    shipping_state = db.Column(db.String(100), nullable=False)
    shipping_pincode = db.Column(db.String(20), nullable=False)
    applied_coupon_code = db.Column(db.String(20))                          # informational
    discount_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship("OrderItem", backref="order", cascade="all, delete-orphan", lazy=True)
    return_request = db.relationship(
        "ReturnRequest", backref="order", uselist=False,
        cascade="all, delete-orphan", lazy=True,
    )

    def to_dict(self, include_items=True):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "customer_name": self.user.name if self.user else None,
            "customer_email": self.user.email if self.user else None,
            "total_amount": float(self.total_amount),
            "status": self.status,
            "payment_method": self.payment_method,
            "shipping_name": self.shipping_name,
            "shipping_phone": self.shipping_phone,
            "shipping_address": self.shipping_address,
            "shipping_city": self.shipping_city,
            "shipping_state": self.shipping_state,
            "shipping_pincode": self.shipping_pincode,
            "applied_coupon_code": self.applied_coupon_code,
            "discount_amount": float(self.discount_amount) if self.discount_amount is not None else 0.0,
            "item_count": len(self.items),
            "return_request": self.return_request.to_dict() if self.return_request else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_items:
            data["items"] = [item.to_dict() for item in self.items]
        return data
