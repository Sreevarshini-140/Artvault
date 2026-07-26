from app import create_app, db
from app.models import Review


app = create_app()


with app.app_context():
    Review.__table__.create(
        bind=db.engine,
        checkfirst=True,
    )

    print(
        "Reviews table is ready."
    )