from flask import Blueprint, jsonify
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from app import db
from app.models import Notification


notifications_bp = Blueprint(
    "notifications",
    __name__,
)


def get_current_user_id():
    identity = get_jwt_identity()

    try:
        return int(identity)
    except (TypeError, ValueError):
        return None


@notifications_bp.get("")
@jwt_required()
def get_notifications():
    user_id = get_current_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "error": "Invalid authenticated user.",
        }), 401

    notifications = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    unread_count = (
        Notification.query
        .filter_by(
            user_id=user_id,
            is_read=False,
        )
        .count()
    )

    return jsonify({
        "success": True,
        "notifications": [
            {
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "is_read": notification.is_read,
                "created_at": (
                    notification.created_at.isoformat()
                    if notification.created_at
                    else None
                ),
            }
            for notification in notifications
        ],
        "unread_count": unread_count,
    }), 200


@notifications_bp.get("/unread-count")
@jwt_required()
def get_unread_count():
    user_id = get_current_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "error": "Invalid authenticated user.",
        }), 401

    unread_count = (
        Notification.query
        .filter_by(
            user_id=user_id,
            is_read=False,
        )
        .count()
    )

    return jsonify({
        "success": True,
        "unread_count": unread_count,
    }), 200


@notifications_bp.patch("/<int:notification_id>/read")
@jwt_required()
def mark_notification_as_read(
    notification_id,
):
    user_id = get_current_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "error": "Invalid authenticated user.",
        }), 401

    notification = (
        Notification.query
        .filter_by(
            id=notification_id,
            user_id=user_id,
        )
        .first()
    )

    if notification is None:
        return jsonify({
            "success": False,
            "error": "Notification not found.",
        }), 404

    notification.is_read = True
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Notification marked as read.",
        "notification": {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "is_read": notification.is_read,
            "created_at": (
                notification.created_at.isoformat()
                if notification.created_at
                else None
            ),
        },
    }), 200


@notifications_bp.patch("/read-all")
@jwt_required()
def mark_all_notifications_as_read():
    user_id = get_current_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "error": "Invalid authenticated user.",
        }), 401

    notifications = (
        Notification.query
        .filter_by(
            user_id=user_id,
            is_read=False,
        )
        .all()
    )

    for notification in notifications:
        notification.is_read = True

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "All notifications marked as read.",
        "updated_count": len(notifications),
    }), 200


@notifications_bp.delete("/<int:notification_id>")
@jwt_required()
def delete_notification(
    notification_id,
):
    user_id = get_current_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "error": "Invalid authenticated user.",
        }), 401

    notification = (
        Notification.query
        .filter_by(
            id=notification_id,
            user_id=user_id,
        )
        .first()
    )

    if notification is None:
        return jsonify({
            "success": False,
            "error": "Notification not found.",
        }), 404

    db.session.delete(notification)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Notification deleted.",
    }), 200