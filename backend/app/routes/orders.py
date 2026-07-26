from decimal import Decimal

from flask import (
    Blueprint,
    current_app,
    jsonify,
    request,
)

from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from app import db

from app.models import (
    Artwork,
    Order,
    OrderItem,
)


orders_bp = Blueprint(
    "orders",
    __name__,
)


def get_current_user_id():
    identity = get_jwt_identity()

    try:
        return int(identity)
    except (
        TypeError,
        ValueError,
    ):
        return None


@orders_bp.get("")
@jwt_required()
def my_orders():
    user_id = get_current_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "error": "Invalid user identity.",
        }), 401

    orders = (
        Order.query
        .filter_by(user_id=user_id)
        .order_by(
            Order.created_at.desc()
        )
        .all()
    )

    return jsonify({
        "success": True,
        "orders": [
            order.to_dict()
            for order in orders
        ],
    }), 200


@orders_bp.get("/<int:order_id>")
@jwt_required()
def get_order(order_id):
    user_id = get_current_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "error": "Invalid user identity.",
        }), 401

    order = Order.query.filter_by(
        id=order_id,
        user_id=user_id,
    ).first()

    if order is None:
        return jsonify({
            "success": False,
            "error": "Order not found.",
        }), 404

    return jsonify({
        "success": True,
        "order": order.to_dict(),
    }), 200


@orders_bp.post("")
@jwt_required()
def create_order():
    user_id = get_current_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "error": "Invalid user identity.",
        }), 401

    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    raw_items = data.get(
        "items",
        [],
    )

    shipping_address = str(
        data.get(
            "shipping_address",
            "",
        )
    ).strip()

    payment_method = str(
        data.get(
            "payment_method",
            "mock",
        )
    ).strip().lower()

    if not isinstance(raw_items, list):
        return jsonify({
            "success": False,
            "error": (
                "Items must be provided "
                "as a list."
            ),
        }), 400

    if not raw_items:
        return jsonify({
            "success": False,
            "error": (
                "At least one artwork "
                "is required."
            ),
        }), 400

    if not shipping_address:
        return jsonify({
            "success": False,
            "error": (
                "Shipping address is "
                "required."
            ),
        }), 400

    if payment_method not in {
        "mock",
        "cod",
    }:
        return jsonify({
            "success": False,
            "error": (
                "Invalid payment method."
            ),
        }), 400

    artwork_ids = []

    for raw_item in raw_items:
        if not isinstance(
            raw_item,
            dict,
        ):
            return jsonify({
                "success": False,
                "error": (
                    "Every cart item must "
                    "be an object."
                ),
            }), 400

        artwork_id = raw_item.get(
            "artwork_id"
        )

        try:
            artwork_id = int(
                artwork_id
            )
        except (
            TypeError,
            ValueError,
        ):
            return jsonify({
                "success": False,
                "error": (
                    "Every cart item must "
                    "contain a valid "
                    "artwork ID."
                ),
            }), 400

        if artwork_id in artwork_ids:
            return jsonify({
                "success": False,
                "error": (
                    "The same artwork "
                    "cannot be ordered "
                    "more than once."
                ),
            }), 400

        artwork_ids.append(
            artwork_id
        )

    try:
        artworks = (
            Artwork.query
            .filter(
                Artwork.id.in_(
                    artwork_ids
                )
            )
            .all()
        )

        artwork_map = {
            artwork.id: artwork
            for artwork in artworks
        }

        if (
            len(artwork_map)
            != len(artwork_ids)
        ):
            return jsonify({
                "success": False,
                "error": (
                    "One or more artworks "
                    "could not be found."
                ),
            }), 404

        total_amount = Decimal(
            "0.00"
        )

        order = Order(
            user_id=user_id,
            status=(
                "paid"
                if payment_method == "mock"
                else "pending"
            ),
            total_amount=Decimal(
                "0.00"
            ),
            shipping_address=(
                shipping_address
            ),
        )

        for artwork_id in artwork_ids:
            artwork = artwork_map[
                artwork_id
            ]

            if artwork.status != "published":
                return jsonify({
                    "success": False,
                    "error": (
                        f'"{artwork.title}" '
                        "is no longer available."
                    ),
                }), 409

            # Keep this check for real use.
            # A seller should not purchase
            # their own artwork.
            if artwork.artist_id == user_id:
                return jsonify({
                    "success": False,
                    "error": (
                        "You cannot purchase "
                        "your own artwork. "
                        "Please test using a "
                        "different visitor account."
                    ),
                }), 400

            unit_price = Decimal(
                str(artwork.price)
            )

            if unit_price <= 0:
                return jsonify({
                    "success": False,
                    "error": (
                        f'"{artwork.title}" '
                        "has an invalid price."
                    ),
                }), 400

            order_item = OrderItem(
                artwork_id=artwork.id,

                # Temporary value because
                # the existing MySQL enum
                # already supports canvas.
                product_type="canvas",

                # Original artwork can only
                # have quantity one.
                quantity=1,

                unit_price=unit_price,
            )

            order.items.append(
                order_item
            )

            total_amount += unit_price

            # Remove the artwork from future
            # public purchases.
            artwork.status = "sold"

        order.total_amount = (
            total_amount
        )

        db.session.add(order)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": (
                "Order placed successfully."
            ),
            "order": order.to_dict(),
            "payment_method": (
                payment_method
            ),
        }), 201

    except Exception as error:
        db.session.rollback()

        current_app.logger.exception(
            "Order creation failed: %s",
            error,
        )

        return jsonify({
            "success": False,
            "error": (
                "Unable to place the order. "
                "Check the backend terminal "
                "for the exact error."
            ),
        }), 500