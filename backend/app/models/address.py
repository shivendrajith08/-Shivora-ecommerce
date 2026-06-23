from datetime import datetime
from app.extensions import db


class Address(db.Model):
    __tablename__ = "addresses"

    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    full_name     = db.Column(db.String(120), nullable=False)
    phone         = db.Column(db.String(20), nullable=False)
    address_line1 = db.Column(db.String(255), nullable=False)
    address_line2 = db.Column(db.String(255))
    city          = db.Column(db.String(100), nullable=False)
    state         = db.Column(db.String(100), nullable=False)
    pincode       = db.Column(db.String(10), nullable=False)
    is_default    = db.Column(db.Boolean, nullable=False, default=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship(
        "User",
        backref=db.backref("addresses", cascade="all, delete-orphan", lazy=True),
    )

    def to_dict(self):
        return {
            "id":            self.id,
            "user_id":       self.user_id,
            "full_name":     self.full_name,
            "phone":         self.phone,
            "address_line1": self.address_line1,
            "address_line2": self.address_line2,
            "city":          self.city,
            "state":         self.state,
            "pincode":       self.pincode,
            "is_default":    self.is_default,
            "created_at":    self.created_at.isoformat() if self.created_at else None,
        }
