from datetime import timedelta

from flask import (
    Flask,
    jsonify,
    request,
)

from flask_cors import CORS

from flask_jwt_extended import (
    JWTManager,
)

from flask_migrate import (
    Migrate,
)

from flask_sqlalchemy import (
    SQLAlchemy,
)

from werkzeug.middleware.proxy_fix import (
    ProxyFix,
)

from config import Config


db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def parse_frontend_origins(app):
    """
    Build the list of frontend origins allowed by CORS.

    Supported environment variables:

        FRONTEND_URL=https://artvault.vercel.app

    or:

        FRONTEND_URLS=https://site-one.vercel.app,https://site-two.vercel.app
    """
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    frontend_url = str(
        app.config.get(
            "FRONTEND_URL",
            "",
        )
        or ""
    ).strip()

    if frontend_url:
        origins.append(
            frontend_url.rstrip("/")
        )

    frontend_urls = str(
        app.config.get(
            "FRONTEND_URLS",
            "",
        )
        or ""
    )

    for origin in frontend_urls.split(","):
        origin = origin.strip()

        if origin:
            origins.append(
                origin.rstrip("/")
            )

    return list(
        dict.fromkeys(origins)
    )


def create_app():
    app = Flask(
        __name__
    )

    # =====================================================
    # APPLICATION CONFIGURATION
    # =====================================================

    app.config.from_object(
        Config
    )

    app.config[
        "JWT_ACCESS_TOKEN_EXPIRES"
    ] = timedelta(
        days=7
    )

    app.config[
        "JWT_REFRESH_TOKEN_EXPIRES"
    ] = timedelta(
        days=30
    )

    # Railway runs Flask behind a reverse proxy.
    app.wsgi_app = ProxyFix(
        app.wsgi_app,
        x_for=1,
        x_proto=1,
        x_host=1,
        x_port=1,
    )

    # =====================================================
    # EXTENSIONS
    # =====================================================

    db.init_app(
        app
    )

    jwt.init_app(
        app
    )

    migrate.init_app(
        app,
        db,
    )

    # =====================================================
    # CORS CONFIGURATION
    # =====================================================

    allowed_origins = (
        parse_frontend_origins(
            app
        )
    )

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": (
                    allowed_origins
                ),
            }
        },
        supports_credentials=True,
        allow_headers=[
            "Content-Type",
            "Authorization",
            "Accept",
        ],
        expose_headers=[
            "Content-Type",
            "Authorization",
        ],
        methods=[
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
        max_age=86400,
    )

    # =====================================================
    # PREFLIGHT HANDLER
    # =====================================================

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            return "", 204

        return None

    # =====================================================
    # JWT ERROR HANDLERS
    # =====================================================

    @jwt.invalid_token_loader
    def invalid_token_callback(
        error_message,
    ):
        return jsonify({
            "success": False,
            "error": error_message,
        }), 422

    @jwt.expired_token_loader
    def expired_token_callback(
        jwt_header,
        jwt_payload,
    ):
        return jsonify({
            "success": False,
            "error": (
                "Token has expired. "
                "Please log in again."
            ),
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(
        error_message,
    ):
        return jsonify({
            "success": False,
            "error": (
                "Authorization token "
                "is missing."
            ),
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(
        jwt_header,
        jwt_payload,
    ):
        return jsonify({
            "success": False,
            "error": (
                "Token has been revoked."
            ),
        }), 401

    @jwt.needs_fresh_token_loader
    def fresh_token_callback(
        jwt_header,
        jwt_payload,
    ):
        return jsonify({
            "success": False,
            "error": (
                "A fresh login token "
                "is required."
            ),
        }), 401

    # =====================================================
    # IMPORT BLUEPRINTS
    # =====================================================

    from app.routes.auth import (
        auth_bp,
    )

    from app.routes.artworks import (
        artworks_bp,
    )

    from app.routes.dashboard import (
        dashboard_bp,
    )

    from app.routes.users import (
        users_bp,
    )

    from app.routes.exhibitions import (
        exhibitions_bp,
    )

    from app.routes.orders import (
        orders_bp,
    )

    from app.routes.reviews import (
        reviews_bp,
    )

    from app.routes.notifications import (
        notifications_bp,
    )

    # =====================================================
    # REGISTER BLUEPRINTS
    # =====================================================

    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth",
    )

    app.register_blueprint(
        artworks_bp,
        url_prefix="/api/artworks",
    )

    app.register_blueprint(
        dashboard_bp,
        url_prefix="/api/dashboard",
    )

    app.register_blueprint(
        users_bp,
        url_prefix="/api/users",
    )

    app.register_blueprint(
        exhibitions_bp,
        url_prefix="/api/exhibitions",
    )

    app.register_blueprint(
        orders_bp,
        url_prefix="/api/orders",
    )

    app.register_blueprint(
        reviews_bp,
        url_prefix="/api/reviews",
    )

    app.register_blueprint(
        notifications_bp,
        url_prefix="/api/notifications",
    )

    # =====================================================
    # HEALTH CHECK
    # =====================================================

    @app.get("/api/health")
    def health_check():
        return jsonify({
            "success": True,
            "status": "success",
            "message": (
                "ArtVault backend "
                "is running."
            ),
        }), 200

    # =====================================================
    # ERROR HANDLERS
    # =====================================================

    @app.errorhandler(404)
    def not_found(error):
        if request.path.startswith(
            "/api/"
        ):
            return jsonify({
                "success": False,
                "error": (
                    "API endpoint "
                    "not found."
                ),
                "path": request.path,
            }), 404

        return jsonify({
            "success": False,
            "error": "Page not found.",
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "error": (
                "This HTTP method is "
                "not allowed for the "
                "requested endpoint."
            ),
        }), 405

    @app.errorhandler(413)
    def file_too_large(error):
        return jsonify({
            "success": False,
            "error": (
                "The uploaded file is "
                "too large. Maximum "
                "size is 5 MB."
            ),
        }), 413

    @app.errorhandler(500)
    def internal_server_error(error):
        db.session.rollback()

        app.logger.exception(
            "Unhandled backend error: %s",
            error,
        )

        return jsonify({
            "success": False,
            "error": (
                "An internal server "
                "error occurred."
            ),
        }), 500

    # Ensure the SQLAlchemy session is cleaned up
    # after every application context.
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db.session.remove()

    return app