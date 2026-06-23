from datetime import datetime
from app.extensions import db


class ReturnRequest(db.Model):
    __tablename__ = "return_requests"

    id          = db.Column(db.Integer, primary_key=True)
    order_id    = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason      = db.Column(
        db.Enum('Damaged product', 'Wrong item received', 'Not as described', 'Changed my mind', 'Other',
                name="return_reason"),
        nullable=False,
    )
    description = db.Column(db.Text)
    status      = db.Column(
        db.Enum('Requested', 'Approved', 'Rejected', name="return_status"),
        nullable=False, default='Requested',
    )
    admin_note  = db.Column(db.Text)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id":          self.id,
            "order_id":    self.order_id,
            "user_id":     self.user_id,
            "reason":      self.reason,
            "description": self.description,
            "status":      self.status,
            "admin_note":  self.admin_note,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "updated_at":  self.updated_at.isoformat() if self.updated_at else None,
        }
