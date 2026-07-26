import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Archive,
  CalendarDays,
  Eye,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import PageHero from "../components/PageHero";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

import "../styles/ManageExhibitions.css";

const FILTERS = [
  {
    key: "all",
    label: "All",
  },
  {
    key: "draft",
    label: "Drafts",
  },
  {
    key: "published",
    label: "Published",
  },
  {
    key: "archived",
    label: "Archived",
  },
];

const formatDate = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
};

const getStatusLabel = (
  exhibition
) => {
  const lifecycle =
    exhibition?.lifecycle_status;

  if (
    exhibition?.status ===
    "published"
  ) {
    if (lifecycle === "live") {
      return "Live";
    }

    if (
      lifecycle === "upcoming"
    ) {
      return "Upcoming";
    }

    if (
      lifecycle === "closed"
    ) {
      return "Closed";
    }
  }

  if (
    exhibition?.status ===
    "archived"
  ) {
    return "Archived";
  }

  return "Draft";
};

const getStatusClass = (
  exhibition
) => {
  const lifecycle =
    exhibition?.lifecycle_status;

  if (
    exhibition?.status ===
    "published"
  ) {
    if (lifecycle === "live") {
      return "is-live";
    }

    if (
      lifecycle === "upcoming"
    ) {
      return "is-upcoming";
    }

    if (
      lifecycle === "closed"
    ) {
      return "is-closed";
    }

    return "is-published";
  }

  if (
    exhibition?.status ===
    "archived"
  ) {
    return "is-archived";
  }

  return "is-draft";
};

export default function ManageExhibitions() {
  const navigate = useNavigate();

  const [
    exhibitions,
    setExhibitions,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoadingId,
    setActionLoadingId,
  ] = useState(null);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState("all");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const fetchExhibitions =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/exhibitions/mine"
          );

        const responseData =
          response.data;

        const exhibitionData =
          Array.isArray(
            responseData
          )
            ? responseData
            : Array.isArray(
                responseData
                  ?.exhibitions
              )
              ? responseData
                  .exhibitions
              : Array.isArray(
                  responseData
                    ?.items
                )
                ? responseData
                    .items
                : [];

        setExhibitions(
          exhibitionData
        );
      } catch (requestError) {
        setError(
          requestError.response
            ?.data?.error ||
            requestError.response
              ?.data?.message ||
            "Failed to load exhibitions."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchExhibitions();
  }, [fetchExhibitions]);

  const exhibitionCounts =
    useMemo(() => {
      return exhibitions.reduce(
        (counts, exhibition) => {
          counts.all += 1;

          if (
            exhibition.status ===
            "draft"
          ) {
            counts.draft += 1;
          }

          if (
            exhibition.status ===
            "published"
          ) {
            counts.published += 1;
          }

          if (
            exhibition.status ===
            "archived"
          ) {
            counts.archived += 1;
          }

          return counts;
        },
        {
          all: 0,
          draft: 0,
          published: 0,
          archived: 0,
        }
      );
    }, [exhibitions]);

  const filteredExhibitions =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return exhibitions.filter(
        (exhibition) => {
          const title =
            exhibition?.title
              ?.toLowerCase() ||
            "";

          const description =
            exhibition
              ?.description
              ?.toLowerCase() ||
            "";

          const matchesSearch =
            !normalizedSearch ||
            title.includes(
              normalizedSearch
            ) ||
            description.includes(
              normalizedSearch
            );

          const matchesFilter =
            activeFilter ===
              "all" ||
            exhibition.status ===
              activeFilter;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      exhibitions,
      activeFilter,
      searchTerm,
    ]);

  const updateLocalExhibition = (
    updatedExhibition
  ) => {
    setExhibitions(
      (currentExhibitions) =>
        currentExhibitions.map(
          (exhibition) =>
            Number(
              exhibition.id
            ) ===
            Number(
              updatedExhibition.id
            )
              ? {
                  ...exhibition,
                  ...updatedExhibition,
                }
              : exhibition
        )
    );
  };

  const updateStatus = async (
    exhibition,
    nextStatus
  ) => {
    try {
      setActionLoadingId(
        exhibition.id
      );

      setError("");
      setMessage("");

      const response =
        await api.patch(
          `/exhibitions/${exhibition.id}`,
          {
            status: nextStatus,
          }
        );

      const updatedExhibition =
        response.data
          ?.exhibition ||
        response.data;

      updateLocalExhibition(
        updatedExhibition
      );

      if (
        nextStatus ===
        "published"
      ) {
        setMessage(
          "Exhibition published successfully."
        );
      } else if (
        nextStatus ===
        "archived"
      ) {
        setMessage(
          "Exhibition archived successfully."
        );
      } else {
        setMessage(
          "Exhibition moved to drafts."
        );
      }
    } catch (requestError) {
      setError(
        requestError.response
          ?.data?.error ||
          requestError.response
            ?.data?.message ||
          "Failed to update exhibition."
      );
    } finally {
      setActionLoadingId(
        null
      );
    }
  };

  const deleteExhibition =
    async (exhibition) => {
      const shouldDelete =
        window.confirm(
          `Delete "${exhibition.title}" permanently?`
        );

      if (!shouldDelete) {
        return;
      }

      try {
        setDeletingId(
          exhibition.id
        );

        setError("");
        setMessage("");

        await api.delete(
          `/exhibitions/${exhibition.id}`
        );

        setExhibitions(
          (
            currentExhibitions
          ) =>
            currentExhibitions.filter(
              (item) =>
                Number(
                  item.id
                ) !==
                Number(
                  exhibition.id
                )
            )
        );

        setMessage(
          "Exhibition deleted successfully."
        );
      } catch (requestError) {
        setError(
          requestError.response
            ?.data?.error ||
            requestError.response
              ?.data?.message ||
            "Failed to delete exhibition."
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  const viewExhibition = (
    exhibition
  ) => {
    if (
      exhibition.status ===
      "published"
    ) {
      navigate(
        `/exhibitions/${exhibition.slug}`
      );

      return;
    }

    setError(
      "Only published exhibitions can be viewed publicly."
    );

    setMessage("");
  };

  return (
    <>
      <PageHero
        eyebrow="Curator workspace"
        title="Manage exhibitions"
        text="Review drafts, publish curated collections, monitor performance, and maintain your exhibition catalogue."
      />

      <section className="container manage-exhibitions">
        <div className="manage-exhibitions-topbar">
          <div>
            <span className="manage-section-label">
              <Sparkles
                size={16}
              />

              Exhibition manager
            </span>

            <h2>
              Your curated exhibitions
            </h2>

            <p>
              Manage schedules,
              artworks, publication
              status, and engagement.
            </p>
          </div>

          <Link
            className="btn manage-create-button"
            to="/curator/studio"
          >
            <Plus size={18} />
            Create exhibition
          </Link>
        </div>

        {(error || message) && (
          <div
            className={`manage-alert ${
              error
                ? "manage-alert-error"
                : "manage-alert-success"
            }`}
          >
            <span>
              {error || message}
            </span>

            <button
              type="button"
              onClick={() => {
                setError("");
                setMessage("");
              }}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        )}

        <div className="manage-summary-grid">
          <article className="manage-summary-card">
            <span>Total</span>

            <strong>
              {
                exhibitionCounts.all
              }
            </strong>

            <small>
              All exhibitions
            </small>
          </article>

          <article className="manage-summary-card">
            <span>Drafts</span>

            <strong>
              {
                exhibitionCounts.draft
              }
            </strong>

            <small>
              Work in progress
            </small>
          </article>

          <article className="manage-summary-card">
            <span>
              Published
            </span>

            <strong>
              {
                exhibitionCounts
                  .published
              }
            </strong>

            <small>
              Public exhibitions
            </small>
          </article>

          <article className="manage-summary-card">
            <span>
              Archived
            </span>

            <strong>
              {
                exhibitionCounts
                  .archived
              }
            </strong>

            <small>
              Hidden collections
            </small>
          </article>
        </div>

        <div className="panel manage-toolbar">
          <div className="manage-filters">
            {FILTERS.map(
              (filter) => (
                <button
                  key={
                    filter.key
                  }
                  type="button"
                  className={
                    activeFilter ===
                    filter.key
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    setActiveFilter(
                      filter.key
                    )
                  }
                >
                  {
                    filter.label
                  }

                  <span>
                    {
                      exhibitionCounts[
                        filter.key
                      ]
                    }
                  </span>
                </button>
              )
            )}
          </div>

          <div className="manage-toolbar-actions">
            <label className="manage-search">
              <Search
                size={18}
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(
                  event
                ) =>
                  setSearchTerm(
                    event.target
                      .value
                  )
                }
                placeholder="Search exhibitions..."
              />
            </label>

            <button
              type="button"
              className="manage-refresh-button"
              onClick={
                fetchExhibitions
              }
              disabled={loading}
              aria-label="Refresh exhibitions"
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? "spin"
                    : ""
                }
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="panel manage-loading">
            <LoaderCircle
              className="spin"
              size={32}
            />

            <p>
              Loading exhibitions...
            </p>
          </div>
        ) : filteredExhibitions.length ===
          0 ? (
          <div className="panel manage-empty-state">
            <ImagePlus
              size={42}
            />

            <h3>
              {searchTerm ||
              activeFilter !==
                "all"
                ? "No matching exhibitions"
                : "No exhibitions created yet"}
            </h3>

            <p>
              {searchTerm ||
              activeFilter !==
                "all"
                ? "Try another search term or status filter."
                : "Create your first curated exhibition and select artworks to feature."}
            </p>

            {!searchTerm &&
              activeFilter ===
                "all" && (
                <Link
                  className="btn"
                  to="/curator/studio"
                >
                  <Plus
                    size={18}
                  />
                  Create exhibition
                </Link>
              )}
          </div>
        ) : (
          <div className="manage-exhibition-grid">
            {filteredExhibitions.map(
              (exhibition) => {
                const bannerSource =
                  exhibition.banner_url ||
                  exhibition.banner ||
                  exhibition.image_url ||
                  exhibition.cover_image ||
                  "";

                const isActionLoading =
                  actionLoadingId ===
                  exhibition.id;

                const isDeleting =
                  deletingId ===
                  exhibition.id;

                return (
                  <article
                    key={
                      exhibition.id
                    }
                    className="panel manage-exhibition-card"
                  >
                    <div className="manage-exhibition-banner">
                      {bannerSource ? (
                        <img
                          src={getImageUrl(
                            bannerSource
                          )}
                          alt={
                            exhibition.title
                          }
                        />
                      ) : (
                        <div className="manage-banner-placeholder">
                          <ImagePlus
                            size={36}
                          />
                        </div>
                      )}

                      <span
                        className={`manage-status-badge ${getStatusClass(
                          exhibition
                        )}`}
                      >
                        {getStatusLabel(
                          exhibition
                        )}
                      </span>

                      {exhibition.is_featured && (
                        <span className="manage-featured-badge">
                          <Sparkles
                            size={14}
                          />
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="manage-exhibition-content">
                      <div className="manage-exhibition-heading">
                        <div>
                          <h3>
                            {
                              exhibition.title
                            }
                          </h3>

                          <p>
                            {exhibition.description ||
                              "No exhibition description provided."}
                          </p>
                        </div>
                      </div>

                      <div className="manage-exhibition-schedule">
                        <CalendarDays
                          size={17}
                        />

                        <span>
                          {formatDate(
                            exhibition.starts_at
                          )}
                          {" — "}
                          {formatDate(
                            exhibition.ends_at
                          )}
                        </span>
                      </div>

                      <div className="manage-exhibition-stats">
                        <div>
                          <ImagePlus
                            size={17}
                          />

                          <span>
                            <strong>
                              {exhibition.artwork_count ??
                                exhibition
                                  .artworks
                                  ?.length ??
                                0}
                            </strong>
                            Artworks
                          </span>
                        </div>

                        <div>
                          <Users
                            size={17}
                          />

                          <span>
                            <strong>
                              {exhibition.artist_count ??
                                exhibition
                                  .participating_artists
                                  ?.length ??
                                0}
                            </strong>
                            Artists
                          </span>
                        </div>

                        <div>
                          <Eye
                            size={17}
                          />

                          <span>
                            <strong>
                              {exhibition.views ??
                                0}
                            </strong>
                            Views
                          </span>
                        </div>

                        <div>
                          <Sparkles
                            size={17}
                          />

                          <span>
                            <strong>
                              {exhibition.likes ??
                                0}
                            </strong>
                            Likes
                          </span>
                        </div>
                      </div>

                      <div className="manage-exhibition-actions">
                        <button
                          type="button"
                          className="manage-icon-button"
                          onClick={() =>
                            navigate(
                              `/curator/studio?edit=${encodeURIComponent(
                                exhibition.id
                              )}`
                            )
                          }
                          aria-label={`Edit ${exhibition.title}`}
                          title="Edit exhibition"
                        >
                          <Pencil
                            size={17}
                          />
                        </button>

                        <button
                          type="button"
                          className="manage-view-button"
                          onClick={() =>
                            viewExhibition(
                              exhibition
                            )
                          }
                          disabled={
                            exhibition.status !==
                            "published"
                          }
                        >
                          <Eye
                            size={17}
                          />
                          View
                        </button>

                        {exhibition.status ===
                          "draft" && (
                          <button
                            type="button"
                            className="manage-publish-button"
                            disabled={
                              isActionLoading
                            }
                            onClick={() =>
                              updateStatus(
                                exhibition,
                                "published"
                              )
                            }
                          >
                            {isActionLoading ? (
                              <LoaderCircle
                                className="spin"
                                size={17}
                              />
                            ) : (
                              <Sparkles
                                size={17}
                              />
                            )}

                            Publish
                          </button>
                        )}

                        {exhibition.status ===
                          "published" && (
                          <button
                            type="button"
                            className="manage-archive-button"
                            disabled={
                              isActionLoading
                            }
                            onClick={() =>
                              updateStatus(
                                exhibition,
                                "archived"
                              )
                            }
                          >
                            {isActionLoading ? (
                              <LoaderCircle
                                className="spin"
                                size={17}
                              />
                            ) : (
                              <Archive
                                size={17}
                              />
                            )}

                            Archive
                          </button>
                        )}

                        {exhibition.status ===
                          "archived" && (
                          <button
                            type="button"
                            className="manage-publish-button"
                            disabled={
                              isActionLoading
                            }
                            onClick={() =>
                              updateStatus(
                                exhibition,
                                "draft"
                              )
                            }
                          >
                            {isActionLoading ? (
                              <LoaderCircle
                                className="spin"
                                size={17}
                              />
                            ) : (
                              <RefreshCw
                                size={17}
                              />
                            )}

                            Restore
                          </button>
                        )}

                        <button
                          type="button"
                          className="manage-delete-button"
                          disabled={
                            isDeleting
                          }
                          onClick={() =>
                            deleteExhibition(
                              exhibition
                            )
                          }
                          aria-label={`Delete ${exhibition.title}`}
                        >
                          {isDeleting ? (
                            <LoaderCircle
                              className="spin"
                              size={17}
                            />
                          ) : (
                            <Trash2
                              size={17}
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </>
  );
}