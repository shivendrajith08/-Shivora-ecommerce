from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.notification import Notification

notification_bp = Blueprint('notifications', __name__)


@notification_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    notifications = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count,
    }), 200


@notification_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All marked as read'}), 200


@notification_bp.route('/<int:notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notif_id):
    user_id = get_jwt_identity()
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    notif.is_read = True
    db.session.commit()
    return jsonify({'message': 'Marked as read'}), 200
