import os
import uuid

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
from sqlalchemy import or_
from werkzeug.utils import secure_filename

from app import db
from app.models import (
    Artwork,
    Order,
    OrderItem,
    Review,
    User,
)
from app.utils.auth import roles_required


artworks_bp = Blueprint(
    "artworks",
    __name__,
)

ALLOWED_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
}

VALID_ARTWORK_STATUSES = {
    "draft",
    "published",
    "sold",
    "archived",
}


def allowed_file(filename):
    return (
        "." in filename
        and filename
        .rsplit(".", 1)[1]
        .lower()
        in ALLOWED_EXTENSIONS
    )


def delete_uploaded_image(
    image_url,
):
    if not image_url:
        return

    if not image_url.startswith(
        "/static/uploads/artworks/"
    ):
        return

    filename = image_url.split(
        "/"
    )[-1]

    file_path = os.path.join(
        current_app.root_path,
        "static",
        "uploads",
        "artworks",
        filename,
    )

    if os.path.exists(
        file_path
    ):
        os.remove(
            file_path
        )


def serialize_artwork(
    artwork,
):
    payload = artwork.to_dict()

    artist = getattr(
        artwork,
        "artist",
        None,
    )

    if artist:
        payload["artist"] = {
            "id": artist.id,
            "name": artist.name,
            "email": artist.email,
            "role": artist.role,
            "is_active": artist.is_active,
        }

        payload["artist_name"] = (
            artist.name
        )

        payload["artist_email"] = (
            artist.email
        )

    return payload


@artworks_bp.get("/collected")
def list_collected_artworks():
    """
    Public archive of artworks that have been collected.

    Uses the existing artworks, orders, order_items and
    reviews tables. No new database table is required.
    """

    sold_records = (
        db.session.query(
            Artwork,
            OrderItem,
            Order,
        )
        .join(
            OrderItem,
            OrderItem.artwork_id == Artwork.id,
        )
        .join(
            Order,
            Order.id == OrderItem.order_id,
        )
        .filter(
            Artwork.status == "sold",
            Order.status.in_([
                "paid",
                "shipped",
                "delivered",
            ]),
        )
        .order_by(
            Order.created_at.desc(),
            Artwork.id.desc(),
        )
        .all()
    )

    items = []

    for artwork, order_item, order in sold_records:
        artwork_data = serialize_artwork(
            artwork
        )

        reviews = (
            Review.query
            .filter_by(
                artwork_id=artwork.id
            )
            .order_by(
                Review.created_at.desc()
            )
            .all()
        )

        artwork_data["sale"] = {
            "sold_price": float(
                order_item.unit_price
            ),
            "sold_at": (
                order.created_at.isoformat()
                if order.created_at
                else None
            ),
            "order_status": (
                order.status
            ),
        }

        artwork_data["reviews"] = [
            review.to_dict()
            for review in reviews
        ]

        artwork_data[
            "verified_review_count"
        ] = len(reviews)

        items.append(
            artwork_data
        )

    return jsonify({
        "success": True,
        "items": items,
        "total": len(items),
    }), 200



@artworks_bp.get("")
def list_artworks():
    query = Artwork.query.filter(
        Artwork.status
        == "published"
    )

    search = request.args.get(
        "search",
        "",
    ).strip()

    category = request.args.get(
        "category",
        "",
    ).strip()

    if search:
        query = query.filter(
            or_(
                Artwork.title.ilike(
                    f"%{search}%"
                ),
                Artwork.description.ilike(
                    f"%{search}%"
                ),
            )
        )

    if category:
        query = query.filter(
            Artwork.category
            == category
        )

    try:
        page = max(
            int(
                request.args.get(
                    "page",
                    1,
                )
            ),
            1,
        )

        per_page = min(
            max(
                int(
                    request.args.get(
                        "per_page",
                        12,
                    )
                ),
                1,
            ),
            50,
        )

    except ValueError:
        return jsonify({
            "error": (
                "Invalid page value"
            )
        }), 400

    result = (
        query
        .order_by(
            Artwork.created_at.desc()
        )
        .paginate(
            page=page,
            per_page=per_page,
            error_out=False,
        )
    )

    return jsonify({
        "items": [
            serialize_artwork(
                artwork
            )
            for artwork
            in result.items
        ],
        "page": page,
        "pages": result.pages,
        "total": result.total,
    }), 200


# =========================================================
# ADMIN ARTWORK MODERATION
# =========================================================

@artworks_bp.get("/admin")
@roles_required("admin")
def admin_list_artworks():
    search = (
        request.args.get(
            "search",
            "",
        )
        .strip()
    )

    status = (
        request.args.get(
            "status",
            "",
        )
        .strip()
        .lower()
    )

    category = (
        request.args.get(
            "category",
            "",
        )
        .strip()
    )

    page = max(
        request.args.get(
            "page",
            1,
            type=int,
        ),
        1,
    )

    per_page = min(
        max(
            request.args.get(
                "per_page",
                10,
                type=int,
            ),
            1,
        ),
        100,
    )

    query = Artwork.query.join(
        User,
        Artwork.artist_id
        == User.id,
    )

    if search:
        search_pattern = (
            f"%{search}%"
        )

        query = query.filter(
            or_(
                Artwork.title.ilike(
                    search_pattern
                ),
                Artwork.description.ilike(
                    search_pattern
                ),
                User.name.ilike(
                    search_pattern
                ),
                User.email.ilike(
                    search_pattern
                ),
            )
        )

    if (
        status
        in VALID_ARTWORK_STATUSES
    ):
        query = query.filter(
            Artwork.status
            == status
        )

    if category:
        query = query.filter(
            Artwork.category
            == category
        )

    pagination = (
        query
        .order_by(
            Artwork.created_at.desc(),
            Artwork.id.desc(),
        )
        .paginate(
            page=page,
            per_page=per_page,
            error_out=False,
        )
    )

    categories = [
        row[0]
        for row in (
            db.session.query(
                Artwork.category
            )
            .filter(
                Artwork.category.isnot(
                    None
                ),
                Artwork.category != "",
            )
            .distinct()
            .order_by(
                Artwork.category.asc()
            )
            .all()
        )
    ]

    summary = {
        "total": (
            Artwork.query.count()
        ),

        "published": (
            Artwork.query
            .filter(
                Artwork.status
                == "published"
            )
            .count()
        ),

        "draft": (
            Artwork.query
            .filter(
                Artwork.status
                == "draft"
            )
            .count()
        ),

        "sold": (
            Artwork.query
            .filter(
                Artwork.status
                == "sold"
            )
            .count()
        ),

        "archived": (
            Artwork.query
            .filter(
                Artwork.status
                == "archived"
            )
            .count()
        ),
    }

    return jsonify({
        "items": [
            serialize_artwork(
                artwork
            )
            for artwork
            in pagination.items
        ],

        "summary": summary,

        "categories": categories,

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


@artworks_bp.patch(
    "/admin/<int:artwork_id>/status"
)
@roles_required("admin")
def admin_update_artwork_status(
    artwork_id,
):
    artwork = (
        Artwork.query
        .get_or_404(
            artwork_id
        )
    )

    data = request.get_json(
        silent=True
    ) or {}

    next_status = (
        data.get(
            "status",
            "",
        )
        .strip()
        .lower()
    )

    if (
        next_status
        not in {
            "published",
            "archived",
        }
    ):
        return jsonify({
            "error": (
                "Admin status must be "
                "published or archived"
            )
        }), 400

    if artwork.status == "sold":
        return jsonify({
            "error": (
                "Sold artworks cannot "
                "be moderated"
            )
        }), 409

    previous_status = (
        artwork.status
    )

    artwork.status = (
        next_status
    )

    try:
        db.session.commit()

        return jsonify({
            "message": (
                f'Artwork changed from '
                f'"{previous_status}" to '
                f'"{next_status}"'
            ),
            "artwork": (
                serialize_artwork(
                    artwork
                )
            ),
        }), 200

    except Exception as error:
        db.session.rollback()

        current_app.logger.exception(
            error
        )

        return jsonify({
            "error": (
                "Failed to update "
                "artwork status"
            )
        }), 500


@artworks_bp.get("/mine")
@roles_required(
    "artist",
    "admin",
)
def list_my_artworks():
    user_id = int(
        get_jwt_identity()
    )

    artworks = (
        Artwork.query
        .filter_by(
            artist_id=user_id
        )
        .order_by(
            Artwork.created_at.desc()
        )
        .all()
    )

    return jsonify({
        "items": [
            serialize_artwork(
                artwork
            )
            for artwork
            in artworks
        ]
    }), 200


@artworks_bp.get(
    "/<int:artwork_id>"
)
def get_artwork(
    artwork_id,
):
    artwork = (
        Artwork.query
        .get_or_404(
            artwork_id
        )
    )

    artwork.views = (
        artwork.views or 0
    ) + 1

    db.session.commit()

    return jsonify(
        serialize_artwork(
            artwork
        )
    ), 200


@artworks_bp.post("")
@roles_required(
    "artist",
    "admin",
)
def create_artwork():
    title = request.form.get(
        "title",
        "",
    ).strip()

    description = request.form.get(
        "description",
        "",
    ).strip()

    category = request.form.get(
        "category",
        "",
    ).strip()

    medium = request.form.get(
        "medium",
        "",
    ).strip()

    year = request.form.get(
        "year",
        "",
    ).strip()

    price = request.form.get(
        "price",
        "",
    ).strip()

    status = (
        request.form.get(
            "status",
            "published",
        )
        .strip()
        .lower()
    )

    image = request.files.get(
        "image"
    )

    if not title:
        return jsonify({
            "error": (
                "Title is required"
            )
        }), 400

    if not price:
        return jsonify({
            "error": (
                "Price is required"
            )
        }), 400

    if status not in {
        "draft",
        "published",
    }:
        return jsonify({
            "error": (
                "New artwork status must "
                "be draft or published"
            )
        }), 400

    if image is None:
        return jsonify({
            "error": (
                "Artwork image is required"
            )
        }), 400

    if image.filename == "":
        return jsonify({
            "error": (
                "Please choose an image"
            )
        }), 400

    if not allowed_file(
        image.filename
    ):
        return jsonify({
            "error": (
                "Only PNG, JPG, JPEG, "
                "WEBP and GIF images "
                "are allowed"
            )
        }), 400

    try:
        price_value = float(
            price
        )

        if price_value < 0:
            return jsonify({
                "error": (
                    "Price cannot be negative"
                )
            }), 400

    except ValueError:
        return jsonify({
            "error": "Invalid price"
        }), 400

    year_value = None

    if year:
        try:
            year_value = int(
                year
            )

        except ValueError:
            return jsonify({
                "error": "Invalid year"
            }), 400

    original_filename = (
        secure_filename(
            image.filename
        )
    )

    extension = (
        original_filename
        .rsplit(".", 1)[1]
        .lower()
    )

    unique_filename = (
        f"{uuid.uuid4().hex}."
        f"{extension}"
    )

    upload_folder = os.path.join(
        current_app.root_path,
        "static",
        "uploads",
        "artworks",
    )

    os.makedirs(
        upload_folder,
        exist_ok=True,
    )

    image_path = os.path.join(
        upload_folder,
        unique_filename,
    )

    image.save(
        image_path
    )

    image_url = (
        "/static/uploads/artworks/"
        f"{unique_filename}"
    )

    artwork = Artwork(
        title=title,
        description=(
            description or None
        ),
        category=(
            category or None
        ),
        medium=(
            medium or None
        ),
        year=year_value,
        price=price_value,
        image_url=image_url,
        artist_id=int(
            get_jwt_identity()
        ),
        status=status,
    )

    try:
        db.session.add(
            artwork
        )

        db.session.commit()

        return jsonify(
            serialize_artwork(
                artwork
            )
        ), 201

    except Exception as error:
        db.session.rollback()

        if os.path.exists(
            image_path
        ):
            os.remove(
                image_path
            )

        current_app.logger.exception(
            error
        )

        return jsonify({
            "error": (
                "Failed to save artwork"
            )
        }), 500


@artworks_bp.put(
    "/<int:artwork_id>"
)
@jwt_required()
def update_artwork(
    artwork_id,
):
    artwork = (
        Artwork.query
        .get_or_404(
            artwork_id
        )
    )

    user = (
        User.query
        .get_or_404(
            int(
                get_jwt_identity()
            )
        )
    )

    if (
        artwork.artist_id
        != user.id
        and user.role != "admin"
    ):
        return jsonify({
            "error": "Not allowed"
        }), 403

    if (
        artwork.status == "sold"
        and user.role != "admin"
    ):
        return jsonify({
            "error": (
                "Sold artworks cannot "
                "be edited"
            )
        }), 409

    title = request.form.get(
        "title"
    )

    description = request.form.get(
        "description"
    )

    category = request.form.get(
        "category"
    )

    medium = request.form.get(
        "medium"
    )

    year = request.form.get(
        "year"
    )

    price = request.form.get(
        "price"
    )

    status = request.form.get(
        "status"
    )

    if title is not None:
        artwork.title = (
            title.strip()
        )

    if description is not None:
        artwork.description = (
            description.strip()
        )

    if category is not None:
        artwork.category = (
            category.strip()
        )

    if medium is not None:
        artwork.medium = (
            medium.strip()
        )

    if year is not None:
        if year == "":
            artwork.year = None

        else:
            try:
                artwork.year = int(
                    year
                )

            except ValueError:
                return jsonify({
                    "error": (
                        "Invalid year"
                    )
                }), 400

    if (
        price is not None
        and price != ""
    ):
        try:
            price_value = float(
                price
            )

            if price_value < 0:
                return jsonify({
                    "error": (
                        "Price cannot "
                        "be negative"
                    )
                }), 400

            artwork.price = (
                price_value
            )

        except ValueError:
            return jsonify({
                "error": (
                    "Invalid price"
                )
            }), 400

    if status is not None:
        normalized_status = (
            status.strip().lower()
        )

        if (
            normalized_status
            not in VALID_ARTWORK_STATUSES
        ):
            return jsonify({
                "error": (
                    "Invalid artwork status"
                )
            }), 400

        if (
            artwork.status == "sold"
            and normalized_status != "sold"
        ):
            return jsonify({
                "error": (
                    "Sold artwork status "
                    "cannot be changed"
                )
            }), 409

        artwork.status = (
            normalized_status
        )

    image = request.files.get(
        "image"
    )

    new_image_path = None
    old_image_url = (
        artwork.image_url
    )

    if (
        image
        and image.filename
    ):
        if not allowed_file(
            image.filename
        ):
            return jsonify({
                "error": (
                    "Only PNG, JPG, JPEG, "
                    "WEBP and GIF images "
                    "are allowed"
                )
            }), 400

        original_filename = (
            secure_filename(
                image.filename
            )
        )

        extension = (
            original_filename
            .rsplit(".", 1)[1]
            .lower()
        )

        unique_filename = (
            f"{uuid.uuid4().hex}."
            f"{extension}"
        )

        upload_folder = os.path.join(
            current_app.root_path,
            "static",
            "uploads",
            "artworks",
        )

        os.makedirs(
            upload_folder,
            exist_ok=True,
        )

        new_image_path = os.path.join(
            upload_folder,
            unique_filename,
        )

        image.save(
            new_image_path
        )

        artwork.image_url = (
            "/static/uploads/artworks/"
            f"{unique_filename}"
        )

    try:
        db.session.commit()

        if (
            new_image_path
            and old_image_url
        ):
            delete_uploaded_image(
                old_image_url
            )

        return jsonify(
            serialize_artwork(
                artwork
            )
        ), 200

    except Exception as error:
        db.session.rollback()

        if (
            new_image_path
            and os.path.exists(
                new_image_path
            )
        ):
            os.remove(
                new_image_path
            )

        current_app.logger.exception(
            error
        )

        return jsonify({
            "error": (
                "Failed to update artwork"
            )
        }), 500


@artworks_bp.delete(
    "/<int:artwork_id>"
)
@jwt_required()
def delete_artwork(
    artwork_id,
):
    artwork = (
        Artwork.query
        .get_or_404(
            artwork_id
        )
    )

    user = (
        User.query
        .get_or_404(
            int(
                get_jwt_identity()
            )
        )
    )

    if (
        artwork.artist_id
        != user.id
        and user.role != "admin"
    ):
        return jsonify({
            "error": "Not allowed"
        }), 403

    if artwork.status == "sold":
        return jsonify({
            "error": (
                "Sold artworks cannot "
                "be deleted"
            )
        }), 409

    image_url = (
        artwork.image_url
    )

    try:
        db.session.delete(
            artwork
        )

        db.session.commit()

        delete_uploaded_image(
            image_url
        )

        return "", 204

    except Exception as error:
        db.session.rollback()

        current_app.logger.exception(
            error
        )

        return jsonify({
            "error": (
                "Failed to delete artwork. "
                "It may be referenced by "
                "orders, reviews or exhibitions."
            )
        }), 409