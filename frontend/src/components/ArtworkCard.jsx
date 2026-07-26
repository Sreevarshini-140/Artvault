import {
  useEffect,
  useState,
} from "react";

import {
  Eye,
  Heart,
  ImageOff,
  ShoppingBag,
  Star,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

import {
  getImageUrl,
} from "../utils/imageUrl";

import "../styles/ArtworkCard.css";

export default function ArtworkCard({
  art,
  onWishlistChange,
  onMoveToCart,
}) {
  const navigate = useNavigate();

  const [isSaved, setIsSaved] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [movingToCart, setMovingToCart] =
    useState(false);

  const [imageFailed, setImageFailed] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    setIsSaved(
      Boolean(
        art?.is_wishlisted ||
          art?.in_wishlist ||
          art?.is_saved
      )
    );

    setImageFailed(false);
    setMessage("");
  }, [
    art?.id,
    art?.image_url,
    art?.image,
    art?.thumbnail_url,
    art?.cover_image,
    art?.is_wishlisted,
    art?.in_wishlist,
    art?.is_saved,
  ]);

  if (!art) {
    return null;
  }

  const artworkPath =
    `/artworks/${art.id}`;

  const rawImage =
    art.image_url ||
    art.image ||
    art.thumbnail_url ||
    art.cover_image ||
    art.images?.[0]?.image_url ||
    art.images?.[0]?.url ||
    "";

  const imageUrl = rawImage
    ? getImageUrl(rawImage)
    : "";

  const artistName =
    art.artist?.name ||
    art.artist?.full_name ||
    art.artist_name ||
    art.user?.name ||
    art.creator_name ||
    "ArtVault Artist";

  const numericPrice = Number(
    art.price ?? 0
  );

  const formattedPrice =
    Number.isFinite(numericPrice)
      ? numericPrice.toLocaleString(
          "en-IN"
        )
      : "0";

  const numericRating = Number(
    art.average_rating ??
      art.rating ??
      0
  );

  const formattedRating =
    Number.isFinite(
      numericRating
    ) && numericRating > 0
      ? numericRating.toFixed(1)
      : "New";

  const reviewCount = Number(
    art.review_count ??
      art.reviews_count ??
      art.total_reviews ??
      0
  );

  const category =
    art.category ||
    art.art_category ||
    art.medium ||
    "Original Art";

  const description =
    art.description ||
    art.short_description ||
    "Discover an original artwork created with care, imagination and artistic expression.";

  const badge =
    art.badge ||
    (art.is_featured
      ? "Featured"
      : art.is_popular
        ? "Popular"
        : art.is_new
          ? "New"
          : "");

  const openArtwork = () => {
    navigate(artworkPath);
  };

  const stopCardNavigation = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleCardKeyDown = (
    event
  ) => {
    if (
      event.target.closest(
        "button"
      )
    ) {
      return;
    }

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      openArtwork();
    }
  };

  const handleQuickView = (
    event
  ) => {
    stopCardNavigation(event);
    openArtwork();
  };

  const handleCart =
    async (event) => {
      stopCardNavigation(event);

      /*
       * When onMoveToCart is provided,
       * this card is being used on the
       * Wishlist page.
       */
      if (onMoveToCart) {
        if (movingToCart) {
          return;
        }

        try {
          setMovingToCart(true);
          setMessage("");

          await onMoveToCart(art);

          /*
           * The parent removes this card
           * after success, so this message
           * may appear only briefly.
           */
          setMessage(
            "Moved to cart"
          );
        } catch (moveError) {
          console.error(
            "Move to cart failed:",
            moveError
          );

          const errorMessage =
            moveError.response?.data
              ?.error ||
            moveError.response?.data
              ?.message ||
            moveError.response?.data
              ?.msg ||
            moveError.message ||
            "Failed to move artwork to cart.";

          window.alert(
            errorMessage
          );
        } finally {
          setMovingToCart(false);
        }

        return;
      }

      /*
       * Outside Wishlist, keep the
       * original behavior.
       */
      navigate(artworkPath, {
        state: {
          action: "add-to-cart",
        },
      });
    };

  const handleWishlist =
    async (event) => {
      stopCardNavigation(event);

      if (saving) {
        return;
      }

      const token =
        localStorage.getItem(
          "artvault_access_token"
        ) ||
        localStorage.getItem(
          "artvault_token"
        );

      if (!token) {
        navigate("/login", {
          state: {
            from: artworkPath,
          },
        });

        return;
      }

      const previousSavedState =
        isSaved;

      const nextSavedState =
        !previousSavedState;

      try {
        setSaving(true);
        setMessage("");

        setIsSaved(
          nextSavedState
        );

        if (previousSavedState) {
          await api.delete(
            `/users/wishlist/${art.id}`
          );

          setMessage(
            "Removed from wishlist"
          );
        } else {
          await api.post(
            `/users/wishlist/${art.id}`
          );

          setMessage(
            "Added to wishlist"
          );
        }

        onWishlistChange?.({
          artworkId: art.id,
          isSaved:
            nextSavedState,
          artwork: art,
        });
      } catch (requestError) {
        setIsSaved(
          previousSavedState
        );

        console.error(
          "Wishlist request failed:",
          requestError
        );

        const errorMessage =
          requestError.response?.data
            ?.error ||
          requestError.response?.data
            ?.message ||
          requestError.response?.data
            ?.msg ||
          requestError.message ||
          "Failed to update wishlist.";

        window.alert(
          errorMessage
        );
      } finally {
        setSaving(false);

        window.setTimeout(() => {
          setMessage("");
        }, 1800);
      }
    };

  const handleImageError = (
    event
  ) => {
    console.error(
      "Artwork image failed:",
      event.currentTarget.src
    );

    setImageFailed(true);
  };

  return (
    <article
      className="artvault-card"
      role="link"
      tabIndex={0}
      aria-label={`View ${
        art.title ||
        "artwork"
      }`}
      onClick={openArtwork}
      onKeyDown={
        handleCardKeyDown
      }
    >
      <div className="artvault-card-link">
        <div className="artvault-card-image-wrap">
          {!imageFailed &&
          imageUrl ? (
            <img
              src={imageUrl}
              alt={
                art.title ||
                "Artwork"
              }
              className="artvault-card-image"
              loading="lazy"
              onError={
                handleImageError
              }
            />
          ) : (
            <div className="artvault-card-placeholder">
              <ImageOff
                size={38}
                aria-hidden="true"
              />

              <span>
                Image unavailable
              </span>
            </div>
          )}

          <div className="artvault-card-image-shade" />

          {badge && (
            <span className="artvault-card-badge">
              {badge}
            </span>
          )}

          <button
            className={`artvault-card-wishlist ${
              isSaved
                ? "is-saved"
                : ""
            }`}
            type="button"
            onClick={
              handleWishlist
            }
            disabled={
              saving ||
              movingToCart
            }
            aria-label={
              isSaved
                ? `Remove ${
                    art.title ||
                    "artwork"
                  } from wishlist`
                : `Save ${
                    art.title ||
                    "artwork"
                  } to wishlist`
            }
            aria-pressed={isSaved}
          >
            <Heart
              size={22}
              fill={
                isSaved
                  ? "currentColor"
                  : "none"
              }
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="artvault-card-body">
          <p className="artvault-card-category">
            {category}
          </p>

          <h3 className="artvault-card-title">
            {art.title ||
              "Untitled Artwork"}
          </h3>

          <p className="artvault-card-artist">
            <span>by</span>

            {artistName}
          </p>

          <p className="artvault-card-description">
            {description}
          </p>

          <div className="artvault-card-divider" />

          <div className="artvault-card-bottom-row">
            <strong className="artvault-card-price">
              ₹{formattedPrice}
            </strong>

            <div className="artvault-card-rating-row">
              <Star
                className="artvault-card-star"
                size={17}
                fill="currentColor"
                aria-hidden="true"
              />

              <span className="artvault-card-rating">
                {formattedRating}
              </span>

              {Number.isFinite(
                reviewCount
              ) &&
                reviewCount > 0 && (
                  <span className="artvault-card-reviews">
                    ({reviewCount})
                  </span>
                )}
            </div>
          </div>

          <div className="artvault-card-footer-actions">
            <button
              type="button"
              onClick={handleCart}
              disabled={
                movingToCart ||
                saving
              }
            >
              <ShoppingBag
                size={17}
                aria-hidden="true"
              />

              {movingToCart
                ? "Moving..."
                : onMoveToCart
                  ? "Move to Cart"
                  : "Add to Cart"}
            </button>

            <button
              type="button"
              onClick={
                handleQuickView
              }
              disabled={
                movingToCart
              }
            >
              <Eye
                size={18}
                aria-hidden="true"
              />

              Quick View
            </button>
          </div>
        </div>

        {message && (
          <div
            className="artvault-card-message"
            role="status"
          >
            {message}
          </div>
        )}
      </div>
    </article>
  );
}