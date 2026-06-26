from datetime import datetime
from app.extensions import db


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(220), nullable=False, unique=True)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    discount_price = db.Column(db.Numeric(10, 2))
    stock = db.Column(db.Integer, nullable=False, default=0)
    sku = db.Column(db.String(80), unique=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id", ondelete="SET NULL"))
    image_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    sizes = db.Column(db.JSON, nullable=True)
    colors = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "price": float(self.price) if self.price is not None else None,
            "discount_price": float(self.discount_price) if self.discount_price is not None else None,
            "stock": self.stock,
            "sku": self.sku,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "image_url": self.image_url,
            "is_active": self.is_active,
            "in_stock": self.stock > 0,
            "sizes": self.sizes or [],
            "colors": self.colors or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
