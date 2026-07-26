from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy.exc import IntegrityError

from app import db
from app.models import Artwork, Review, User


reviews_bp = Blueprint(
    "reviews",
    __name__,
)


def serialize_review(review):
    return {
        "id": review.id,
        "user_id": review.user_id,
        "artwork_id": review.artwork_id,
        "rating": review.rating,
        "comment": review.comment or "",
        "created_at": (
            review.created_at.isoformat()
            if review.created_at
            else None
        ),
        "updated_at": (
            review.updated_at.isoformat()
            if review.updated_at
            else None
        ),
        "user": {
            "id": review.user.id,
            "name": review.user.name,
        }
        if review.user
        else None,
    }


def validate_rating(value):
    try:
        rating = int(value)

    except (TypeError, ValueError):
        return None, "Rating must be a number from 1 to 5"

    if rating < 1 or rating > 5:
        return None, "Rating must be between 1 and 5"

    return rating, None


@reviews_bp.post("")
@jwt_required()
def create_review():
    data = request.get_json(
        silent=True
    ) or {}

    artwork_id = data.get(
        "artwork_id"
    )

    if artwork_id is None:
        return jsonify({
            "success": False,
            "error": "artwork_id is required",
        }), 400

    try:
        artwork_id = int(
            artwork_id
        )

    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "error": "Invalid artwork ID",
        }), 400

    artwork = Artwork.query.get(
        artwork_id
    )

    if not artwork:
        return jsonify({
            "success": False,
            "error": "Artwork not found",
        }), 404

    if artwork.status != "published":
        return jsonify({
            "success": False,
            "error": (
                "Only published artworks "
                "can be reviewed"
            ),
        }), 400

    rating, rating_error = (
        validate_rating(
            data.get("rating")
        )
    )

    if rating_error:
        return jsonify({
            "success": False,
            "error": rating_error,
        }), 400

    comment = (
        data.get("comment") or ""
    ).strip()

    if len(comment) > 2000:
        return jsonify({
            "success": False,
            "error": (
                "Comment cannot exceed "
                "2000 characters"
            ),
        }), 400

    user_id = int(
        get_jwt_identity()
    )

    User.query.get_or_404(
        user_id
    )

    existing_review = (
        Review.query.filter_by(
            user_id=user_id,
            artwork_id=artwork_id,
        ).first()
    )

    if existing_review:
        return jsonify({
            "success": False,
            "error": (
                "You have already reviewed "
                "this artwork. Edit your "
                "existing review instead."
            ),
            "review": serialize_review(
                existing_review
            ),
        }), 409

    review = Review(
        user_id=user_id,
        artwork_id=artwork_id,
        rating=rating,
        comment=comment or None,
    )

    try:
        db.session.add(
            review
        )

        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "error": (
                "You have already reviewed "
                "this artwork"
            ),
        }), 409

    return jsonify({
        "success": True,
        "message": (
            "Review added successfully"
        ),
        "review": serialize_review(
            review
        ),
        "rating_summary": {
            "average_rating": (
                artwork.average_rating
            ),
            "review_count": (
                artwork.review_count
            ),
        },
    }), 201


@reviews_bp.get(
    "/artworks/<int:artwork_id>"
)
def get_artwork_reviews(
    artwork_id,
):
    artwork = Artwork.query.get(
        artwork_id
    )

    if not artwork:
        return jsonify({
            "success": False,
            "error": "Artwork not found",
        }), 404

    reviews = (
        Review.query
        .filter_by(
            artwork_id=artwork_id
        )
        .order_by(
            Review.created_at.desc()
        )
        .all()
    )

    return jsonify({
        "success": True,
        "artwork_id": artwork.id,
        "average_rating": (
            artwork.average_rating
        ),
        "review_count": len(
            reviews
        ),
        "reviews": [
            serialize_review(
                review
            )
            for review in reviews
        ],
    }), 200


@reviews_bp.put(
    "/<int:review_id>"
)
@jwt_required()
def update_review(
    review_id,
):
    review = Review.query.get(
        review_id
    )

    if not review:
        return jsonify({
            "success": False,
            "error": "Review not found",
        }), 404

    current_user_id = int(
        get_jwt_identity()
    )

    if review.user_id != current_user_id:
        return jsonify({
            "success": False,
            "error": (
                "You can edit only your "
                "own review"
            ),
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    if "rating" not in data:
        return jsonify({
            "success": False,
            "error": "rating is required",
        }), 400

    rating, rating_error = (
        validate_rating(
            data.get("rating")
        )
    )

    if rating_error:
        return jsonify({
            "success": False,
            "error": rating_error,
        }), 400

    comment = (
        data.get("comment") or ""
    ).strip()

    if len(comment) > 2000:
        return jsonify({
            "success": False,
            "error": (
                "Comment cannot exceed "
                "2000 characters"
            ),
        }), 400

    review.rating = rating
    review.comment = (
        comment or None
    )

    try:
        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "error": (
                "Failed to update review"
            ),
        }), 500

    artwork = review.artwork

    return jsonify({
        "success": True,
        "message": (
            "Review updated successfully"
        ),
        "review": serialize_review(
            review
        ),
        "rating_summary": {
            "average_rating": (
                artwork.average_rating
            ),
            "review_count": (
                artwork.review_count
            ),
        },
    }), 200


@reviews_bp.delete(
    "/<int:review_id>"
)
@jwt_required()
def delete_review(
    review_id,
):
    review = Review.query.get(
        review_id
    )

    if not review:
        return jsonify({
            "success": False,
            "error": "Review not found",
        }), 404

    current_user_id = int(
        get_jwt_identity()
    )

    if review.user_id != current_user_id:
        return jsonify({
            "success": False,
            "error": (
                "You can delete only your "
                "own review"
            ),
        }), 403

    artwork = review.artwork

    try:
        db.session.delete(
            review
        )

        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "error": (
                "Failed to delete review"
            ),
        }), 500

    return jsonify({
        "success": True,
        "message": (
            "Review deleted successfully"
        ),
        "rating_summary": {
            "average_rating": (
                artwork.average_rating
            ),
            "review_count": (
                artwork.review_count
            ),
        },
    }), 200