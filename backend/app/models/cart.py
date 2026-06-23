from datetime import datetime
from app.extensions import db


class Cart(db.Model):
    __tablename__ = "cart"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = db.relationship("Product", lazy=True)

    __table_args__ = (db.UniqueConstraint("user_id", "product_id", name="uq_cart_user_product"),)

    def to_dict(self):
        product = self.product
        effective_price = None
        if product:
            effective_price = float(product.discount_price) if product.discount_price else float(product.price)
        return {
            "id": self.id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "product": product.to_dict() if product else None,
            "subtotal": round(effective_price * self.quantity, 2) if effective_price is not None else None,
        }
