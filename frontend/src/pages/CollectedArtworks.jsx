import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeCheck,
  CalendarDays,
  Gem,
  Star,
} from "lucide-react";

import { Link } from "react-router-dom";

import PageHero from "../components/PageHero";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

import "../styles/CollectedArtworks.css";


function formatCurrency(value) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(Number(value || 0));
}


function formatDate(value) {
  if (!value) {
    return "Collection date unavailable";
  }

  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}


function StarRating({ value = 0 }) {
  const rating = Number(value || 0);

  return (
    <div
      className="collected-stars"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map(
        (star) => (
          <Star
            key={star}
            size={16}
            fill={
              star <= Math.round(rating)
                ? "currentColor"
                : "none"
            }
          />
        )
      )}
    </div>
  );
}


export default function CollectedArtworks() {
  const [artworks, setArtworks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    let mounted = true;

    async function loadCollected() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/artworks/collected"
        );

        if (mounted) {
          setArtworks(
            Array.isArray(
              response.data?.items
            )
              ? response.data.items
              : []
          );
        }
      } catch (requestError) {
        console.error(
          "Collected artworks loading error:",
          requestError
        );

        if (mounted) {
          setError(
            requestError.response?.data?.error ||
              "Unable to load collected artworks."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCollected();

    return () => {
      mounted = false;
    };
  }, []);


  const totalReviews = useMemo(
    () =>
      artworks.reduce(
        (total, artwork) =>
          total +
          Number(
            artwork.review_count ||
              artwork.reviews?.length ||
              0
          ),
        0
      ),
    [artworks]
  );


  return (
    <>
      <PageHero
        eyebrow="Collector archive"
        title="Collected Artworks"
        text="A curated record of works that found their collectors, together with verified collector experiences."
      />

      <main className="collected-page">
        <section className="container">

          {!loading &&
            !error &&
            artworks.length > 0 && (
              <div className="collected-summary">
                <article>
                  <Gem size={22} />

                  <div>
                    <strong>
                      {artworks.length}
                    </strong>

                    <span>
                      Collected works
                    </span>
                  </div>
                </article>

                <article>
                  <Star size={22} />

                  <div>
                    <strong>
                      {totalReviews}
                    </strong>

                    <span>
                      Collector reviews
                    </span>
                  </div>
                </article>
              </div>
            )}


          {loading && (
            <div className="collected-state">
              <Gem size={32} />

              <h2>
                Opening the collection
              </h2>

              <p>
                Loading collected artworks...
              </p>
            </div>
          )}


          {!loading && error && (
            <div className="collected-state">
              <h2>
                Collection unavailable
              </h2>

              <p>{error}</p>
            </div>
          )}


          {!loading &&
            !error &&
            artworks.length === 0 && (
              <div className="collected-state">
                <Gem size={34} />

                <h2>
                  The collection is just beginning
                </h2>

                <p>
                  Sold artworks will appear here
                  once they find their collectors.
                </p>

                <Link
                  className="btn"
                  to="/explore"
                >
                  Explore Artworks
                </Link>
              </div>
            )}


          {!loading &&
            !error &&
            artworks.length > 0 && (
              <div className="collected-grid">

                {artworks.map((artwork) => {
                  const reviews =
                    Array.isArray(
                      artwork.reviews
                    )
                      ? artwork.reviews
                      : [];

                  return (
                    <article
                      className="collected-card"
                      key={artwork.id}
                    >
                      <Link
                        className="collected-image-wrap"
                        to={`/artworks/${artwork.id}`}
                      >
                        {artwork.image_url ? (
                          <img
                            src={getImageUrl(
                              artwork.image_url
                            )}
                            alt={
                              artwork.title ||
                              "Collected artwork"
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="collected-image-placeholder">
                            ART
                          </div>
                        )}

                        <span className="collected-badge">
                          <Gem size={15} />
                          Collected
                        </span>
                      </Link>


                      <div className="collected-content">

                        <div className="collected-heading">
                          <div>
                            <span className="collected-category">
                              {artwork.category ||
                                "Artwork"}
                            </span>

                            <h2>
                              {artwork.title ||
                                "Untitled artwork"}
                            </h2>

                            <p>
                              by{" "}
                              <strong>
                                {artwork.artist?.name ||
                                  artwork.artist_name ||
                                  "ArtVault Artist"}
                              </strong>
                            </p>
                          </div>

                          <strong className="collected-price">
                            {formatCurrency(
                              artwork.sale
                                ?.sold_price ??
                                artwork.price
                            )}
                          </strong>
                        </div>


                        <div className="collected-sale-meta">
                          <span>
                            <CalendarDays
                              size={16}
                            />

                            Collected{" "}
                            {formatDate(
                              artwork.sale
                                ?.sold_at
                            )}
                          </span>

                          <span>
                            <BadgeCheck
                              size={16}
                            />

                            Verified sale
                          </span>
                        </div>


                        <div className="collected-rating-row">
                          <StarRating
                            value={
                              artwork.average_rating
                            }
                          />

                          <strong>
                            {Number(
                              artwork.average_rating ||
                                0
                            ).toFixed(1)}
                          </strong>

                          <span>
                            {reviews.length}{" "}
                            {reviews.length === 1
                              ? "review"
                              : "reviews"}
                          </span>
                        </div>


                        <div className="collected-reviews">
                          <h3>
                            Collector Reviews
                          </h3>

                          {reviews.length > 0 ? (
                            reviews
                              .slice(0, 3)
                              .map((review) => (
                                <div
                                  className="collected-review"
                                  key={review.id}
                                >
                                  <div className="collected-review-head">
                                    <div>
                                      <strong>
                                        {review.user
                                          ?.name ||
                                          "ArtVault Collector"}
                                      </strong>

                                      <span>
                                        <BadgeCheck
                                          size={14}
                                        />
                                        Verified Collector
                                      </span>
                                    </div>

                                    <StarRating
                                      value={
                                        review.rating
                                      }
                                    />
                                  </div>

                                  {review.comment && (
                                    <p>
                                      “
                                      {
                                        review.comment
                                      }
                                      ”
                                    </p>
                                  )}
                                </div>
                              ))
                          ) : (
                            <p className="collected-no-review">
                              No collector review
                              has been added yet.
                            </p>
                          )}
                        </div>


                        <Link
                          className="collected-view-button"
                          to={`/artworks/${artwork.id}`}
                        >
                          View Artwork
                        </Link>

                      </div>
                    </article>
                  );
                })}
              </div>
            )}

        </section>
      </main>
    </>
  );
}
