from app.extensions import db
from app.models.notification import Notification

STATUS_MESSAGES = {
    'processing': ('Order Confirmed! 🎉', 'Your order has been confirmed and is being prepared.'),
    'shipped': ('Order Shipped! 📦', 'Your order is on its way to you.'),
    'out_for_delivery': ('Out for Delivery! 🚚', 'Your order will be delivered today.'),
    'delivered': ('Order Delivered! ✅', 'Your order has been delivered. Enjoy your purchase!'),
    'cancelled': ('Order Cancelled', 'Your order has been cancelled. Refund will be processed shortly.'),
}


def create_order_notification(user_id, order_id, status):
    if status not in STATUS_MESSAGES:
        return
    title, message = STATUS_MESSAGES[status]
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type='order',
        order_id=order_id,
    )
    db.session.add(notif)
    db.session.commit()
