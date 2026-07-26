import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Eye,
  Heart,
  ImageOff,
  LoaderCircle,
  Share2,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

import "../styles/ExhibitionDetail.css";

const formatDate = (value) => {
  if (!value) {
    return "Date not announced";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not announced";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatPrice = (value) => {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return "Price on request";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
};

const normalizeExhibition = (responseData) => {
  return (
    responseData?.exhibition ||
    responseData?.data ||
    responseData ||
    null
  );
};

const normalizeExhibitionList = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  return (
    responseData?.exhibitions ||
    responseData?.items ||
    responseData?.data ||
    []
  );
};

const getLifecycleLabel = (exhibition) => {
  const lifecycle =
    exhibition?.lifecycle_status?.toLowerCase();

  if (lifecycle === "live") {
    return "Now open";
  }

  if (lifecycle === "upcoming") {
    return "Opening soon";
  }

  if (lifecycle === "closed") {
    return "Exhibition closed";
  }

  if (exhibition?.status === "published") {
    return "Published";
  }

  return exhibition?.status || "Exhibition";
};

const getLifecycleClass = (exhibition) => {
  const lifecycle =
    exhibition?.lifecycle_status?.toLowerCase();

  if (lifecycle === "live") {
    return "is-live";
  }

  if (lifecycle === "upcoming") {
    return "is-upcoming";
  }

  if (lifecycle === "closed") {
    return "is-closed";
  }

  return "is-published";
};

export default function ExhibitionDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [exhibition, setExhibition] =
    useState(null);

  const [relatedExhibitions, setRelatedExhibitions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [relatedLoading, setRelatedLoading] =
    useState(false);

  const [liking, setLiking] =
    useState(false);

  const [liked, setLiked] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [imageErrors, setImageErrors] =
    useState({});

  const [error, setError] =
    useState("");

  const fetchExhibition = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/exhibitions/${slug}`
      );

      const exhibitionData =
        normalizeExhibition(response.data);

      if (!exhibitionData?.id) {
        throw new Error(
          "Invalid exhibition response."
        );
      }

      setExhibition(exhibitionData);

      const storageKey =
        `artvault_exhibition_liked_${exhibitionData.id}`;

      setLiked(
        localStorage.getItem(storageKey) ===
          "true"
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          requestError.message ||
          "Failed to load this exhibition."
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchRelatedExhibitions =
    useCallback(async () => {
      try {
        setRelatedLoading(true);

        const response = await api.get(
          "/exhibitions",
          {
            params: {
              status: "published",
              per_page: 8,
            },
          }
        );

        const exhibitionList =
          normalizeExhibitionList(
            response.data
          );

        setRelatedExhibitions(
          exhibitionList
        );
      } catch {
        setRelatedExhibitions([]);
      } finally {
        setRelatedLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchExhibition();
    fetchRelatedExhibitions();
  }, [
    fetchExhibition,
    fetchRelatedExhibitions,
  ]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [slug]);

  const artworks = useMemo(() => {
    if (!exhibition) {
      return [];
    }

    if (Array.isArray(exhibition.artworks)) {
      return exhibition.artworks;
    }

    if (
      Array.isArray(
        exhibition.featured_artworks
      )
    ) {
      return exhibition.featured_artworks;
    }

    return [];
  }, [exhibition]);

  const participatingArtists = useMemo(() => {
    if (!exhibition) {
      return [];
    }

    if (
      Array.isArray(
        exhibition.participating_artists
      )
    ) {
      return exhibition.participating_artists;
    }

    const uniqueArtists = new Map();

    artworks.forEach((artwork) => {
      const artist =
        artwork?.artist || null;

      const artistId =
        artist?.id ||
        artwork?.artist_id ||
        artwork?.artist_name;

      if (!artistId) {
        return;
      }

      if (!uniqueArtists.has(artistId)) {
        uniqueArtists.set(artistId, {
          id:
            artist?.id ||
            artwork?.artist_id ||
            artistId,

          name:
            artist?.name ||
            artwork?.artist_name ||
            "ArtVault Artist",

          profile_image:
            artist?.profile_image ||
            artist?.avatar_url ||
            artwork?.artist_image ||
            "",
        });
      }
    });

    return Array.from(
      uniqueArtists.values()
    );
  }, [exhibition, artworks]);

  const curator = useMemo(() => {
    if (!exhibition) {
      return null;
    }

    return (
      exhibition.curator || {
        id: exhibition.curator_id,
        name:
          exhibition.curator_name ||
          "ArtVault Curatorial Team",
        profile_image:
          exhibition.curator_image || "",
        bio:
          exhibition.curator_bio ||
          "Curated for the ArtVault community.",
      }
    );
  }, [exhibition]);

  const relatedItems = useMemo(() => {
    if (!exhibition) {
      return [];
    }

    return relatedExhibitions
      .filter((item) => {
        return (
          item.id !== exhibition.id &&
          item.slug !== exhibition.slug &&
          item.status === "published"
        );
      })
      .slice(0, 3);
  }, [
    relatedExhibitions,
    exhibition,
  ]);

  const handleImageError = (key) => {
    setImageErrors((current) => ({
      ...current,
      [key]: true,
    }));
  };

  const handleLike = async () => {
    if (!exhibition?.id || liking) {
      return;
    }

    try {
      setLiking(true);
      setError("");

      const endpoint = liked
        ? `/exhibitions/${exhibition.id}/unlike`
        : `/exhibitions/${exhibition.id}/like`;

      const response = await api.patch(
        endpoint
      );

      const updatedLikes =
        response.data?.likes;

      setExhibition((current) => ({
        ...current,
        likes:
          typeof updatedLikes === "number"
            ? updatedLikes
            : Math.max(
                0,
                Number(current?.likes || 0) +
                  (liked ? -1 : 1)
              ),
      }));

      const nextLiked = !liked;

      setLiked(nextLiked);

      localStorage.setItem(
        `artvault_exhibition_liked_${exhibition.id}`,
        String(nextLiked)
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Unable to update your appreciation."
      );
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title:
        exhibition?.title ||
        "ArtVault Exhibition",

      text:
        exhibition?.description ||
        "Explore this curated exhibition on ArtVault.",

      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(
        window.location.href
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (shareError) {
      if (
        shareError?.name !== "AbortError"
      ) {
        setError(
          "Unable to share this exhibition."
        );
      }
    }
  };

  if (loading) {
    return (
      <main className="exhibition-detail-page">
        <section className="exhibition-detail-loading">
          <LoaderCircle
            className="spin"
            size={38}
          />

          <p>Preparing the exhibition...</p>
        </section>
      </main>
    );
  }

  if (error && !exhibition) {
    return (
      <main className="exhibition-detail-page">
        <section className="exhibition-detail-error">
          <Sparkles size={42} />

          <h1>Exhibition unavailable</h1>

          <p>{error}</p>

          <div className="exhibition-error-actions">
            <button
              type="button"
              className="btn"
              onClick={fetchExhibition}
            >
              Try again
            </button>

            <Link
              className="btn secondary"
              to="/exhibitions"
            >
              Browse exhibitions
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const bannerSource =
    exhibition?.banner_url ||
    exhibition?.banner ||
    exhibition?.cover_image;

  return (
    <main className="exhibition-detail-page">
      <section className="exhibition-detail-hero">
        <div className="exhibition-detail-back-wrapper container">
          <button
            type="button"
            className="exhibition-back-button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
            Back to exhibitions
          </button>
        </div>

        <div className="exhibition-detail-banner">
          {bannerSource &&
          !imageErrors.banner ? (
            <img
              src={getImageUrl(
                bannerSource
              )}
              alt={exhibition.title}
              onError={() =>
                handleImageError("banner")
              }
            />
          ) : (
            <div className="exhibition-banner-fallback">
              <Sparkles size={54} />
            </div>
          )}

          <div className="exhibition-banner-overlay" />
        </div>
      </section>

      <section className="exhibition-intro-section">
        <div className="container exhibition-intro-layout">
          <div className="exhibition-intro-copy">
            <div className="exhibition-hero-badges">
              <span
                className={`exhibition-lifecycle-badge ${getLifecycleClass(
                  exhibition
                )}`}
              >
                <Sparkles size={14} />
                {getLifecycleLabel(
                  exhibition
                )}
              </span>

              {exhibition.is_featured && (
                <span className="exhibition-featured-badge">
                  Featured exhibition
                </span>
              )}
            </div>

            <span className="exhibition-section-eyebrow">
              Curated exhibition
            </span>

            <h1>{exhibition.title}</h1>

            <p>
              {exhibition.description ||
                "A thoughtfully curated collection presented by ArtVault."}
            </p>
          </div>

          <aside className="exhibition-intro-summary">
            <div className="exhibition-intro-meta">
              <div>
                <CalendarDays size={19} />
                <span>
                  <small>Exhibition dates</small>
                  <strong>
                    {formatDate(
                      exhibition.starts_at ||
                        exhibition.start_date
                    )}
                    {" — "}
                    {formatDate(
                      exhibition.ends_at ||
                        exhibition.end_date
                    )}
                  </strong>
                </span>
              </div>

              <div>
                <ImageOff size={19} />
                <span>
                  <small>Artworks</small>
                  <strong>
                    {exhibition.artwork_count ??
                      artworks.length}
                  </strong>
                </span>
              </div>

              <div>
                <Users size={19} />
                <span>
                  <small>Artists</small>
                  <strong>
                    {exhibition.artist_count ??
                      participatingArtists.length}
                  </strong>
                </span>
              </div>

              <div>
                <Eye size={19} />
                <span>
                  <small>Views</small>
                  <strong>
                    {Number(
                      exhibition.views || 0
                    ).toLocaleString("en-IN")}
                  </strong>
                </span>
              </div>
            </div>

            <div className="exhibition-intro-actions">
              <button
                type="button"
                className={`exhibition-like-button ${
                  liked ? "is-liked" : ""
                }`}
                onClick={handleLike}
                disabled={liking}
              >
                {liking ? (
                  <LoaderCircle
                    className="spin"
                    size={18}
                  />
                ) : (
                  <Heart
                    size={18}
                    fill={
                      liked
                        ? "currentColor"
                        : "none"
                    }
                  />
                )}

                {liked
                  ? "Appreciated"
                  : "Appreciate"}
              </button>

              <button
                type="button"
                className="exhibition-share-button"
                onClick={handleShare}
              >
                {copied ? (
                  <Check size={18} />
                ) : (
                  <Share2 size={18} />
                )}

                {copied
                  ? "Link copied"
                  : "Share"}
              </button>
            </div>
          </aside>
        </div>
      </section>

      <section className="container exhibition-detail-main">
        {error && (
          <div className="exhibition-detail-alert">
            {error}

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        )}

        <div className="exhibition-detail-layout">
          <article className="exhibition-story">
            <span className="exhibition-section-eyebrow">
              Curatorial narrative
            </span>

            <h2>About the exhibition</h2>

            <p>
              {exhibition.description ||
                "This exhibition brings together a carefully selected group of artworks connected by a shared artistic vision."}
            </p>

            {exhibition.curatorial_note && (
              <blockquote>
                {
                  exhibition.curatorial_note
                }
              </blockquote>
            )}
          </article>

          <aside className="exhibition-information-card">
            <div className="exhibition-info-heading">
              <Sparkles size={20} />

              <div>
                <span>Exhibition details</span>
                <strong>
                  Curated presentation
                </strong>
              </div>
            </div>

            <div className="exhibition-information-list">
              <div>
                <CalendarDays size={18} />

                <span>
                  <small>Opening</small>
                  <strong>
                    {formatDate(
                      exhibition.starts_at ||
                        exhibition.start_date
                    )}
                  </strong>
                </span>
              </div>

              <div>
                <CalendarDays size={18} />

                <span>
                  <small>Closing</small>
                  <strong>
                    {formatDate(
                      exhibition.ends_at ||
                        exhibition.end_date
                    )}
                  </strong>
                </span>
              </div>

              <div>
                <ImageOff size={18} />

                <span>
                  <small>Artworks</small>
                  <strong>
                    {exhibition.artwork_count ??
                      artworks.length}
                  </strong>
                </span>
              </div>

              <div>
                <Users size={18} />

                <span>
                  <small>Artists</small>
                  <strong>
                    {exhibition.artist_count ??
                      participatingArtists.length}
                  </strong>
                </span>
              </div>

              <div>
                <Eye size={18} />

                <span>
                  <small>Views</small>
                  <strong>
                    {Number(
                      exhibition.views || 0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </span>
              </div>

              <div>
                <Heart size={18} />

                <span>
                  <small>Appreciations</small>
                  <strong>
                    {Number(
                      exhibition.likes || 0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </span>
              </div>
            </div>

          </aside>
        </div>
      </section>

      <section className="container exhibition-artworks-section">
        <div className="exhibition-section-heading">
          <div>
            <span className="exhibition-section-eyebrow">
              The collection
            </span>

            <h2>Featured artworks</h2>

            <p>
              Explore the works selected for
              this curated exhibition.
            </p>
          </div>

          <span className="exhibition-count-badge">
            {artworks.length}{" "}
            {artworks.length === 1
              ? "artwork"
              : "artworks"}
          </span>
        </div>

        {artworks.length === 0 ? (
          <div className="exhibition-empty-collection">
            <ImageOff size={42} />

            <h3>
              No artworks are currently displayed
            </h3>

            <p>
              The curator has not added any
              public artworks to this exhibition
              yet.
            </p>
          </div>
        ) : (
          <div className="exhibition-artwork-grid">
            {artworks.map(
              (artwork, index) => {
                const artworkId =
                  artwork.id ||
                  artwork._id;

                const imageSource =
                  artwork.image_url ||
                  artwork.image ||
                  artwork.thumbnail_url ||
                  artwork.cover_image;

                const imageKey =
                  `artwork-${artworkId || index}`;

                const artistName =
                  artwork.artist_name ||
                  artwork.artist?.name ||
                  "ArtVault Artist";

                return (
                  <Link
                    key={
                      artworkId ||
                      `${artwork.title}-${index}`
                    }
                    className="exhibition-artwork-card"
                    to={`/artworks/${artworkId}`}
                  >
                    <div className="exhibition-artwork-image">
                      {imageSource &&
                      !imageErrors[imageKey] ? (
                        <img
                          src={getImageUrl(
                            imageSource
                          )}
                          alt={
                            artwork.title ||
                            "Artwork"
                          }
                          loading="lazy"
                          onError={() =>
                            handleImageError(
                              imageKey
                            )
                          }
                        />
                      ) : (
                        <div className="exhibition-artwork-placeholder">
                          <ImageOff
                            size={34}
                          />
                        </div>
                      )}

                      <span className="exhibition-artwork-number">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="exhibition-artwork-content">
                      <span className="exhibition-artwork-artist">
                        {artistName}
                      </span>

                      <h3>
                        {artwork.title ||
                          "Untitled artwork"}
                      </h3>

                      <div className="exhibition-artwork-meta">
                        <span>
                          {artwork.medium ||
                            artwork.category ||
                            "Original artwork"}
                        </span>

                        <strong>
                          {formatPrice(
                            artwork.price
                          )}
                        </strong>
                      </div>
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        )}
      </section>

      {curator && (
        <section className="container exhibition-curator-section">
          <article className="exhibition-curator-card">
            <div className="exhibition-curator-avatar">
              {curator.profile_image &&
              !imageErrors.curator ? (
                <img
                  src={getImageUrl(
                    curator.profile_image
                  )}
                  alt={
                    curator.name ||
                    "Curator"
                  }
                  onError={() =>
                    handleImageError(
                      "curator"
                    )
                  }
                />
              ) : (
                <UserRound size={34} />
              )}
            </div>

            <div className="exhibition-curator-content">
              <span className="exhibition-section-eyebrow">
                Curated by
              </span>

              <h2>
                {curator.name ||
                  "ArtVault Curatorial Team"}
              </h2>

              <p>
                {curator.bio ||
                  "A curator dedicated to connecting audiences with distinctive artistic voices and meaningful visual narratives."}
              </p>

              {curator.id && (
                <Link
                  to={`/artists/${curator.id}`}
                  className="exhibition-curator-link"
                >
                  View curator profile
                </Link>
              )}
            </div>
          </article>
        </section>
      )}

      {participatingArtists.length > 0 && (
        <section className="container exhibition-artists-section">
          <div className="exhibition-section-heading">
            <div>
              <span className="exhibition-section-eyebrow">
                Creative voices
              </span>

              <h2>Participating artists</h2>

              <p>
                Meet the artists represented in
                this exhibition.
              </p>
            </div>
          </div>

          <div className="exhibition-artist-grid">
            {participatingArtists.map(
              (artist, index) => {
                const artistId =
                  artist.id ||
                  artist._id ||
                  index;

                const avatarSource =
                  artist.profile_image ||
                  artist.avatar_url ||
                  artist.image_url;

                const artistImageKey =
                  `artist-${artistId}`;

                const ArtistWrapper =
                  artist.id ? Link : "article";

                const wrapperProps =
                  artist.id
                    ? {
                        to: `/artists/${artist.id}`,
                      }
                    : {};

                return (
                  <ArtistWrapper
                    key={artistId}
                    className="exhibition-artist-card"
                    {...wrapperProps}
                  >
                    <div className="exhibition-artist-avatar">
                      {avatarSource &&
                      !imageErrors[
                        artistImageKey
                      ] ? (
                        <img
                          src={getImageUrl(
                            avatarSource
                          )}
                          alt={
                            artist.name ||
                            "Artist"
                          }
                          loading="lazy"
                          onError={() =>
                            handleImageError(
                              artistImageKey
                            )
                          }
                        />
                      ) : (
                        <UserRound
                          size={28}
                        />
                      )}
                    </div>

                    <div>
                      <strong>
                        {artist.name ||
                          "ArtVault Artist"}
                      </strong>

                      <span>
                        Participating artist
                      </span>
                    </div>
                  </ArtistWrapper>
                );
              }
            )}
          </div>
        </section>
      )}

      {(relatedLoading ||
        relatedItems.length > 0) && (
        <section className="container exhibition-related-section">
          <div className="exhibition-section-heading">
            <div>
              <span className="exhibition-section-eyebrow">
                Continue exploring
              </span>

              <h2>Related exhibitions</h2>

              <p>
                Discover more curated stories
                from ArtVault.
              </p>
            </div>

            <Link
              to="/exhibitions"
              className="exhibition-view-all-link"
            >
              View all exhibitions
            </Link>
          </div>

          {relatedLoading ? (
            <div className="exhibition-related-loading">
              <LoaderCircle
                className="spin"
                size={28}
              />

              Loading exhibitions...
            </div>
          ) : (
            <div className="exhibition-related-grid">
              {relatedItems.map(
                (item) => {
                  const relatedBanner =
                    item.banner_url ||
                    item.banner ||
                    item.cover_image;

                  return (
                    <Link
                      key={item.id}
                      to={`/exhibitions/${item.slug}`}
                      className="exhibition-related-card"
                    >
                      <div className="exhibition-related-image">
                        {relatedBanner ? (
                          <img
                            src={getImageUrl(
                              relatedBanner
                            )}
                            alt={item.title}
                            loading="lazy"
                          />
                        ) : (
                          <div className="exhibition-related-placeholder">
                            <Sparkles
                              size={34}
                            />
                          </div>
                        )}
                      </div>

                      <div className="exhibition-related-content">
                        <span>
                          {getLifecycleLabel(
                            item
                          )}
                        </span>

                        <h3>{item.title}</h3>

                        <p>
                          {formatDate(
                            item.starts_at ||
                              item.start_date
                          )}
                        </p>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}