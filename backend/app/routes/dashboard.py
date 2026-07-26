from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func

from app import db
from app.models import (
    User,
    Artwork,
    Exhibition,
    Order,
    OrderItem,
    Wishlist,
    Follow,
    Review,
    Notification,
)
from app.utils.auth import roles_required


dashboard_bp = Blueprint("dashboard", __name__)


def _iso(value):
    """Convert a datetime value to an ISO string safely."""
    return value.isoformat() if value else None


def _money(value):
    """Convert Decimal/None values into JSON-safe float values."""
    return float(value or 0)


@dashboard_bp.get("/admin")
@roles_required("admin")
def admin_dashboard():
    """
    Main ArtVault administrator overview.

    Endpoint:
        GET /api/dashboard/admin
    """

    # ---------------------------------------------------------
    # User statistics
    # ---------------------------------------------------------
    total_users = User.query.count()

    visitor_count = User.query.filter_by(
        role="visitor"
    ).count()

    artist_count = User.query.filter_by(
        role="artist"
    ).count()

    curator_count = User.query.filter_by(
        role="curator"
    ).count()

    admin_count = (
        User.query
        .filter(
            db.or_(
                User.role == "admin",
                User.is_admin.is_(True),
            )
        )
        .count()
    )

    active_users = User.query.filter_by(
        is_active=True
    ).count()

    inactive_users = User.query.filter_by(
        is_active=False
    ).count()

    verified_users = User.query.filter_by(
        is_verified=True
    ).count()

    unverified_users = User.query.filter_by(
        is_verified=False
    ).count()

    # ---------------------------------------------------------
    # Artwork statistics
    # ---------------------------------------------------------
    total_artworks = Artwork.query.count()

    published_artworks = Artwork.query.filter_by(
        status="published"
    ).count()

    draft_artworks = Artwork.query.filter_by(
        status="draft"
    ).count()

    sold_artworks = Artwork.query.filter_by(
        status="sold"
    ).count()

    archived_artworks = Artwork.query.filter_by(
        status="archived"
    ).count()

    total_artwork_views = (
        db.session.query(
            func.coalesce(
                func.sum(Artwork.views),
                0,
            )
        )
        .scalar()
    )

    # ---------------------------------------------------------
    # Order and revenue statistics
    # ---------------------------------------------------------
    total_orders = Order.query.count()

    pending_orders = Order.query.filter_by(
        status="pending"
    ).count()

    paid_orders = Order.query.filter_by(
        status="paid"
    ).count()

    shipped_orders = Order.query.filter_by(
        status="shipped"
    ).count()

    delivered_orders = Order.query.filter_by(
        status="delivered"
    ).count()

    cancelled_orders = Order.query.filter_by(
        status="cancelled"
    ).count()

    completed_order_statuses = [
        "paid",
        "shipped",
        "delivered",
    ]

    revenue = (
        db.session.query(
            func.coalesce(
                func.sum(Order.total_amount),
                0,
            )
        )
        .filter(
            Order.status.in_(
                completed_order_statuses
            )
        )
        .scalar()
    )

    sold_items = (
        db.session.query(
            func.coalesce(
                func.sum(OrderItem.quantity),
                0,
            )
        )
        .join(
            Order,
            OrderItem.order_id == Order.id,
        )
        .filter(
            Order.status.in_(
                completed_order_statuses
            )
        )
        .scalar()
    )

    average_order_value = (
        db.session.query(
            func.coalesce(
                func.avg(Order.total_amount),
                0,
            )
        )
        .filter(
            Order.status.in_(
                completed_order_statuses
            )
        )
        .scalar()
    )

    # ---------------------------------------------------------
    # Exhibition statistics
    # ---------------------------------------------------------
    total_exhibitions = Exhibition.query.count()

    draft_exhibitions = Exhibition.query.filter_by(
        status="draft"
    ).count()

    published_exhibitions = (
        Exhibition.query.filter_by(
            status="published"
        ).count()
    )

    archived_exhibitions = Exhibition.query.filter_by(
        status="archived"
    ).count()

    featured_exhibitions = Exhibition.query.filter_by(
        is_featured=True
    ).count()

    total_exhibition_views = (
        db.session.query(
            func.coalesce(
                func.sum(Exhibition.views),
                0,
            )
        )
        .scalar()
    )

    total_exhibition_likes = (
        db.session.query(
            func.coalesce(
                func.sum(Exhibition.likes),
                0,
            )
        )
        .scalar()
    )

    # ---------------------------------------------------------
    # Review and engagement statistics
    # ---------------------------------------------------------
    total_reviews = Review.query.count()

    average_rating = (
        db.session.query(
            func.coalesce(
                func.avg(Review.rating),
                0,
            )
        )
        .scalar()
    )

    total_wishlist_adds = Wishlist.query.count()
    total_follows = Follow.query.count()

    # ---------------------------------------------------------
    # Top-performing artworks
    # ---------------------------------------------------------
    top_artworks = (
        Artwork.query
        .order_by(
            Artwork.views.desc(),
            Artwork.created_at.desc(),
        )
        .limit(5)
        .all()
    )

    top_artwork_data = []

    for artwork in top_artworks:
        wishlist_count = Wishlist.query.filter_by(
            artwork_id=artwork.id
        ).count()

        top_artwork_data.append({
            "id": artwork.id,
            "title": artwork.title,
            "status": artwork.status,
            "views": artwork.views or 0,
            "price": _money(artwork.price),
            "image_url": artwork.image_url,
            "average_rating": artwork.average_rating,
            "review_count": artwork.review_count,
            "wishlist_count": wishlist_count,
            "artist": {
                "id": artwork.artist.id,
                "name": artwork.artist.name,
                "avatar_url": artwork.artist.avatar_url,
            }
            if artwork.artist
            else None,
        })

    # ---------------------------------------------------------
    # Top artists
    # ---------------------------------------------------------
    top_artist_rows = (
        db.session.query(
            User,
            func.count(Artwork.id).label(
                "artwork_count"
            ),
            func.coalesce(
                func.sum(Artwork.views),
                0,
            ).label(
                "total_views"
            ),
        )
        .outerjoin(
            Artwork,
            Artwork.artist_id == User.id,
        )
        .filter(
            User.role == "artist"
        )
        .group_by(
            User.id
        )
        .order_by(
            func.coalesce(
                func.sum(Artwork.views),
                0,
            ).desc(),
            func.count(Artwork.id).desc(),
        )
        .limit(5)
        .all()
    )

    top_artists = []

    for artist, artwork_count, total_views in top_artist_rows:
        follower_count = Follow.query.filter_by(
            artist_id=artist.id
        ).count()

        top_artists.append({
            "id": artist.id,
            "name": artist.name,
            "email": artist.email,
            "avatar_url": artist.avatar_url,
            "is_verified": artist.is_verified,
            "is_active": artist.is_active,
            "artwork_count": int(
                artwork_count or 0
            ),
            "total_views": int(
                total_views or 0
            ),
            "followers": follower_count,
        })

    # ---------------------------------------------------------
    # Recent platform activity
    # ---------------------------------------------------------
    recent_users = (
        User.query
        .order_by(
            User.created_at.desc()
        )
        .limit(5)
        .all()
    )

    recent_artworks = (
        Artwork.query
        .order_by(
            Artwork.created_at.desc()
        )
        .limit(5)
        .all()
    )

    recent_orders = (
        Order.query
        .order_by(
            Order.created_at.desc()
        )
        .limit(5)
        .all()
    )

    recent_exhibitions = (
        Exhibition.query
        .order_by(
            Exhibition.created_at.desc()
        )
        .limit(5)
        .all()
    )

    recent_reviews = (
        Review.query
        .order_by(
            Review.created_at.desc()
        )
        .limit(5)
        .all()
    )

    # ---------------------------------------------------------
    # Final response
    # ---------------------------------------------------------
    return jsonify({
        "users": {
            "total": total_users,
            "visitors": visitor_count,
            "artists": artist_count,
            "curators": curator_count,
            "admins": admin_count,
            "active": active_users,
            "inactive": inactive_users,
            "verified": verified_users,
            "unverified": unverified_users,
        },

        "artworks": {
            "total": total_artworks,
            "published": published_artworks,
            "draft": draft_artworks,
            "sold": sold_artworks,
            "archived": archived_artworks,
            "total_views": int(
                total_artwork_views or 0
            ),
        },

        "orders": {
            "total": total_orders,
            "pending": pending_orders,
            "paid": paid_orders,
            "shipped": shipped_orders,
            "delivered": delivered_orders,
            "cancelled": cancelled_orders,
            "items_sold": int(
                sold_items or 0
            ),
            "revenue": round(
                _money(revenue),
                2,
            ),
            "average_order_value": round(
                _money(average_order_value),
                2,
            ),
        },

        "exhibitions": {
            "total": total_exhibitions,
            "draft": draft_exhibitions,
            "published": published_exhibitions,
            "archived": archived_exhibitions,
            "featured": featured_exhibitions,
            "total_views": int(
                total_exhibition_views or 0
            ),
            "total_likes": int(
                total_exhibition_likes or 0
            ),
        },

        "reviews": {
            "total": total_reviews,
            "average_rating": round(
                float(average_rating or 0),
                1,
            ),
        },

        "engagement": {
            "wishlist_adds": total_wishlist_adds,
            "follows": total_follows,
        },

        "top_artworks": top_artwork_data,

        "top_artists": top_artists,

        "recent_users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "avatar_url": user.avatar_url,
                "is_verified": user.is_verified,
                "is_active": user.is_active,
                "created_at": _iso(
                    user.created_at
                ),
            }
            for user in recent_users
        ],

        "recent_artworks": [
            {
                "id": artwork.id,
                "title": artwork.title,
                "status": artwork.status,
                "views": artwork.views or 0,
                "price": _money(
                    artwork.price
                ),
                "image_url": artwork.image_url,
                "artist": {
                    "id": artwork.artist.id,
                    "name": artwork.artist.name,
                }
                if artwork.artist
                else None,
                "created_at": _iso(
                    artwork.created_at
                ),
            }
            for artwork in recent_artworks
        ],

        "recent_orders": [
            {
                "id": order.id,
                "status": order.status,
                "total_amount": _money(
                    order.total_amount
                ),
                "item_count": sum(
                    item.quantity or 0
                    for item in order.items
                ),
                "buyer": {
                    "id": order.user.id,
                    "name": order.user.name,
                    "email": order.user.email,
                }
                if order.user
                else None,
                "created_at": _iso(
                    order.created_at
                ),
            }
            for order in recent_orders
        ],

        "recent_exhibitions": [
            {
                "id": exhibition.id,
                "title": exhibition.title,
                "slug": exhibition.slug,
                "status": exhibition.status,
                "lifecycle_status": (
                    exhibition.lifecycle_status
                ),
                "is_featured": exhibition.is_featured,
                "views": exhibition.views or 0,
                "likes": exhibition.likes or 0,
                "artwork_count": (
                    exhibition.artwork_count
                ),
                "curator": {
                    "id": exhibition.curator.id,
                    "name": exhibition.curator.name,
                }
                if exhibition.curator
                else None,
                "starts_at": _iso(
                    exhibition.starts_at
                ),
                "ends_at": _iso(
                    exhibition.ends_at
                ),
                "created_at": _iso(
                    exhibition.created_at
                ),
            }
            for exhibition in recent_exhibitions
        ],

        "recent_reviews": [
            {
                "id": review.id,
                "rating": review.rating,
                "comment": review.comment or "",
                "user": {
                    "id": review.user.id,
                    "name": review.user.name,
                }
                if review.user
                else None,
                "artwork": {
                    "id": review.artwork.id,
                    "title": review.artwork.title,
                }
                if review.artwork
                else None,
                "created_at": _iso(
                    review.created_at
                ),
            }
            for review in recent_reviews
        ],
    }), 200


@dashboard_bp.get("/artist")
@roles_required("artist", "admin")
def artist_dashboard():
    """
    Artist workspace dashboard.

    Endpoint:
        GET /api/dashboard/artist
    """

    artist_id = int(
        get_jwt_identity()
    )

    artist = User.query.get_or_404(
        artist_id
    )

    artworks_query = Artwork.query.filter_by(
        artist_id=artist_id
    )

    all_artworks = (
        artworks_query
        .order_by(
            Artwork.created_at.desc()
        )
        .all()
    )

    artwork_ids = [
        artwork.id
        for artwork in all_artworks
    ]

    total_artworks = len(
        all_artworks
    )

    published_artworks = sum(
        1
        for artwork in all_artworks
        if artwork.status == "published"
    )

    draft_artworks = sum(
        1
        for artwork in all_artworks
        if artwork.status == "draft"
    )

    sold_artworks = sum(
        1
        for artwork in all_artworks
        if artwork.status == "sold"
    )

    archived_artworks = sum(
        1
        for artwork in all_artworks
        if artwork.status == "archived"
    )

    total_views = sum(
        artwork.views or 0
        for artwork in all_artworks
    )

    followers = Follow.query.filter_by(
        artist_id=artist_id
    ).count()

    wishlist_adds = 0
    review_count = 0
    average_rating = 0
    total_orders = 0
    items_sold = 0
    revenue = 0

    if artwork_ids:
        wishlist_adds = (
            Wishlist.query
            .filter(
                Wishlist.artwork_id.in_(
                    artwork_ids
                )
            )
            .count()
        )

        review_count = (
            Review.query
            .filter(
                Review.artwork_id.in_(
                    artwork_ids
                )
            )
            .count()
        )

        rating_value = (
            db.session.query(
                func.coalesce(
                    func.avg(
                        Review.rating
                    ),
                    0,
                )
            )
            .filter(
                Review.artwork_id.in_(
                    artwork_ids
                )
            )
            .scalar()
        )

        average_rating = round(
            float(
                rating_value or 0
            ),
            1,
        )

        paid_order_items = (
            db.session.query(
                OrderItem
            )
            .join(
                Order,
                OrderItem.order_id
                == Order.id,
            )
            .filter(
                OrderItem.artwork_id.in_(
                    artwork_ids
                ),
                Order.status.in_(
                    [
                        "paid",
                        "shipped",
                        "delivered",
                    ]
                ),
            )
            .all()
        )

        total_orders = len({
            item.order_id
            for item in paid_order_items
        })

        items_sold = sum(
            item.quantity or 0
            for item in paid_order_items
        )

        revenue = sum(
            _money(
                item.unit_price
            )
            * (
                item.quantity or 0
            )
            for item in paid_order_items
        )

    most_viewed_artwork = None

    if all_artworks:
        top_viewed = max(
            all_artworks,
            key=lambda artwork: (
                artwork.views or 0
            ),
        )

        most_viewed_artwork = {
            "id": top_viewed.id,
            "title": top_viewed.title,
            "views": (
                top_viewed.views or 0
            ),
            "price": _money(
                top_viewed.price
            ),
            "status": top_viewed.status,
            "image_url": (
                top_viewed.image_url
            ),
        }

    most_wishlisted_artwork = None

    if artwork_ids:
        wishlist_result = (
            db.session.query(
                Artwork,
                func.count(
                    Wishlist.id
                ).label(
                    "wishlist_count"
                ),
            )
            .outerjoin(
                Wishlist,
                Wishlist.artwork_id
                == Artwork.id,
            )
            .filter(
                Artwork.artist_id
                == artist_id
            )
            .group_by(
                Artwork.id
            )
            .order_by(
                func.count(
                    Wishlist.id
                ).desc()
            )
            .first()
        )

        if wishlist_result:
            artwork, wishlist_count = (
                wishlist_result
            )

            most_wishlisted_artwork = {
                "id": artwork.id,
                "title": artwork.title,
                "wishlist_count": int(
                    wishlist_count or 0
                ),
                "image_url": (
                    artwork.image_url
                ),
            }

    recent_artworks = [
        {
            "id": artwork.id,
            "title": artwork.title,
            "category": artwork.category,
            "medium": artwork.medium,
            "year": artwork.year,
            "price": _money(
                artwork.price
            ),
            "image_url": artwork.image_url,
            "status": artwork.status,
            "views": artwork.views or 0,
            "created_at": _iso(
                artwork.created_at
            ),
        }
        for artwork in all_artworks[:5]
    ]

    recent_reviews = []

    if artwork_ids:
        reviews = (
            Review.query
            .filter(
                Review.artwork_id.in_(
                    artwork_ids
                )
            )
            .order_by(
                Review.created_at.desc()
            )
            .limit(5)
            .all()
        )

        recent_reviews = [
            {
                "id": review.id,
                "rating": review.rating,
                "comment": (
                    review.comment or ""
                ),
                "created_at": _iso(
                    review.created_at
                ),
                "user": {
                    "id": review.user.id,
                    "name": review.user.name,
                    "avatar_url": (
                        review.user.avatar_url
                    ),
                }
                if review.user
                else None,
                "artwork": {
                    "id": review.artwork.id,
                    "title": (
                        review.artwork.title
                    ),
                    "image_url": (
                        review.artwork.image_url
                    ),
                }
                if review.artwork
                else None,
            }
            for review in reviews
        ]

    recent_orders = []

    if artwork_ids:
        order_items = (
            db.session.query(
                OrderItem
            )
            .join(
                Order,
                OrderItem.order_id
                == Order.id,
            )
            .filter(
                OrderItem.artwork_id.in_(
                    artwork_ids
                )
            )
            .order_by(
                Order.created_at.desc()
            )
            .limit(5)
            .all()
        )

        recent_orders = [
            {
                "order_id": item.order.id,
                "status": item.order.status,
                "quantity": item.quantity,
                "unit_price": _money(
                    item.unit_price
                ),
                "total": round(
                    _money(
                        item.unit_price
                    )
                    * (
                        item.quantity or 0
                    ),
                    2,
                ),
                "created_at": _iso(
                    item.order.created_at
                ),
                "buyer": {
                    "id": item.order.user.id,
                    "name": (
                        item.order.user.name
                    ),
                }
                if item.order.user
                else None,
                "artwork": {
                    "id": item.artwork.id,
                    "title": (
                        item.artwork.title
                    ),
                    "image_url": (
                        item.artwork.image_url
                    ),
                }
                if item.artwork
                else None,
            }
            for item in order_items
        ]

    notifications = (
        Notification.query
        .filter_by(
            user_id=artist_id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .limit(5)
        .all()
    )

    unread_notifications = (
        Notification.query
        .filter_by(
            user_id=artist_id,
            is_read=False,
        )
        .count()
    )

    return jsonify({
        "artist": {
            "id": artist.id,
            "name": artist.name,
            "email": artist.email,
            "bio": artist.bio,
            "avatar_url": artist.avatar_url,
            "is_verified": (
                artist.is_verified
            ),
            "role": artist.role,
        },

        "stats": {
            "total_artworks": (
                total_artworks
            ),
            "published_artworks": (
                published_artworks
            ),
            "draft_artworks": (
                draft_artworks
            ),
            "sold_artworks": (
                sold_artworks
            ),
            "archived_artworks": (
                archived_artworks
            ),
            "total_views": total_views,
            "followers": followers,
            "wishlist_adds": (
                wishlist_adds
            ),
            "review_count": (
                review_count
            ),
            "average_rating": (
                average_rating
            ),
            "orders": total_orders,
            "items_sold": items_sold,
            "revenue": round(
                revenue,
                2,
            ),
            "unread_notifications": (
                unread_notifications
            ),
        },

        "most_viewed_artwork": (
            most_viewed_artwork
        ),

        "most_wishlisted_artwork": (
            most_wishlisted_artwork
        ),

        "recent_artworks": (
            recent_artworks
        ),

        "recent_reviews": (
            recent_reviews
        ),

        "recent_orders": (
            recent_orders
        ),

        "notifications": [
            {
                "id": notification.id,
                "title": notification.title,
                "message": (
                    notification.message
                ),
                "is_read": (
                    notification.is_read
                ),
                "created_at": _iso(
                    notification.created_at
                ),
            }
            for notification in notifications
        ],
    }), 200