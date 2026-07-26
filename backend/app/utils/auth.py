from functools import wraps

from flask import jsonify

from flask_jwt_extended import (
    get_jwt,
    verify_jwt_in_request,
)


def normalize_role(role):
    return str(
        role or ""
    ).strip().lower()


def roles_required(
    *roles,
):
    """
    Allow access based on the primary role or
    the secondary is_admin permission.

    Example account:

        role = "artist"
        is_admin = True

    This account can access both artist routes
    and admin routes.
    """

    allowed_roles = {
        normalize_role(role)
        for role in roles
        if normalize_role(role)
    }

    def decorator(
        fn,
    ):
        @wraps(fn)
        def wrapper(
            *args,
            **kwargs,
        ):
            verify_jwt_in_request()

            claims = get_jwt()

            current_role = normalize_role(
                claims.get("role")
            )

            is_admin = bool(
                claims.get(
                    "is_admin",
                    False,
                )
            )

            has_permission = (
                current_role in allowed_roles
                or (
                    "admin" in allowed_roles
                    and is_admin
                )
            )

            if not has_permission:
                return jsonify({
                    "error": (
                        "Insufficient permissions"
                    )
                }), 403

            return fn(
                *args,
                **kwargs,
            )

        return wrapper

    return decorator