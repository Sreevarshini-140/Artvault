from app import create_app, db
from app.models import User, Artwork, Exhibition

app = create_app()
with app.app_context():
    db.create_all()
    admin = User.query.filter_by(email="admin@artvault.com").first()
    if not admin:
        admin = User(name="ArtVault Admin", email="admin@artvault.com", role="admin")
        admin.set_password("Admin@123")
        artist = User(name="Elena Maris", email="artist@artvault.com", role="artist", bio="Contemporary painter exploring memory and light.")
        artist.set_password("Artist@123")
        curator = User(name="Aarav Sen", email="curator@artvault.com", role="curator")
        curator.set_password("Curator@123")
        db.session.add_all([admin, artist, curator]); db.session.flush()
        works = [
            Artwork(title="Nocturne in Gold", description="A luminous study of silence and motion.", category="Abstract", medium="Oil on canvas", year=2026, price=32000, image_url="https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1200&q=80", artist_id=artist.id),
            Artwork(title="Crimson Memory", description="Layered pigments evoke a half-remembered landscape.", category="Modern", medium="Mixed media", year=2025, price=18500, image_url="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80", artist_id=artist.id),
            Artwork(title="Quiet Geometry", description="Minimal forms balanced through warm neutral tones.", category="Minimalism", medium="Acrylic", year=2026, price=14000, image_url="https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=80", artist_id=artist.id)
        ]
        db.session.add_all(works); db.session.flush()
        ex = Exhibition(title="Digital Dreams", slug="digital-dreams", description="A curated journey through imagination, abstraction and future aesthetics.", banner_url=works[0].image_url, curator_id=curator.id, artworks=works)
        db.session.add(ex); db.session.commit()
        print("Seed data created. Admin: admin@artvault.com / Admin@123")
    else:
        print("Seed data already exists")
