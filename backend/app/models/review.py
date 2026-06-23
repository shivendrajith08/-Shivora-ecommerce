from datetime import datetime
from app.extensions import db


class Review(db.Model):
    __tablename__ = "reviews"

    id            = db.Column(db.Integer, primary_key=True)
    product_id    = db.Column(db.Integer, db.ForeignKey("products.id",    ondelete="CASCADE"), nullable=False)
    user_id       = db.Column(db.Integer, db.ForeignKey("users.id",       ondelete="CASCADE"), nullable=False)
    order_item_id = db.Column(db.Integer, db.ForeignKey("order_items.id", ondelete="SET NULL"))
    rating        = db.Column(db.Integer, nullable=False)
    comment       = db.Column(db.Text)
    photo_url     = db.Column(db.String(255))
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("Product", lazy=True)
    user    = db.relationship("User",    lazy=True)

    def to_dict(self):
        return {
            "id":            self.id,
            "product_id":    self.product_id,
            "user_id":       self.user_id,
            "rating":        self.rating,
            "comment":       self.comment,
            "photo_url":     self.photo_url,
            "created_at":    self.created_at.isoformat() if self.created_at else None,
            "reviewer_name": self.user.name if self.user else None,
        }
