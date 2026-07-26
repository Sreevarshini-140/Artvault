from flask import (
    Blueprint,
    jsonify,
    request,
)

from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from sqlalchemy import or_

from app import db

from app.models import (
    Artwork,
    Follow,
    Notification,
    User,
    Wishlist,
)

from app.utils.auth import (
    roles_required,
)


users_bp = Blueprint(
    "users",
    __name__,
)


# =========================================================
# CURRENT USER
# =========================================================

@users_bp.get("/me")
@jwt_required()
def me():
    user_id = int(
        get_jwt_identity()
    )

    user = User.query.get_or_404(
        user_id
    )

    return jsonify(
        user.to_dict()
    ), 200


@users_bp.put("/me")
@jwt_required()
def update_me():
    user_id = int(
        get_jwt_identity()
    )

    user = User.query.get_or_404(
        user_id
    )

    data = request.get_json(
        silent=True
    ) or {}

    name = (
        data.get("name") or ""
    ).strip()

    email = (
        data.get("email") or ""
    ).strip().lower()

    if not name or not email:
        return jsonify({
            "error": (
                "Name and email are required"
            )
        }), 400

    existing = (
        User.query
        .filter(
            User.email == email,
            User.id != user.id,
        )
        .first()
    )

    if existing:
        return jsonify({
            "error": "Email already in use"
        }), 409

    user.name = name
    user.email = email
    user.bio = (
        data.get("bio") or ""
    ).strip()

    db.session.commit()

    return jsonify(
        user.to_dict()
    ), 200


# =========================================================
# ADMIN USER MANAGEMENT
# =========================================================

@users_bp.get("/admin")
@roles_required("admin")
def admin_users():
    search = (
        request.args.get(
            "search",
            "",
        )
        .strip()
    )

    role = (
        request.args.get(
            "role",
            "",
        )
        .strip()
        .lower()
    )

    status = (
        request.args.get(
            "status",
            "",
        )
        .strip()
        .lower()
    )

    page = request.args.get(
        "page",
        1,
        type=int,
    )

    per_page = request.args.get(
        "per_page",
        10,
        type=int,
    )

    page = max(
        page,
        1,
    )

    per_page = min(
        max(
            per_page,
            1,
        ),
        100,
    )

    query = User.query

    if search:
        search_pattern = (
            f"%{search}%"
        )

        query = query.filter(
            or_(
                User.name.ilike(
                    search_pattern
                ),
                User.email.ilike(
                    search_pattern
                ),
            )
        )

    allowed_roles = {
        "visitor",
        "artist",
        "curator",
        "admin",
    }

    if role in allowed_roles:
        query = query.filter(
            User.role == role
        )

    if status == "active":
        query = query.filter(
            User.is_active.is_(True)
        )

    elif status == "inactive":
        query = query.filter(
            User.is_active.is_(False)
        )

    pagination = (
        query
        .order_by(
            User.created_at.desc(),
            User.id.desc(),
        )
        .paginate(
            page=page,
            per_page=per_page,
            error_out=False,
        )
    )

    summary = {
        "total": (
            User.query.count()
        ),

        "active": (
            User.query
            .filter(
                User.is_active.is_(True)
            )
            .count()
        ),

        "inactive": (
            User.query
            .filter(
                User.is_active.is_(False)
            )
            .count()
        ),

        "verified": (
            User.query
            .filter(
                User.is_verified.is_(True)
            )
            .count()
        ),

        "unverified": (
            User.query
            .filter(
                User.is_verified.is_(False)
            )
            .count()
        ),
    }

    return jsonify({
        "users": [
            user.to_dict()
            for user
            in pagination.items
        ],

        "summary": summary,

        "pagination": {
            "page": (
                pagination.page
            ),

            "pages": (
                pagination.pages
            ),

            "per_page": (
                pagination.per_page
            ),

            "total": (
                pagination.total
            ),

            "has_next": (
                pagination.has_next
            ),

            "has_prev": (
                pagination.has_prev
            ),
        },
    }), 200


@users_bp.patch(
    "/admin/<int:user_id>/status"
)
@roles_required("admin")
def update_user_status(
    user_id,
):
    current_admin_id = int(
        get_jwt_identity()
    )

    if user_id == current_admin_id:
        return jsonify({
            "error": (
                "You cannot suspend your own "
                "admin account"
            )
        }), 400

    user = User.query.get_or_404(
        user_id
    )

    data = request.get_json(
        silent=True
    ) or {}

    is_active = data.get(
        "is_active"
    )

    if not isinstance(
        is_active,
        bool,
    ):
        return jsonify({
            "error": (
                "is_active must be true or false"
            )
        }), 400

    user_has_admin_access = (
        user.role == "admin"
        or bool(
            getattr(
                user,
                "is_admin",
                False,
            )
        )
    )

    if (
        user_has_admin_access
        and user.is_active
        and not is_active
    ):
        active_admin_count = (
            User.query
            .filter(
                User.is_active.is_(True),
                or_(
                    User.role == "admin",
                    User.is_admin.is_(True),
                ),
            )
            .count()
        )

        if active_admin_count <= 1:
            return jsonify({
                "error": (
                    "The final active admin "
                    "cannot be suspended"
                )
            }), 400

    user.is_active = is_active

    db.session.commit()

    return jsonify({
        "message": (
            "User activated successfully"
            if is_active
            else "User suspended successfully"
        ),

        "user": (
            user.to_dict()
        ),
    }), 200


# =========================================================
# PUBLIC ARTIST ROUTES
# =========================================================

@users_bp.get("/artists")
def artists():
    items = (
        User.query
        .filter_by(
            role="artist",
            is_active=True,
        )
        .order_by(
            User.name.asc()
        )
        .all()
    )

    return jsonify([
        {
            "artist": (
                user.to_dict()
            ),

            "artworks": [
                artwork.to_dict()
                for artwork
                in user.artworks
                if artwork.status
                == "published"
            ],

            "followers": (
                Follow.query
                .filter_by(
                    artist_id=user.id
                )
                .count()
            ),
        }
        for user in items
    ]), 200


@users_bp.get(
    "/artists/<int:artist_id>"
)
def artist_profile(
    artist_id,
):
    user = User.query.get_or_404(
        artist_id
    )

    if (
        user.role != "artist"
        or not user.is_active
    ):
        return jsonify({
            "error": "Artist not found"
        }), 404

    return jsonify({
        "artist": (
            user.to_dict()
        ),

        "artworks": [
            artwork.to_dict()
            for artwork
            in user.artworks
            if artwork.status
            == "published"
        ],

        "followers": (
            Follow.query
            .filter_by(
                artist_id=user.id
            )
            .count()
        ),
    }), 200


# =========================================================
# WISHLIST
# =========================================================

@users_bp.get("/wishlist")
@jwt_required()
def wishlist():
    user_id = int(
        get_jwt_identity()
    )

    items = (
        Wishlist.query
        .filter_by(
            user_id=user_id
        )
        .all()
    )

    return jsonify([
        item.artwork.to_dict()
        for item in items
        if item.artwork
    ]), 200


@users_bp.post(
    "/wishlist/<int:artwork_id>"
)
@jwt_required()
def add_wishlist(
    artwork_id,
):
    Artwork.query.get_or_404(
        artwork_id
    )

    user_id = int(
        get_jwt_identity()
    )

    item = (
        Wishlist.query
        .filter_by(
            user_id=user_id,
            artwork_id=artwork_id,
        )
        .first()
    )

    if item:
        return jsonify({
            "message": (
                "Artwork is already "
                "in your wishlist"
            )
        }), 200

    try:
        wishlist_item = Wishlist(
            user_id=user_id,
            artwork_id=artwork_id,
        )

        db.session.add(
            wishlist_item
        )

        db.session.commit()

        return jsonify({
            "message": (
                "Added to wishlist"
            )
        }), 201

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": (
                "Unable to add artwork "
                "to wishlist"
            )
        }), 500


@users_bp.delete(
    "/wishlist/<int:artwork_id>"
)
@jwt_required()
def remove_wishlist(
    artwork_id,
):
    user_id = int(
        get_jwt_identity()
    )

    item = (
        Wishlist.query
        .filter_by(
            user_id=user_id,
            artwork_id=artwork_id,
        )
        .first_or_404()
    )

    try:
        db.session.delete(
            item
        )

        db.session.commit()

        return "", 204

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": (
                "Unable to remove artwork "
                "from wishlist"
            )
        }), 500


# =========================================================
# FOLLOWING
# =========================================================

@users_bp.post(
    "/follow/<int:artist_id>"
)
@jwt_required()
def follow(
    artist_id,
):
    artist = User.query.get_or_404(
        artist_id
    )

    if (
        artist.role != "artist"
        or not artist.is_active
    ):
        return jsonify({
            "error": (
                "User is not an active artist"
            )
        }), 400

    try:
        follower_id = int(
            get_jwt_identity()
        )
    except (
        TypeError,
        ValueError,
    ):
        return jsonify({
            "error": (
                "Invalid authenticated user"
            )
        }), 401

    if follower_id == artist_id:
        return jsonify({
            "error": (
                "Cannot follow yourself"
            )
        }), 400

    follower = db.session.get(
        User,
        follower_id,
    )

    if not follower:
        return jsonify({
            "error": (
                "Follower account not found"
            )
        }), 404

    if not follower.is_active:
        return jsonify({
            "error": (
                "Your account is inactive"
            )
        }), 403

    existing_follow = (
        Follow.query
        .filter_by(
            follower_id=follower_id,
            artist_id=artist_id,
        )
        .first()
    )

    if existing_follow:
        followers_count = (
            Follow.query
            .filter_by(
                artist_id=artist_id
            )
            .count()
        )

        return jsonify({
            "message": (
                "You are already following "
                "this artist"
            ),

            "following": True,

            "followers": (
                followers_count
            ),
        }), 200

    try:
        new_follow = Follow(
            follower_id=follower_id,
            artist_id=artist_id,
        )

        notification = Notification(
            user_id=artist_id,
            title="New follower",
            message=(
                f"{follower.name} started "
                "following you."
            ),
            is_read=False,
        )

        db.session.add(
            new_follow
        )

        db.session.add(
            notification
        )

        db.session.commit()

        followers_count = (
            Follow.query
            .filter_by(
                artist_id=artist_id
            )
            .count()
        )

        return jsonify({
            "message": (
                "Artist followed successfully"
            ),

            "following": True,

            "followers": (
                followers_count
            ),
        }), 201

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": (
                "Unable to follow the artist"
            )
        }), 500


@users_bp.delete(
    "/follow/<int:artist_id>"
)
@jwt_required()
def unfollow(
    artist_id,
):
    try:
        follower_id = int(
            get_jwt_identity()
        )
    except (
        TypeError,
        ValueError,
    ):
        return jsonify({
            "error": (
                "Invalid authenticated user"
            )
        }), 401

    follow_item = (
        Follow.query
        .filter_by(
            follower_id=follower_id,
            artist_id=artist_id,
        )
        .first()
    )

    if not follow_item:
        return jsonify({
            "error": (
                "You are not following "
                "this artist"
            )
        }), 404

    try:
        db.session.delete(
            follow_item
        )

        db.session.commit()

        followers_count = (
            Follow.query
            .filter_by(
                artist_id=artist_id
            )
            .count()
        )

        return jsonify({
            "message": (
                "Artist unfollowed successfully"
            ),

            "following": False,

            "followers": (
                followers_count
            ),
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": (
                "Unable to unfollow the artist"
            )
        }), 500


@users_bp.get(
    "/follow-status/<int:artist_id>"
)
@jwt_required()
def follow_status(
    artist_id,
):
    artist = User.query.get_or_404(
        artist_id
    )

    if (
        artist.role != "artist"
        or not artist.is_active
    ):
        return jsonify({
            "error": (
                "User is not an active artist"
            )
        }), 400

    try:
        follower_id = int(
            get_jwt_identity()
        )
    except (
        TypeError,
        ValueError,
    ):
        return jsonify({
            "error": (
                "Invalid authenticated user"
            )
        }), 401

    is_following = (
        Follow.query
        .filter_by(
            follower_id=follower_id,
            artist_id=artist_id,
        )
        .first()
        is not None
    )

    followers_count = (
        Follow.query
        .filter_by(
            artist_id=artist_id
        )
        .count()
    )

    return jsonify({
        "following": (
            is_following
        ),

        "followers": (
            followers_count
        ),
    }), 200


@users_bp.get("/following")
@jwt_required()
def following():
    try:
        follower_id = int(
            get_jwt_identity()
        )
    except (
        TypeError,
        ValueError,
    ):
        return jsonify({
            "error": (
                "Invalid authenticated user"
            )
        }), 401

    follows = (
        Follow.query
        .filter_by(
            follower_id=follower_id
        )
        .order_by(
            Follow.created_at.desc()
        )
        .all()
    )

    artists_data = []

    for follow_item in follows:
        artist = db.session.get(
            User,
            follow_item.artist_id,
        )

        if (
            artist
            and artist.role == "artist"
            and artist.is_active
        ):
            published_artworks = [
                artwork
                for artwork
                in artist.artworks
                if artwork.status
                == "published"
            ]

            artists_data.append({
                "artist": (
                    artist.to_dict()
                ),

                "followers": (
                    Follow.query
                    .filter_by(
                        artist_id=artist.id
                    )
                    .count()
                ),

                "artworks": len(
                    published_artworks
                ),
            })

    return jsonify(
        artists_data
    ), 200