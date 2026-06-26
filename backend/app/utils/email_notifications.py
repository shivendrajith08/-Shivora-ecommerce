from flask_mail import Message
from app.extensions import mail

EMAIL_TEMPLATES = {
    'processing': (
        'Your Shivora Order is Confirmed! 🎉',
        'Your order #{order_id} has been confirmed and is being prepared for shipment.',
    ),
    'shipped': (
        'Your Order is Shipped! 📦',
        'Great news! Your order #{order_id} has been shipped and is on its way.',
    ),
    'delivered': (
        'Your Order has been Delivered! ✅',
        'Your order #{order_id} has been delivered. We hope you love your purchase!',
    ),
    'cancelled': (
        'Order Cancelled',
        'Your order #{order_id} has been cancelled.',
    ),
}


def send_order_status_email(user_email, user_name, order_id, status):
    try:
        if status not in EMAIL_TEMPLATES:
            return
        subject, body_template = EMAIL_TEMPLATES[status]
        body = body_template.format(order_id=order_id)
        html_body = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#020818;color:#F4F4F2;padding:32px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="color:#F59E0B;font-size:24px;margin:0;">SHIVORA</h1>
            <p style="color:#94A3B8;font-size:12px;margin:4px 0 0;">Luxury Online Shopping</p>
          </div>
          <h2 style="color:#F4F4F2;font-size:18px;">{subject}</h2>
          <p style="color:#94A3B8;line-height:1.6;">Hi {user_name},</p>
          <p style="color:#94A3B8;line-height:1.6;">{body}</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="https://shivora-ecommerce.vercel.app/orders/{order_id}"
               style="background:#F59E0B;color:#020818;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
              View Order
            </a>
          </div>
          <p style="color:#94A3B8;font-size:12px;text-align:center;">Thank you for shopping with Shivora</p>
        </div>
        """
        msg = Message(subject=subject, recipients=[user_email], html=html_body)
        mail.send(msg)
    except Exception as e:
        print(f"Email send failed: {e}")
