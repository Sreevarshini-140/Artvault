import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import PageHero from "../components/PageHero";
import api from "../services/api";

const BACKEND_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000/api"
).replace(/\/api\/?$/, "");

function getImageUrl(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  return `${BACKEND_URL}${
    imageUrl.startsWith("/") ? "" : "/"
  }${imageUrl}`;
}

function formatPrice(price) {
  const numericPrice = Number(price || 0);

  return `₹${numericPrice.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case "published":
      return "success";

    case "sold":
      return "success";

    case "draft":
      return "warning";

    case "archived":
      return "muted";

    default:
      return "warning";
  }
}

function getArtworkRating(artwork) {
  return (
    artwork.average_rating ??
    artwork.avg_rating ??
    artwork.rating ??
    0
  );
}

function getWishlistCount(artwork) {
  return (
    artwork.wishlist_count ??
    artwork.wishlists_count ??
    artwork.wishlist_adds ??
    0
  );
}

export default function MyArtworks() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] =
    useState(null);

  const loadArtworks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/artworks/mine"
      );

      const returnedWorks =
        response.data?.items ||
        response.data?.artworks ||
        response.data ||
        [];

      setWorks(
        Array.isArray(returnedWorks)
          ? returnedWorks
          : []
      );
    } catch (requestError) {
      console.error(
        "Failed to load artworks:",
        requestError.response?.data ||
          requestError
      );

      const backendMessage =
        requestError.response?.data?.error ||
        requestError.response?.data?.message ||
        requestError.response?.data?.msg;

      setError(
        backendMessage ||
          "Failed to load your artworks."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArtworks();
  }, [loadArtworks]);

  const handleDelete = async (
    artworkId,
    artworkTitle
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        artworkTitle || "this artwork"
      }"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(artworkId);
      setError("");

      await api.delete(
        `/artworks/${artworkId}`
      );

      setWorks((currentWorks) =>
        currentWorks.filter(
          (artwork) =>
            artwork.id !== artworkId
        )
      );
    } catch (requestError) {
      console.error(
        "Failed to delete artwork:",
        requestError.response?.data ||
          requestError
      );

      const backendMessage =
        requestError.response?.data?.error ||
        requestError.response?.data?.message ||
        requestError.response?.data?.msg;

      setError(
        backendMessage ||
          "Failed to delete the artwork."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const publishedCount = works.filter(
    (artwork) =>
      artwork.status?.toLowerCase() ===
      "published"
  ).length;

  const draftCount = works.filter(
    (artwork) =>
      artwork.status?.toLowerCase() ===
      "draft"
  ).length;

  const totalViews = works.reduce(
    (total, artwork) =>
      total + Number(artwork.views || 0),
    0
  );

  return (
    <>
      <PageHero
        eyebrow="Artist studio"
        title="My artworks"
        text="Manage your portfolio, publication status and artwork details."
      >
        <Link
          className="btn"
          to="/artist/upload"
        >
          Upload artwork
        </Link>
      </PageHero>

      <section className="container">
        {!loading && !error && (
          <div className="dashboard-grid artwork-stats">
            <article className="panel stat-card">
              <span>Total artworks</span>
              <strong>{works.length}</strong>
              <small>
                Your complete portfolio
              </small>
            </article>

            <article className="panel stat-card">
              <span>Published</span>
              <strong>
                {publishedCount}
              </strong>
              <small>
                Visible to collectors
              </small>
            </article>

            <article className="panel stat-card">
              <span>Drafts</span>
              <strong>{draftCount}</strong>
              <small>
                Waiting to be published
              </small>
            </article>

            <article className="panel stat-card">
              <span>Total views</span>
              <strong>
                {totalViews.toLocaleString(
                  "en-IN"
                )}
              </strong>
              <small>
                Across all artworks
              </small>
            </article>
          </div>
        )}

        <section className="panel my-artworks-panel">
          <div className="section-heading artwork-list-heading">
            <div>
              <span className="eyebrow">
                Portfolio
              </span>

              <h2>Your artwork collection</h2>

              <p>
                View, edit or remove artworks
                from your portfolio.
              </p>
            </div>

            <button
              className="btn btn-secondary"
              type="button"
              onClick={loadArtworks}
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {loading && (
            <div className="loading-state">
              <p>
                Loading your artworks...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="error-state">
              <p className="error">
                {error}
              </p>

              <button
                className="btn"
                type="button"
                onClick={loadArtworks}
              >
                Try again
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            works.length === 0 && (
              <div className="empty-state">
                <h2>
                  No artworks uploaded yet
                </h2>

                <p>
                  Upload your first artwork
                  to begin building your
                  ArtVault portfolio.
                </p>

                <Link
                  className="btn"
                  to="/artist/upload"
                >
                  Upload your first artwork
                </Link>
              </div>
            )}

          {!loading &&
            !error &&
            works.length > 0 && (
              <div className="artwork-management-grid">
                {works.map((artwork) => {
                  const imageUrl =
                    getImageUrl(
                      artwork.image_url ||
                        artwork.image
                    );

                  const rating =
                    Number(
                      getArtworkRating(
                        artwork
                      )
                    );

                  const wishlistCount =
                    getWishlistCount(
                      artwork
                    );

                  return (
                    <article
                      className="panel artwork-management-card"
                      key={artwork.id}
                    >
                      <Link
                        className="artwork-management-image"
                        to={`/artworks/${artwork.id}`}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              artwork.title ||
                              "Artwork"
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="artwork-image-placeholder">
                            No image
                          </div>
                        )}

                        <span
                          className={`status ${getStatusClass(
                            artwork.status
                          )}`}
                        >
                          {artwork.status ||
                            "draft"}
                        </span>
                      </Link>

                      <div className="artwork-management-content">
                        <div className="artwork-card-heading">
                          <div>
                            <p className="artwork-category">
                              {artwork.category ||
                                "Uncategorized"}
                            </p>

                            <h3>
                              {artwork.title ||
                                "Untitled artwork"}
                            </h3>
                          </div>

                          <strong className="artwork-price">
                            {formatPrice(
                              artwork.price
                            )}
                          </strong>
                        </div>

                        <div className="artwork-meta">
                          {artwork.medium && (
                            <span>
                              {artwork.medium}
                            </span>
                          )}

                          {artwork.year && (
                            <span>
                              {artwork.year}
                            </span>
                          )}
                        </div>

                        <div className="artwork-performance">
                          <div>
                            <strong>
                              {Number(
                                artwork.views ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </strong>

                            <span>Views</span>
                          </div>

                          <div>
                            <strong>
                              {wishlistCount}
                            </strong>

                            <span>
                              Wishlist
                            </span>
                          </div>

                          <div>
                            <strong>
                              {rating > 0
                                ? rating.toFixed(
                                    1
                                  )
                                : "—"}
                            </strong>

                            <span>Rating</span>
                          </div>
                        </div>

                        <div className="artwork-card-actions">
                          <Link
                            className="btn btn-secondary"
                            to={`/artworks/${artwork.id}`}
                          >
                            View
                          </Link>

                          <Link
                            className="btn btn-secondary"
                            to={`/artist/artworks/${artwork.id}/edit`}
                          >
                            Edit
                          </Link>

                          <button
                            className="btn danger-btn"
                            type="button"
                            disabled={
                              deletingId ===
                              artwork.id
                            }
                            onClick={() =>
                              handleDelete(
                                artwork.id,
                                artwork.title
                              )
                            }
                          >
                            {deletingId ===
                            artwork.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
        </section>
      </section>
    </>
  );
}