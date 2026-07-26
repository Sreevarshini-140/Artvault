from datetime import datetime

from werkzeug.security import (
    check_password_hash,
    generate_password_hash,
)

from app import db


class TimestampMixin:
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    name = db.Column(
        db.String(120),
        nullable=False,
    )

    email = db.Column(
        db.String(180),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False,
    )

    role = db.Column(
        db.Enum(
            "visitor",
            "artist",
            "curator",
            "admin",
        ),
        default="visitor",
        nullable=False,
    )

    # Secondary administrator permission.
    # This allows an account to remain an artist while also
    # receiving access to administrator features.
    is_admin = db.Column(
        db.Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    bio = db.Column(
        db.Text,
    )

    avatar_url = db.Column(
        db.String(500),
    )

    is_verified = db.Column(
        db.Boolean,
        default=True,
        nullable=False,
    )

    is_active = db.Column(
        db.Boolean,
        default=True,
        nullable=False,
    )

    artworks = db.relationship(
        "Artwork",
        back_populates="artist",
        lazy=True,
        foreign_keys="Artwork.artist_id",
    )

    reviews = db.relationship(
        "Review",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy=True,
    )

    curated_exhibitions = db.relationship(
        "Exhibition",
        back_populates="curator",
        foreign_keys="Exhibition.curator_id",
        lazy=True,
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(
            password
        )

    def check_password(self, password):
        return check_password_hash(
            self.password_hash,
            password,
        )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "is_admin": bool(
                self.is_admin
            ),
            "bio": self.bio,
            "avatar_url": self.avatar_url,
            "is_verified": self.is_verified,
            "is_active": self.is_active,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }


exhibition_artworks = db.Table(
    "exhibition_artworks",
    db.Column(
        "exhibition_id",
        db.Integer,
        db.ForeignKey(
            "exhibitions.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    ),
    db.Column(
        "artwork_id",
        db.Integer,
        db.ForeignKey(
            "artworks.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    ),
)


class Artwork(TimestampMixin, db.Model):
    __tablename__ = "artworks"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    title = db.Column(
        db.String(180),
        nullable=False,
        index=True,
    )

    description = db.Column(
        db.Text,
    )

    category = db.Column(
        db.String(100),
        index=True,
    )

    medium = db.Column(
        db.String(100),
    )

    year = db.Column(
        db.Integer,
    )

    price = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=0,
    )

    image_url = db.Column(
        db.String(500),
        nullable=False,
    )

    status = db.Column(
        db.Enum(
            "draft",
            "published",
            "sold",
            "archived",
        ),
        default="published",
        nullable=False,
    )

    views = db.Column(
        db.Integer,
        default=0,
        nullable=False,
    )

    artist_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    artist = db.relationship(
        "User",
        back_populates="artworks",
        foreign_keys=[artist_id],
    )

    reviews = db.relationship(
        "Review",
        back_populates="artwork",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy=True,
    )

    exhibitions = db.relationship(
        "Exhibition",
        secondary=exhibition_artworks,
        back_populates="artworks",
        lazy="select",
    )

    @property
    def average_rating(self):
        ratings = [
            review.rating
            for review in self.reviews
            if review.rating is not None
        ]

        if not ratings:
            return 0.0

        return round(
            sum(ratings) / len(ratings),
            1,
        )

    @property
    def review_count(self):
        return len(self.reviews)

    def get_average_rating(self):
        return self.average_rating

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "medium": self.medium,
            "year": self.year,
            "price": float(self.price),
            "image_url": self.image_url,
            "status": self.status,
            "views": self.views,
            "artist_id": self.artist_id,
            "artist": (
                self.artist.to_dict()
                if self.artist
                else None
            ),
            "rating": self.average_rating,
            "average_rating": self.average_rating,
            "review_count": self.review_count,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            ),
        }


class Exhibition(
    TimestampMixin,
    db.Model,
):
    __tablename__ = "exhibitions"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    title = db.Column(
        db.String(180),
        nullable=False,
        index=True,
    )

    slug = db.Column(
        db.String(180),
        unique=True,
        nullable=False,
        index=True,
    )

    description = db.Column(
        db.Text,
    )

    banner_url = db.Column(
        db.String(500),
    )

    starts_at = db.Column(
        db.DateTime,
        nullable=False,
    )

    ends_at = db.Column(
        db.DateTime,
        nullable=False,
    )

    status = db.Column(
        db.Enum(
            "draft",
            "published",
            "archived",
        ),
        default="draft",
        nullable=False,
        index=True,
    )

    is_featured = db.Column(
        db.Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    views = db.Column(
        db.Integer,
        default=0,
        nullable=False,
    )

    likes = db.Column(
        db.Integer,
        default=0,
        nullable=False,
    )

    curator_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    curator = db.relationship(
        "User",
        back_populates="curated_exhibitions",
        foreign_keys=[curator_id],
    )

    artworks = db.relationship(
        "Artwork",
        secondary=exhibition_artworks,
        back_populates="exhibitions",
        lazy="select",
    )

    @property
    def artwork_count(self):
        return len(self.artworks)

    @property
    def artist_count(self):
        artist_ids = {
            artwork.artist_id
            for artwork in self.artworks
            if artwork.artist_id is not None
        }

        return len(artist_ids)

    @property
    def participating_artists(self):
        artists = {}

        for artwork in self.artworks:
            if artwork.artist:
                artists[artwork.artist.id] = (
                    artwork.artist
                )

        return list(artists.values())

    @property
    def lifecycle_status(self):
        now = datetime.utcnow()

        if self.status == "draft":
            return "draft"

        if self.status == "archived":
            return "archived"

        if self.starts_at and now < self.starts_at:
            return "upcoming"

        if (
            self.starts_at
            and self.ends_at
            and self.starts_at <= now <= self.ends_at
        ):
            return "live"

        if self.ends_at and now > self.ends_at:
            return "closed"

        return self.status

    def to_summary_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "description": self.description,
            "banner_url": self.banner_url,
            "starts_at": (
                self.starts_at.isoformat()
                if self.starts_at
                else None
            ),
            "ends_at": (
                self.ends_at.isoformat()
                if self.ends_at
                else None
            ),
            "status": self.status,
            "lifecycle_status": (
                self.lifecycle_status
            ),
            "is_featured": self.is_featured,
            "views": self.views,
            "likes": self.likes,
            "artwork_count": self.artwork_count,
            "artist_count": self.artist_count,
            "curator": (
                self.curator.to_dict()
                if self.curator
                else None
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            ),
        }

    def to_dict(self):
        data = self.to_summary_dict()

        data.update(
            {
                "artworks": [
                    artwork.to_dict()
                    for artwork in self.artworks
                ],
                "participating_artists": [
                    artist.to_dict()
                    for artist
                    in self.participating_artists
                ],
            }
        )

        return data


class Wishlist(
    TimestampMixin,
    db.Model,
):
    __tablename__ = "wishlists"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
    )

    artwork_id = db.Column(
        db.Integer,
        db.ForeignKey("artworks.id"),
        nullable=False,
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "artwork_id",
            name="uq_wishlist",
        ),
    )

    artwork = db.relationship(
        "Artwork",
    )


class Follow(
    TimestampMixin,
    db.Model,
):
    __tablename__ = "follows"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    follower_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
    )

    artist_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
    )

    __table_args__ = (
        db.UniqueConstraint(
            "follower_id",
            "artist_id",
            name="uq_follow",
        ),
    )


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    artwork_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "artworks.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    rating = db.Column(
        db.Integer,
        nullable=False,
    )

    comment = db.Column(
        db.Text,
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    user = db.relationship(
        "User",
        back_populates="reviews",
    )

    artwork = db.relationship(
        "Artwork",
        back_populates="reviews",
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "artwork_id",
            name="uq_review_user_artwork",
        ),
        db.CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="ck_review_rating_range",
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "artwork_id": self.artwork_id,
            "rating": self.rating,
            "comment": self.comment or "",
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            ),
            "user": {
                "id": self.user.id,
                "name": self.user.name,
            }
            if self.user
            else None,
        }


class Order(
    TimestampMixin,
    db.Model,
):
    __tablename__ = "orders"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
    )

    status = db.Column(
        db.Enum(
            "pending",
            "paid",
            "shipped",
            "delivered",
            "cancelled",
        ),
        default="pending",
        nullable=False,
    )

    total_amount = db.Column(
        db.Numeric(12, 2),
        nullable=False,
    )

    shipping_address = db.Column(
        db.Text,
        nullable=False,
    )

    user = db.relationship(
        "User",
    )

    items = db.relationship(
        "OrderItem",
        backref="order",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status,
            "total_amount": float(
                self.total_amount
            ),
            "shipping_address": (
                self.shipping_address
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "items": [
                item.to_dict()
                for item in self.items
            ],
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id"),
        nullable=False,
    )

    artwork_id = db.Column(
        db.Integer,
        db.ForeignKey("artworks.id"),
        nullable=False,
    )

    product_type = db.Column(
        db.Enum(
            "digital",
            "canvas",
            "print",
            "frame",
            "poster",
            "merchandise",
        ),
        nullable=False,
        default="canvas",
    )

    quantity = db.Column(
        db.Integer,
        default=1,
        nullable=False,
    )

    unit_price = db.Column(
        db.Numeric(12, 2),
        nullable=False,
    )

    artwork = db.relationship(
        "Artwork",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "product_type": self.product_type,
            "quantity": self.quantity,
            "unit_price": float(
                self.unit_price
            ),
            "artwork": (
                self.artwork.to_dict()
                if self.artwork
                else None
            ),
        }


class Notification(
    TimestampMixin,
    db.Model,
):
    __tablename__ = "notifications"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
    )

    title = db.Column(
        db.String(180),
        nullable=False,
    )

    message = db.Column(
        db.Text,
        nullable=False,
    )

    is_read = db.Column(
        db.Boolean,
        default=False,
        nullable=False,
    )


class Coupon(
    TimestampMixin,
    db.Model,
):
    __tablename__ = "coupons"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    code = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
    )

    discount_percent = db.Column(
        db.Integer,
        nullable=False,
    )

    is_active = db.Column(
        db.Boolean,
        default=True,
        nullable=False,
    )