import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  LoaderCircle,
  Pencil,
  ShoppingBag,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";

import api from "../services/api";
import { addToCart } from "../services/cart";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../utils/imageUrl";

import ArtworkCard from "../components/ArtworkCard";

import "../styles/ArtworkDetail.css";


const EMPTY_REVIEW_FORM = {
  rating: 0,
  comment: "",
};


function getArtworkCollection(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.artworks)) {
    return data.artworks;
  }

  return [];
}


function getReviewsPayload(data) {
  return {
    reviews: Array.isArray(data?.reviews)
      ? data.reviews
      : [],

    averageRating: Number(
      data?.average_rating ?? 0
    ),

    reviewCount: Number(
      data?.review_count ?? 0
    ),
  };
}


function formatDate(dateValue) {
  if (!dateValue) {
    return "Recently";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}


function RatingStars({
  value = 0,
  interactive = false,
  onChange,
  size = 20,
}) {
  return (
    <div
      className={[
        "rating-stars",
        interactive
          ? "rating-stars-interactive"
          : "",
      ].join(" ")}
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map(
        (starValue) => {
          const active =
            starValue <= Number(value);

          if (interactive) {
            return (
              <button
                key={starValue}
                type="button"
                className={[
                  "rating-star-button",
                  active
                    ? "is-active"
                    : "",
                ].join(" ")}
                onClick={() =>
                  onChange?.(starValue)
                }
                aria-label={`Select ${starValue} star${
                  starValue > 1
                    ? "s"
                    : ""
                }`}
              >
                <Star
                  size={size}
                  strokeWidth={1.8}
                  fill={
                    active
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
            );
          }

          return (
            <Star
              key={starValue}
              size={size}
              strokeWidth={1.8}
              className={
                active
                  ? "rating-star is-active"
                  : "rating-star"
              }
              fill={
                active
                  ? "currentColor"
                  : "none"
              }
            />
          );
        }
      )}
    </div>
  );
}


export default function ArtworkDetail() {
  const { id } = useParams();

  const navigate = useNavigate();

  const { user } = useAuth();


  const [artwork, setArtwork] =
    useState(null);

  const [
    similarArtworks,
    setSimilarArtworks,
  ] = useState([]);

  const [reviews, setReviews] =
    useState([]);

  const [
    averageRating,
    setAverageRating,
  ] = useState(0);

  const [
    reviewCount,
    setReviewCount,
  ] = useState(0);


  const [loading, setLoading] =
    useState(true);

  const [
    reviewsLoading,
    setReviewsLoading,
  ] = useState(true);

  const [
    reviewSubmitting,
    setReviewSubmitting,
  ] = useState(false);

  const [
    deletingReviewId,
    setDeletingReviewId,
  ] = useState(null);


  const [message, setMessage] =
    useState("");

  const [
    reviewMessage,
    setReviewMessage,
  ] = useState("");

  const [
    reviewError,
    setReviewError,
  ] = useState("");


  const [
    reviewForm,
    setReviewForm,
  ] = useState(EMPTY_REVIEW_FORM);

  const [
    editingReviewId,
    setEditingReviewId,
  ] = useState(null);


  const currentUserReview =
    useMemo(() => {
      if (!user?.id) {
        return null;
      }

      return (
        reviews.find(
          (review) =>
            Number(review.user_id) ===
            Number(user.id)
        ) || null
      );
    }, [reviews, user?.id]);


  const loadReviews =
    useCallback(async () => {
      try {
        setReviewsLoading(true);
        setReviewError("");

        const response =
          await api.get(
            `/reviews/artworks/${id}`
          );

        const payload =
          getReviewsPayload(
            response.data
          );

        setReviews(payload.reviews);

        setAverageRating(
          payload.averageRating
        );

        setReviewCount(
          payload.reviewCount
        );

        setArtwork((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            average_rating:
              payload.averageRating,
            review_count:
              payload.reviewCount,
          };
        });
      } catch (error) {
        console.error(
          "Reviews loading failed",
          error
        );

        setReviewError(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to load reviews."
        );
      } finally {
        setReviewsLoading(false);
      }
    }, [id]);


  useEffect(() => {
    const loadArtwork = async () => {
      try {
        setLoading(true);
        setMessage("");

        const artworkResponse =
          await api.get(
            `/artworks/${id}`
          );

        const currentArtwork =
          artworkResponse.data;

        setArtwork(currentArtwork);

        const allResponse =
          await api.get("/artworks");

        const artworks =
          getArtworkCollection(
            allResponse.data
          );

        const similar =
          artworks
            .filter((item) => {
              const isDifferentArtwork =
                Number(item.id) !==
                Number(currentArtwork.id);

              const sameCategory =
                item.category &&
                currentArtwork.category &&
                item.category ===
                  currentArtwork.category;

              const sameArtist =
                item.artist?.id &&
                currentArtwork.artist?.id &&
                Number(item.artist.id) ===
                  Number(
                    currentArtwork.artist.id
                  );

              return (
                isDifferentArtwork &&
                (sameCategory ||
                  sameArtist)
              );
            })
            .slice(0, 3);

        setSimilarArtworks(similar);
      } catch (error) {
        console.error(
          "Artwork loading failed",
          error
        );

        setMessage(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to load artwork."
        );

        setArtwork(null);
      } finally {
        setLoading(false);
      }
    };

    loadArtwork();
  }, [id]);


  useEffect(() => {
    loadReviews();
  }, [loadReviews]);


  const acquire = () => {
    addToCart({
      id: artwork.id,
      title: artwork.title,
      price: artwork.price,
      product_type: "canvas",
      image_url: artwork.image_url,
    });

    setMessage(
      "Artwork added to cart."
    );
  };


  const save = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setMessage("");

      await api.post(
        `/users/wishlist/${artwork.id}`
      );

      setMessage(
        "Artwork saved to wishlist."
      );
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Unable to save this artwork."
      );
    }
  };


  const handleReviewFieldChange =
    (event) => {
      const { name, value } =
        event.target;

      setReviewForm((current) => ({
        ...current,
        [name]: value,
      }));
    };


  const handleRatingChange =
    (rating) => {
      setReviewForm((current) => ({
        ...current,
        rating,
      }));

      setReviewError("");
    };


  const resetReviewForm = () => {
    setReviewForm(
      EMPTY_REVIEW_FORM
    );

    setEditingReviewId(null);
    setReviewError("");
  };


  const startEditingReview =
    (review) => {
      setEditingReviewId(review.id);

      setReviewForm({
        rating:
          Number(review.rating) || 0,

        comment:
          review.comment || "",
      });

      setReviewMessage("");
      setReviewError("");

      window.requestAnimationFrame(
        () => {
          document
            .getElementById(
              "review-form"
            )
            ?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
        }
      );
    };


  const submitReview = async (
    event
  ) => {
    event.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    const rating =
      Number(reviewForm.rating);

    const comment =
      reviewForm.comment.trim();

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      setReviewError(
        "Please select a rating from 1 to 5 stars."
      );

      return;
    }

    if (!comment) {
      setReviewError(
        "Please write a short review."
      );

      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError("");
      setReviewMessage("");

      if (editingReviewId) {
        await api.put(
          `/reviews/${editingReviewId}`,
          {
            rating,
            comment,
          }
        );

        setReviewMessage(
          "Your review was updated successfully."
        );
      } else {
        await api.post("/reviews", {
          artwork_id:
            Number(artwork.id),

          rating,

          comment,
        });

        setReviewMessage(
          "Your review was added successfully."
        );
      }

      resetReviewForm();

      await loadReviews();
    } catch (error) {
      console.error(
        "Review submission failed",
        error
      );

      setReviewError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Unable to save your review."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };


  const deleteReview = async (
    review
  ) => {
    const confirmed =
      window.confirm(
        "Delete this review permanently?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingReviewId(
        review.id
      );

      setReviewError("");
      setReviewMessage("");

      await api.delete(
        `/reviews/${review.id}`
      );

      if (
        Number(editingReviewId) ===
        Number(review.id)
      ) {
        resetReviewForm();
      }

      setReviewMessage(
        "Your review was deleted successfully."
      );

      await loadReviews();
    } catch (error) {
      console.error(
        "Review deletion failed",
        error
      );

      setReviewError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Unable to delete the review."
      );
    } finally {
      setDeletingReviewId(null);
    }
  };


  if (loading) {
    return (
      <main className="detail-page">
        <section className="detail-state">
          <LoaderCircle
            className="detail-spinner"
            size={30}
          />

          <p>Loading artwork...</p>
        </section>
      </main>
    );
  }


  if (!artwork) {
    return (
      <main className="detail-page">
        <section className="detail-state detail-state-error">
          <h1>
            Artwork unavailable
          </h1>

          <p>
            {message ||
              "The requested artwork could not be found."}
          </p>

          <button
            type="button"
            className="detail-primary-button"
            onClick={() =>
              navigate("/explore")
            }
          >
            Return to Explore
          </button>
        </section>
      </main>
    );
  }


  return (
    <main className="detail-page">
      <section className="detail-container">
        <div className="detail-gallery">
          <div className="detail-image-frame">
            <div className="detail-image-box">
              <img
                className="detail-art-image"
                src={getImageUrl(
                  artwork.image_url
                )}
                alt={artwork.title}
              />
            </div>
          </div>
        </div>


        <div className="detail-info">
          <p className="detail-eyebrow">
            {artwork.category ||
              "ORIGINAL ARTWORK"}
          </p>

          <h1 className="detail-title">
            {artwork.title}
          </h1>


          {artwork.artist && (
            <button
              type="button"
              className="detail-artist-link"
              onClick={() =>
                navigate(
                  `/artists/${artwork.artist.id}`
                )
              }
            >
              By {artwork.artist.name}
            </button>
          )}


          <div className="detail-rating-line">
            <RatingStars
              value={Math.round(
                averageRating
              )}
              size={19}
            />

            <strong>
              {averageRating.toFixed(1)}
            </strong>

            <span>
              {reviewCount}{" "}
              {reviewCount === 1
                ? "review"
                : "reviews"}
            </span>
          </div>


          <p className="detail-description">
            {artwork.description ||
              "No description available."}
          </p>


          <div className="detail-meta">
            <div>
              <span>Medium</span>

              <strong>
                {artwork.medium ||
                  "Not specified"}
              </strong>
            </div>

            <div>
              <span>Year</span>

              <strong>
                {artwork.year || "2026"}
              </strong>
            </div>

            <div>
              <span>Views</span>

              <strong>
                {artwork.views || 0}
              </strong>
            </div>
          </div>


          <div className="detail-price">
            ₹
            {Number(
              artwork.price || 0
            ).toLocaleString("en-IN")}
          </div>


          {artwork.status?.toLowerCase() === "sold" ? (
            <div className="detail-collected-panel">
              <div>
                <span className="detail-collected-label">
                  Collected
                </span>

                <p>
                  This original artwork has found
                  its collector.
                </p>
              </div>

              <button
                type="button"
                className="detail-primary-button"
                onClick={() => navigate("/collected")}
              >
                View Collected Works
              </button>
            </div>
          ) : (
            <div className="detail-actions">
              <button
                type="button"
                className="detail-primary-button"
                onClick={acquire}
              >
                <ShoppingBag size={18} />

                Acquire Artwork
              </button>

              <button
                type="button"
                className="detail-secondary-button"
                onClick={save}
              >
                ♡ Wishlist
              </button>
            </div>
          )}


          {message && (
            <p className="detail-message">
              {message}
            </p>
          )}
        </div>
      </section>


      <section className="reviews-section">
        <div className="reviews-heading">
          <div>
            <p className="detail-eyebrow">
              Collector Feedback
            </p>

            <h2>
              Reviews and ratings
            </h2>

            <p>
              Read what the ArtVault
              community thinks about this
              artwork.
            </p>
          </div>


          <div className="reviews-summary">
            <strong>
              {averageRating.toFixed(1)}
            </strong>

            <RatingStars
              value={Math.round(
                averageRating
              )}
              size={18}
            />

            <span>
              Based on {reviewCount}{" "}
              {reviewCount === 1
                ? "review"
                : "reviews"}
            </span>
          </div>
        </div>


        <div className="reviews-layout">
          <div className="reviews-list-panel">
            {reviewsLoading ? (
              <div className="reviews-empty-state">
                <LoaderCircle
                  className="detail-spinner"
                  size={24}
                />

                <p>
                  Loading reviews...
                </p>
              </div>
            ) : reviewError &&
              reviews.length === 0 ? (
              <div className="reviews-empty-state">
                <p>{reviewError}</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="reviews-empty-state">
                <Star size={30} />

                <h3>
                  No reviews yet
                </h3>

                <p>
                  Be the first person to
                  share an opinion about
                  this artwork.
                </p>
              </div>
            ) : (
              reviews.map((review) => {
                const isOwner =
                  Number(
                    review.user_id
                  ) === Number(user?.id);

                const isDeleting =
                  Number(
                    deletingReviewId
                  ) === Number(review.id);

                return (
                  <article
                    className="review-card"
                    key={review.id}
                  >
                    <div className="review-card-top">
                      <div className="review-author">
                        <span className="review-avatar">
                          <UserRound
                            size={18}
                          />
                        </span>

                        <div>
                          <h3>
                            {review.user
                              ?.name ||
                              "ArtVault member"}
                          </h3>

                          <time>
                            {formatDate(
                              review.updated_at ||
                                review.created_at
                            )}
                          </time>
                        </div>
                      </div>

                      <RatingStars
                        value={
                          review.rating
                        }
                        size={17}
                      />
                    </div>

                    <p className="review-comment">
                      {review.comment}
                    </p>

                    {isOwner && (
                      <div className="review-actions">
                        <button
                          type="button"
                          onClick={() =>
                            startEditingReview(
                              review
                            )
                          }
                          disabled={
                            isDeleting
                          }
                        >
                          <Pencil
                            size={15}
                          />

                          Edit
                        </button>

                        <button
                          type="button"
                          className="review-delete-button"
                          onClick={() =>
                            deleteReview(
                              review
                            )
                          }
                          disabled={
                            isDeleting
                          }
                        >
                          {isDeleting ? (
                            <LoaderCircle
                              className="detail-spinner"
                              size={15}
                            />
                          ) : (
                            <Trash2
                              size={15}
                            />
                          )}

                          {isDeleting
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>


          <aside
            className="review-form-panel"
            id="review-form"
          >
            <p className="detail-eyebrow">
              {editingReviewId
                ? "Edit Feedback"
                : "Share Feedback"}
            </p>

            <h2>
              {editingReviewId
                ? "Update your review"
                : "Rate this artwork"}
            </h2>


            {!user ? (
              <div className="review-login-state">
                <p>
                  Log in to leave a rating
                  and review.
                </p>

                <button
                  type="button"
                  className="detail-primary-button"
                  onClick={() =>
                    navigate("/login")
                  }
                >
                  Log in to review
                </button>
              </div>
            ) : currentUserReview &&
              !editingReviewId ? (
              <div className="review-existing-state">
                <div>
                  <RatingStars
                    value={
                      currentUserReview.rating
                    }
                    size={20}
                  />

                  <p>
                    You have already
                    reviewed this artwork.
                    You can edit or delete
                    your review.
                  </p>
                </div>

                <button
                  type="button"
                  className="detail-primary-button"
                  onClick={() =>
                    startEditingReview(
                      currentUserReview
                    )
                  }
                >
                  <Pencil size={17} />

                  Edit my review
                </button>
              </div>
            ) : (
              <form
                className="review-form"
                onSubmit={submitReview}
              >
                <div className="review-field">
                  <label>
                    Your rating
                  </label>

                  <RatingStars
                    value={
                      reviewForm.rating
                    }
                    interactive
                    size={28}
                    onChange={
                      handleRatingChange
                    }
                  />

                  <small>
                    Select between 1 and 5
                    stars.
                  </small>
                </div>


                <div className="review-field">
                  <label
                    htmlFor="review-comment"
                  >
                    Your review
                  </label>

                  <textarea
                    id="review-comment"
                    name="comment"
                    value={
                      reviewForm.comment
                    }
                    onChange={
                      handleReviewFieldChange
                    }
                    rows={6}
                    maxLength={1000}
                    placeholder="Share your thoughts about this artwork..."
                  />

                  <small className="review-character-count">
                    {
                      reviewForm.comment
                        .length
                    }
                    /1000
                  </small>
                </div>


                {reviewError && (
                  <p className="review-feedback review-feedback-error">
                    {reviewError}
                  </p>
                )}


                <div className="review-form-actions">
                  <button
                    type="submit"
                    className="detail-primary-button"
                    disabled={
                      reviewSubmitting
                    }
                  >
                    {reviewSubmitting && (
                      <LoaderCircle
                        className="detail-spinner"
                        size={17}
                      />
                    )}

                    {reviewSubmitting
                      ? "Saving..."
                      : editingReviewId
                      ? "Update review"
                      : "Submit review"}
                  </button>


                  {editingReviewId && (
                    <button
                      type="button"
                      className="detail-secondary-button"
                      onClick={
                        resetReviewForm
                      }
                      disabled={
                        reviewSubmitting
                      }
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}


            {reviewMessage && (
              <p className="review-feedback review-feedback-success">
                {reviewMessage}
              </p>
            )}


            {reviewError &&
              (currentUserReview ||
                !user) && (
                <p className="review-feedback review-feedback-error">
                  {reviewError}
                </p>
              )}
          </aside>
        </div>
      </section>


      {similarArtworks.length > 0 && (
        <section className="similar-section">
          <p className="detail-eyebrow">
            Explore More
          </p>

          <h2>
            You may also like
          </h2>

          <div className="art-grid">
            {similarArtworks.map(
              (art) => (
                <ArtworkCard
                  key={art.id}
                  art={art}
                />
              )
            )}
          </div>
        </section>
      )}
    </main>
  );
}