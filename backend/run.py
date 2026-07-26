import os

from app import create_app


app = create_app()


if __name__ == "__main__":
    debug_enabled = (
        os.getenv(
            "FLASK_DEBUG",
            "0",
        ).strip().lower()
        in {
            "1",
            "true",
            "yes",
            "on",
        }
    )

    host = os.getenv(
        "HOST",
        "127.0.0.1",
    )

    port = int(
        os.getenv(
            "PORT",
            "5000",
        )
    )

    app.run(
        debug=debug_enabled,
        host=host,
        port=port,
    )