from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from app import db
from app.models import User


auth_bp = Blueprint("auth", __name__)


# Roles that users may select during
# public website registration.
PUBLIC_REGISTRATION_ROLES = {
    "visitor",
    "artist",
}


def validate_password(password):
    """
    Validate account passwords on the backend.
    """
    password = str(password or "")

    if len(password) < 8:
        return (
            "Password must contain at least "
            "8 characters"
        )

    if len(password) > 128:
        return "Password is too long"

    if not any(
        character.isalpha()
        for character in password
    ):
        return (
            "Password must contain at least "
            "one letter"
        )

    if not any(
        character.isdigit()
        for character in password
    ):
        return (
            "Password must contain at least "
            "one number"
        )

    return None


def normalize_role(role):
    """
    Return a normalized lowercase role value.
    """
    return str(
        role or ""
    ).strip().lower()


def user_is_admin(user):
    """
    Support both administrator account formats:

        role = "admin"

    and dual-role accounts:

        role = "artist"
        is_admin = True
    """
    if not user:
        return False

    return (
        normalize_role(
            getattr(
                user,
                "role",
                "",
            )
        )
        == "admin"
        or bool(
            getattr(
                user,
                "is_admin",
                False,
            )
        )
    )


def serialize_user(user):
    """
    Return the user and permission fields
    required by the React frontend.
    """
    if not user:
        return None

    data = user.to_dict()

    role = normalize_role(
        getattr(
            user,
            "role",
            "visitor",
        )
    )

    data["role"] = role

    data["is_admin"] = (
        user_is_admin(user)
    )

    data["is_artist"] = (
        role == "artist"
    )

    data["is_curator"] = (
        role == "curator"
    )

    return data


def generate_claims(user):
    """
    Create JWT permission claims for the
    authenticated user.
    """
    role = normalize_role(
        getattr(
            user,
            "role",
            "visitor",
        )
    )

    return {
        "role": role,
        "name": user.name,
        "is_admin": user_is_admin(
            user
        ),
        "is_artist": (
            role == "artist"
        ),
        "is_curator": (
            role == "curator"
        ),
    }


def generate_tokens(user):
    """
    Generate access and refresh tokens using
    the user ID as the JWT identity.
    """
    claims = generate_claims(
        user
    )

    access_token = (
        create_access_token(
            identity=str(
                user.id
            ),
            additional_claims=claims,
        )
    )

    refresh_token = (
        create_refresh_token(
            identity=str(
                user.id
            ),
            additional_claims=claims,
        )
    )

    return (
        access_token,
        refresh_token,
    )


def load_authenticated_user():
    """
    Load and validate the user represented
    by the current JWT.

    Returns:
        tuple: (user, error_response)
    """
    try:
        user_id = int(
            get_jwt_identity()
        )
    except (
        TypeError,
        ValueError,
    ):
        return None, (
            jsonify({
                "error": (
                    "Invalid token identity"
                ),
            }),
            401,
        )

    user = db.session.get(
        User,
        user_id,
    )

    if not user:
        return None, (
            jsonify({
                "error": (
                    "User account not found"
                ),
            }),
            404,
        )

    if not bool(
        getattr(
            user,
            "is_active",
            True,
        )
    ):
        return None, (
            jsonify({
                "error": (
                    "Your account has "
                    "been disabled"
                ),
            }),
            403,
        )

    return user, None


@auth_bp.post("/register")
def register():
    """
    Register a visitor or artist account.

    Public users cannot register themselves
    as administrators or curators.
    """
    data = request.get_json(
        silent=True
    ) or {}

    name = str(
        data.get(
            "name",
            "",
        )
    ).strip()

    email = str(
        data.get(
            "email",
            "",
        )
    ).strip().lower()

    password = str(
        data.get(
            "password",
            "",
        )
    )

    requested_role = normalize_role(
        data.get(
            "role",
            "visitor",
        )
    )

    if not name:
        return jsonify({
            "error": (
                "Name is required"
            ),
        }), 400

    if len(name) > 120:
        return jsonify({
            "error": (
                "Name is too long"
            ),
        }), 400

    if not email:
        return jsonify({
            "error": (
                "Email is required"
            ),
        }), 400

    if (
        "@" not in email
        or "." not in email.split(
            "@"
        )[-1]
    ):
        return jsonify({
            "error": (
                "Enter a valid "
                "email address"
            ),
        }), 400

    password_error = (
        validate_password(
            password
        )
    )

    if password_error:
        return jsonify({
            "error": password_error,
        }), 400

    if (
        requested_role
        not in PUBLIC_REGISTRATION_ROLES
    ):
        return jsonify({
            "error": (
                "You can register only "
                "as a visitor or artist"
            ),
        }), 400

    existing_user = (
        User.query
        .filter_by(
            email=email
        )
        .first()
    )

    if existing_user:
        return jsonify({
            "error": (
                "Email already registered"
            ),
        }), 409

    user = User(
        name=name,
        email=email,
        role=requested_role,
        is_admin=False,
        is_active=True,
    )

    user.set_password(
        password
    )

    try:
        db.session.add(
            user
        )

        db.session.commit()

    except Exception as error:
        db.session.rollback()

        print(
            "Registration database error:",
            error,
        )

        return jsonify({
            "error": (
                "Unable to create account"
            ),
        }), 500

    access_token, refresh_token = (
        generate_tokens(
            user
        )
    )

    return jsonify({
        "message": (
            "Account created successfully"
        ),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": serialize_user(
            user
        ),
    }), 201


@auth_bp.post("/login")
def login():
    """
    Authenticate an existing user.
    """
    data = request.get_json(
        silent=True
    ) or {}

    email = str(
        data.get(
            "email",
            "",
        )
    ).strip().lower()

    password = str(
        data.get(
            "password",
            "",
        )
    )

    if not email or not password:
        return jsonify({
            "error": (
                "Email and password "
                "are required"
            ),
        }), 400

    user = (
        User.query
        .filter_by(
            email=email
        )
        .first()
    )

    if (
        not user
        or not user.check_password(
            password
        )
    ):
        return jsonify({
            "error": (
                "Invalid email or password"
            ),
        }), 401

    if not bool(
        getattr(
            user,
            "is_active",
            True,
        )
    ):
        return jsonify({
            "error": (
                "Your account has "
                "been disabled"
            ),
        }), 403

    access_token, refresh_token = (
        generate_tokens(
            user
        )
    )

    return jsonify({
        "message": (
            "Login successful"
        ),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": serialize_user(
            user
        ),
    }), 200


@auth_bp.post("/refresh")
@jwt_required(
    refresh=True
)
def refresh():
    """
    Generate a new access token using
    a valid refresh token.
    """
    user, error_response = (
        load_authenticated_user()
    )

    if error_response:
        return error_response

    access_token = (
        create_access_token(
            identity=str(
                user.id
            ),
            additional_claims=(
                generate_claims(
                    user
                )
            ),
        )
    )

    return jsonify({
        "access_token": (
            access_token
        ),
        "user": serialize_user(
            user
        ),
    }), 200


@auth_bp.get("/me")
@jwt_required()
def get_current_user():
    """
    Return the currently authenticated user.
    """
    user, error_response = (
        load_authenticated_user()
    )

    if error_response:
        return error_response

    return jsonify({
        "user": serialize_user(
            user
        ),
    }), 200