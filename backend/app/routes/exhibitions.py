import json
import os
import re
import uuid
from datetime import datetime
from pathlib import Path

from flask import (
    Blueprint,
    current_app,
    jsonify,
    request,
)
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import or_
from werkzeug.utils import secure_filename

from app import db
from app.models import Artwork, Exhibition
from app.utils.auth import roles_required


exhibitions_bp = Blueprint(
    "exhibitions",
    __name__,
)


ALLOWED_BANNER_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp",
}

MAX_BANNER_SIZE = 5 * 1024 * 1024


def allowed_banner_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_BANNER_EXTENSIONS
    )


def slugify(value):
    value = value.strip().lower()

    value = re.sub(
        r"[^a-z0-9\s-]",
        "",
        value,
    )

    value = re.sub(
        r"[\s_-]+",
        "-",
        value,
    )

    return value.strip("-")


def generate_unique_slug(title, current_id=None):
    base_slug = slugify(title)

    if not base_slug:
        base_slug = "exhibition"

    slug = base_slug
    counter = 2

    while True:
        query = Exhibition.query.filter_by(
            slug=slug
        )

        if current_id is not None:
            query = query.filter(
                Exhibition.id != current_id
            )

        if not query.first():
            return slug

        slug = f"{base_slug}-{counter}"
        counter += 1


def parse_datetime_value(value, field_name):
    if not value:
        raise ValueError(
            f"{field_name} is required."
        )

    supported_formats = [
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%dT%H:%M:%S",
    ]

    for date_format in supported_formats:
        try:
            return datetime.strptime(
                value,
                date_format,
            )
        except ValueError:
            continue

    raise ValueError(
        f"Invalid {field_name} format."
    )


def parse_artwork_ids(raw_value):
    if raw_value is None:
        return []

    if isinstance(raw_value, list):
        values = raw_value
    else:
        try:
            values = json.loads(raw_value)
        except (
            json.JSONDecodeError,
            TypeError,
        ):
            raise ValueError(
                "artwork_ids must be a valid JSON array."
            )

    if not isinstance(values, list):
        raise ValueError(
            "artwork_ids must be an array."
        )

    artwork_ids = []

    for value in values:
        try:
            artwork_id = int(value)
        except (
            TypeError,
            ValueError,
        ):
            raise ValueError(
                "Every artwork ID must be an integer."
            )

        if artwork_id not in artwork_ids:
            artwork_ids.append(artwork_id)

    return artwork_ids


def get_request_data():
    if request.is_json:
        return request.get_json(
            silent=True
        ) or {}

    return request.form.to_dict()


def get_banner_upload_folder():
    configured_folder = current_app.config.get(
        "UPLOAD_FOLDER"
    )

    if configured_folder:
        upload_root = Path(
            configured_folder
        )
    else:
        upload_root = (
            Path(current_app.root_path)
            / "static"
            / "uploads"
        )

    exhibition_folder = (
        upload_root / "exhibitions"
    )

    exhibition_folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    return exhibition_folder


def save_banner_file(file):
    if not file or not file.filename:
        return None

    if not allowed_banner_file(
        file.filename
    ):
        raise ValueError(
            "Banner must be a JPG, JPEG, PNG, or WebP image."
        )

    file.seek(
        0,
        os.SEEK_END,
    )

    file_size = file.tell()

    file.seek(0)

    if file_size > MAX_BANNER_SIZE:
        raise ValueError(
            "Banner image must be smaller than 5 MB."
        )

    extension = (
        secure_filename(file.filename)
        .rsplit(".", 1)[1]
        .lower()
    )

    unique_filename = (
        f"{uuid.uuid4().hex}.{extension}"
    )

    upload_folder = (
        get_banner_upload_folder()
    )

    file_path = (
        upload_folder
        / unique_filename
    )

    file.save(file_path)

    return (
        f"/static/uploads/exhibitions/"
        f"{unique_filename}"
    )


def delete_banner_file(banner_url):
    if not banner_url:
        return

    if not banner_url.startswith(
        "/static/uploads/exhibitions/"
    ):
        return

    filename = banner_url.rsplit(
        "/",
        1,
    )[-1]

    file_path = (
        get_banner_upload_folder()
        / filename
    )

    try:
        if file_path.exists():
            file_path.unlink()
    except OSError:
        current_app.logger.warning(
            "Could not delete exhibition banner: %s",
            file_path,
        )


def get_selected_artworks(
    artwork_ids,
    curator_id,
    allow_all=False,
):
    if not artwork_ids:
        return []

    query = Artwork.query.filter(
        Artwork.id.in_(
            artwork_ids
        )
    )

    if not allow_all:
        query = query.filter(
            Artwork.artist_id
            == curator_id
        )

    artworks = query.all()

    found_ids = {
        artwork.id
        for artwork in artworks
    }

    missing_ids = [
        artwork_id
        for artwork_id in artwork_ids
        if artwork_id not in found_ids
    ]

    if missing_ids:
        raise ValueError(
            "Some selected artworks were not found "
            "or cannot be used."
        )

    return artworks


def can_manage_exhibition(
    exhibition,
    current_user_id,
    current_role,
):
    return (
        current_role == "admin"
        or exhibition.curator_id
        == current_user_id
    )


def get_current_role():
    from app.models import User

    user_id = int(
        get_jwt_identity()
    )

    user = db.session.get(
        User,
        user_id,
    )

    return user.role if user else None


@exhibitions_bp.get("")
def list_exhibitions():
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
            "published",
        )
        .strip()
        .lower()
    )

    lifecycle = (
        request.args.get(
            "lifecycle",
            "",
        )
        .strip()
        .lower()
    )

    featured = request.args.get(
        "featured"
    )

    page = max(
        request.args.get(
            "page",
            1,
            type=int,
        ),
        1,
    )

    per_page = request.args.get(
        "per_page",
        12,
        type=int,
    )

    per_page = min(
        max(per_page, 1),
        50,
    )

    query = Exhibition.query

    if status and status != "all":
        query = query.filter(
            Exhibition.status == status
        )

    if featured is not None:
        featured_value = (
            featured.lower()
            in {
                "true",
                "1",
                "yes",
            }
        )

        query = query.filter(
            Exhibition.is_featured
            == featured_value
        )

    if search:
        search_pattern = (
            f"%{search}%"
        )

        query = query.filter(
            or_(
                Exhibition.title.ilike(
                    search_pattern
                ),
                Exhibition.description.ilike(
                    search_pattern
                ),
            )
        )

    now = datetime.utcnow()

    if lifecycle == "upcoming":
        query = query.filter(
            Exhibition.starts_at > now
        )

    elif lifecycle == "live":
        query = query.filter(
            Exhibition.starts_at <= now,
            Exhibition.ends_at >= now,
        )

    elif lifecycle == "closed":
        query = query.filter(
            Exhibition.ends_at < now
        )

    pagination = query.order_by(
        Exhibition.is_featured.desc(),
        Exhibition.starts_at.desc(),
        Exhibition.created_at.desc(),
    ).paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )

    return jsonify(
        {
            "exhibitions": [
                exhibition.to_summary_dict()
                for exhibition
                in pagination.items
            ],
            "pagination": {
                "page": pagination.page,
                "per_page": (
                    pagination.per_page
                ),
                "total": pagination.total,
                "pages": pagination.pages,
                "has_next": (
                    pagination.has_next
                ),
                "has_prev": (
                    pagination.has_prev
                ),
            },
        }
    )


@exhibitions_bp.get(
    "/featured"
)
def get_featured_exhibition():
    now = datetime.utcnow()

    exhibition = (
        Exhibition.query.filter(
            Exhibition.status
            == "published",
            Exhibition.is_featured
            .is_(True),
        )
        .order_by(
            Exhibition.starts_at.desc()
        )
        .first()
    )

    if not exhibition:
        exhibition = (
            Exhibition.query.filter(
                Exhibition.status
                == "published",
                Exhibition.starts_at
                <= now,
                Exhibition.ends_at
                >= now,
            )
            .order_by(
                Exhibition.starts_at.desc()
            )
            .first()
        )

    if not exhibition:
        return jsonify(
            {
                "error": (
                    "No featured exhibition found."
                )
            }
        ), 404

    return jsonify(
        exhibition.to_summary_dict()
    )


@exhibitions_bp.get(
    "/mine"
)
@roles_required(
    "artist",
    "curator",
    "admin",
)
def list_my_exhibitions():
    current_user_id = int(
        get_jwt_identity()
    )

    current_role = get_current_role()

    query = Exhibition.query

    if current_role != "admin":
        query = query.filter(
            Exhibition.curator_id
            == current_user_id
        )

    exhibitions = query.order_by(
        Exhibition.created_at.desc()
    ).all()

    return jsonify(
        {
            "exhibitions": [
                exhibition.to_summary_dict()
                for exhibition
                in exhibitions
            ]
        }
    )


@exhibitions_bp.get(
    "/<string:slug>"
)
def get_exhibition(slug):
    exhibition = (
        Exhibition.query.filter_by(
            slug=slug
        ).first_or_404()
    )

    if exhibition.status != "published":
        return jsonify(
            {
                "error": (
                    "Exhibition is not publicly available."
                )
            }
        ), 404

    exhibition.views = (
        exhibition.views or 0
    ) + 1

    db.session.commit()

    return jsonify(
        exhibition.to_dict()
    )


@exhibitions_bp.post("")
@roles_required(
    "artist",
    "curator",
    "admin",
)
def create_exhibition():
    data = get_request_data()

    title = (
        data.get(
            "title",
            "",
        )
        .strip()
    )

    description = (
        data.get(
            "description",
            "",
        )
        .strip()
    )

    status = (
        data.get(
            "status",
            "draft",
        )
        .strip()
        .lower()
    )

    if not title:
        return jsonify(
            {
                "error": (
                    "Exhibition title is required."
                )
            }
        ), 400

    if not description:
        return jsonify(
            {
                "error": (
                    "Exhibition description is required."
                )
            }
        ), 400

    if status not in {
        "draft",
        "published",
    }:
        return jsonify(
            {
                "error": (
                    "Status must be draft or published."
                )
            }
        ), 400

    try:
        starts_at = parse_datetime_value(
            data.get(
                "start_date"
            )
            or data.get(
                "starts_at"
            ),
            "opening date",
        )

        ends_at = parse_datetime_value(
            data.get(
                "end_date"
            )
            or data.get(
                "ends_at"
            ),
            "closing date",
        )
    except ValueError as error:
        return jsonify(
            {
                "error": str(error)
            }
        ), 400

    if ends_at <= starts_at:
        return jsonify(
            {
                "error": (
                    "Closing date must be after the opening date."
                )
            }
        ), 400

    try:
        artwork_ids = parse_artwork_ids(
            data.get(
                "artwork_ids"
            )
        )
    except ValueError as error:
        return jsonify(
            {
                "error": str(error)
            }
        ), 400

    if not artwork_ids:
        return jsonify(
            {
                "error": (
                    "Select at least one artwork."
                )
            }
        ), 400

    current_user_id = int(
        get_jwt_identity()
    )

    current_role = get_current_role()

    try:
        artworks = get_selected_artworks(
            artwork_ids,
            current_user_id,
            allow_all=(
                current_role == "admin"
            ),
        )
    except ValueError as error:
        return jsonify(
            {
                "error": str(error)
            }
        ), 400

    banner_url = (
        data.get(
            "banner_url"
        )
        or None
    )

    banner_file = request.files.get(
        "banner"
    )

    try:
        if banner_file:
            banner_url = save_banner_file(
                banner_file
            )
    except ValueError as error:
        return jsonify(
            {
                "error": str(error)
            }
        ), 400

    if not banner_url:
        return jsonify(
            {
                "error": (
                    "Exhibition banner is required."
                )
            }
        ), 400

    exhibition = Exhibition(
        title=title,
        slug=generate_unique_slug(
            title
        ),
        description=description,
        banner_url=banner_url,
        starts_at=starts_at,
        ends_at=ends_at,
        status=status,
        curator_id=current_user_id,
    )

    exhibition.artworks = artworks

    try:
        db.session.add(
            exhibition
        )

        db.session.commit()

        return jsonify(
            {
                "message": (
                    "Exhibition created successfully."
                ),
                "exhibition": (
                    exhibition.to_dict()
                ),
            }
        ), 201

    except Exception:
        db.session.rollback()

        if (
            banner_file
            and banner_url
        ):
            delete_banner_file(
                banner_url
            )

        current_app.logger.exception(
            "Failed to create exhibition."
        )

        return jsonify(
            {
                "error": (
                    "Failed to create exhibition."
                )
            }
        ), 500


@exhibitions_bp.put(
    "/<int:exhibition_id>"
)
@exhibitions_bp.patch(
    "/<int:exhibition_id>"
)
@roles_required(
    "artist",
    "curator",
    "admin",
)
def update_exhibition(
    exhibition_id,
):
    exhibition = (
        Exhibition.query.get_or_404(
            exhibition_id
        )
    )

    current_user_id = int(
        get_jwt_identity()
    )

    current_role = get_current_role()

    if not can_manage_exhibition(
        exhibition,
        current_user_id,
        current_role,
    ):
        return jsonify(
            {
                "error": (
                    "You cannot edit this exhibition."
                )
            }
        ), 403

    data = get_request_data()

    old_banner_url = (
        exhibition.banner_url
    )

    new_banner_url = None

    try:
        if "title" in data:
            title = (
                data.get(
                    "title",
                    "",
                )
                .strip()
            )

            if not title:
                raise ValueError(
                    "Exhibition title is required."
                )

            exhibition.title = title

            exhibition.slug = (
                generate_unique_slug(
                    title,
                    current_id=exhibition.id,
                )
            )

        if "description" in data:
            description = (
                data.get(
                    "description",
                    "",
                )
                .strip()
            )

            if not description:
                raise ValueError(
                    "Exhibition description is required."
                )

            exhibition.description = (
                description
            )

        start_value = (
            data.get(
                "start_date"
            )
            or data.get(
                "starts_at"
            )
        )

        end_value = (
            data.get(
                "end_date"
            )
            or data.get(
                "ends_at"
            )
        )

        if start_value:
            exhibition.starts_at = (
                parse_datetime_value(
                    start_value,
                    "opening date",
                )
            )

        if end_value:
            exhibition.ends_at = (
                parse_datetime_value(
                    end_value,
                    "closing date",
                )
            )

        if (
            exhibition.ends_at
            <= exhibition.starts_at
        ):
            raise ValueError(
                "Closing date must be after the opening date."
            )

        if "status" in data:
            status = (
                data.get(
                    "status",
                    "",
                )
                .strip()
                .lower()
            )

            if status not in {
                "draft",
                "published",
                "archived",
            }:
                raise ValueError(
                    "Invalid exhibition status."
                )

            exhibition.status = status

        if "artwork_ids" in data:
            artwork_ids = (
                parse_artwork_ids(
                    data.get(
                        "artwork_ids"
                    )
                )
            )

            if not artwork_ids:
                raise ValueError(
                    "Select at least one artwork."
                )

            exhibition.artworks = (
                get_selected_artworks(
                    artwork_ids,
                    current_user_id,
                    allow_all=(
                        current_role
                        == "admin"
                    ),
                )
            )

        banner_file = (
            request.files.get(
                "banner"
            )
        )

        if banner_file:
            new_banner_url = (
                save_banner_file(
                    banner_file
                )
            )

            exhibition.banner_url = (
                new_banner_url
            )

        elif data.get(
            "banner_url"
        ):
            exhibition.banner_url = (
                data.get(
                    "banner_url"
                )
                .strip()
            )

        db.session.commit()

        if (
            new_banner_url
            and old_banner_url
            and old_banner_url
            != new_banner_url
        ):
            delete_banner_file(
                old_banner_url
            )

        return jsonify(
            {
                "message": (
                    "Exhibition updated successfully."
                ),
                "exhibition": (
                    exhibition.to_dict()
                ),
            }
        )

    except ValueError as error:
        db.session.rollback()

        if new_banner_url:
            delete_banner_file(
                new_banner_url
            )

        return jsonify(
            {
                "error": str(error)
            }
        ), 400

    except Exception:
        db.session.rollback()

        if new_banner_url:
            delete_banner_file(
                new_banner_url
            )

        current_app.logger.exception(
            "Failed to update exhibition."
        )

        return jsonify(
            {
                "error": (
                    "Failed to update exhibition."
                )
            }
        ), 500


@exhibitions_bp.delete(
    "/<int:exhibition_id>"
)
@roles_required(
    "artist",
    "curator",
    "admin",
)
def delete_exhibition(
    exhibition_id,
):
    exhibition = (
        Exhibition.query.get_or_404(
            exhibition_id
        )
    )

    current_user_id = int(
        get_jwt_identity()
    )

    current_role = get_current_role()

    if not can_manage_exhibition(
        exhibition,
        current_user_id,
        current_role,
    ):
        return jsonify(
            {
                "error": (
                    "You cannot delete this exhibition."
                )
            }
        ), 403

    banner_url = exhibition.banner_url

    try:
        exhibition.artworks.clear()

        db.session.delete(
            exhibition
        )

        db.session.commit()

        delete_banner_file(
            banner_url
        )

        return jsonify(
            {
                "message": (
                    "Exhibition deleted successfully."
                )
            }
        )

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Failed to delete exhibition."
        )

        return jsonify(
            {
                "error": (
                    "Failed to delete exhibition."
                )
            }
        ), 500




@exhibitions_bp.patch(
    "/<int:exhibition_id>/like"
)
def like_exhibition(
    exhibition_id,
):
    exhibition = db.session.get(
        Exhibition,
        exhibition_id,
    )

    if not exhibition:
        return jsonify(
            {
                "error": (
                    "Exhibition not found."
                )
            }
        ), 404

    if exhibition.status != "published":
        return jsonify(
            {
                "error": (
                    "Only published exhibitions "
                    "can receive appreciations."
                )
            }
        ), 400

    try:
        exhibition.likes = (
            exhibition.likes or 0
        ) + 1

        db.session.commit()

        return jsonify(
            {
                "message": (
                    "Exhibition appreciated."
                ),
                "likes": exhibition.likes,
            }
        ), 200

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Failed to appreciate exhibition."
        )

        return jsonify(
            {
                "error": (
                    "Failed to appreciate "
                    "exhibition."
                )
            }
        ), 500


@exhibitions_bp.patch(
    "/<int:exhibition_id>/unlike"
)
def unlike_exhibition(
    exhibition_id,
):
    exhibition = db.session.get(
        Exhibition,
        exhibition_id,
    )

    if not exhibition:
        return jsonify(
            {
                "error": (
                    "Exhibition not found."
                )
            }
        ), 404

    if exhibition.status != "published":
        return jsonify(
            {
                "error": (
                    "Only published exhibitions "
                    "can receive appreciations."
                )
            }
        ), 400

    try:
        exhibition.likes = max(
            0,
            (exhibition.likes or 0) - 1,
        )

        db.session.commit()

        return jsonify(
            {
                "message": (
                    "Exhibition appreciation "
                    "removed."
                ),
                "likes": exhibition.likes,
            }
        ), 200

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Failed to remove exhibition appreciation."
        )

        return jsonify(
            {
                "error": (
                    "Failed to remove "
                    "appreciation."
                )
            }
        ), 500


@exhibitions_bp.patch(
    "/<int:exhibition_id>/feature"
)
@roles_required("admin")
def feature_exhibition(
    exhibition_id,
):
    exhibition = (
        Exhibition.query.get_or_404(
            exhibition_id
        )
    )

    if exhibition.status != "published":
        return jsonify(
            {
                "error": (
                    "Only published exhibitions can be featured."
                )
            }
        ), 400

    try:
        Exhibition.query.filter(
            Exhibition.id
            != exhibition.id
        ).update(
            {
                Exhibition.is_featured: False
            },
            synchronize_session=False,
        )

        exhibition.is_featured = True

        db.session.commit()

        return jsonify(
            {
                "message": (
                    "Featured exhibition updated."
                ),
                "exhibition": (
                    exhibition.to_summary_dict()
                ),
            }
        )

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Failed to feature exhibition."
        )

        return jsonify(
            {
                "error": (
                    "Failed to feature exhibition."
                )
            }
        ), 500


@exhibitions_bp.patch(
    "/<int:exhibition_id>/unfeature"
)
@roles_required("admin")
def unfeature_exhibition(
    exhibition_id,
):
    exhibition = (
        Exhibition.query.get_or_404(
            exhibition_id
        )
    )

    exhibition.is_featured = False

    db.session.commit()

    return jsonify(
        {
            "message": (
                "Exhibition removed from featured section."
            ),
            "exhibition": (
                exhibition.to_summary_dict()
            ),
        }
    )