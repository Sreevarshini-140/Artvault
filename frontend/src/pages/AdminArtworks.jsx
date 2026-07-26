import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageOff,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import PageHero from "../components/PageHero";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

import "../styles/AdminArtworks.css";


const STATUS_OPTIONS = [
  "all",
  "draft",
  "published",
  "sold",
  "archived",
];


function capitalize(value) {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


function formatPrice(value) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }
  ).format(Number(value || 0));
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function getStatusClass(status) {
  switch (
    String(status || "").toLowerCase()
  ) {
    case "published":
      return "success";

    case "sold":
      return "sold";

    case "archived":
      return "muted";

    case "draft":
    default:
      return "warning";
  }
}


export default function AdminArtworks() {
  const [artworks, setArtworks] =
    useState([]);

  const [summary, setSummary] =
    useState({
      total: 0,
      published: 0,
      draft: 0,
      sold: 0,
      archived: 0,
    });

  const [categories, setCategories] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [page, setPage] =
    useState(1);

  const [pages, setPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState(null);


  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (searchTerm.trim()) {
      params.set(
        "search",
        searchTerm.trim()
      );
    }

    if (statusFilter !== "all") {
      params.set(
        "status",
        statusFilter
      );
    }

    if (categoryFilter !== "all") {
      params.set(
        "category",
        categoryFilter
      );
    }

    params.set("page", String(page));
    params.set("per_page", "10");

    return params.toString();
  }, [
    searchTerm,
    statusFilter,
    categoryFilter,
    page,
  ]);


  const loadArtworks =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/artworks/admin?${queryString}`
        );

        const payload = response.data || {};

        setArtworks(
          Array.isArray(payload.items)
            ? payload.items
            : []
        );

        setSummary(
          payload.summary || {
            total: 0,
            published: 0,
            draft: 0,
            sold: 0,
            archived: 0,
          }
        );

        setCategories(
          Array.isArray(payload.categories)
            ? payload.categories
            : []
        );

        setPages(
          Math.max(
            Number(
              payload.pagination?.pages || 1
            ),
            1
          )
        );
      } catch (requestError) {
        console.error(
          "Admin artwork loading error:",
          requestError
        );

        setError(
          requestError.response?.data?.error ||
            requestError.response?.data?.msg ||
            "Unable to load artworks."
        );
      } finally {
        setLoading(false);
      }
    }, [queryString]);


  useEffect(() => {
    const timer = setTimeout(() => {
      loadArtworks();
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [loadArtworks]);


  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    statusFilter,
    categoryFilter,
  ]);


  async function changeStatus(
    artwork,
    nextStatus
  ) {
    if (
      artwork.status === "sold"
    ) {
      toast.error(
        "Sold artworks cannot be moderated."
      );
      return;
    }

    const confirmed = window.confirm(
      `Change "${artwork.title}" from ${artwork.status} to ${nextStatus}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(artwork.id);

      const response = await api.patch(
        `/artworks/admin/${artwork.id}/status`,
        {
          status: nextStatus,
        }
      );

      const updatedArtwork =
        response.data?.artwork;

      setArtworks((current) =>
        current.map((item) =>
          item.id === artwork.id
            ? {
                ...item,
                ...updatedArtwork,
              }
            : item
        )
      );

      setSummary((current) => {
        const next = {
          ...current,
        };

        const previousStatus =
          String(
            artwork.status || ""
          ).toLowerCase();

        if (
          Object.prototype.hasOwnProperty.call(
            next,
            previousStatus
          )
        ) {
          next[previousStatus] = Math.max(
            Number(
              next[previousStatus] || 0
            ) - 1,
            0
          );
        }

        if (
          Object.prototype.hasOwnProperty.call(
            next,
            nextStatus
          )
        ) {
          next[nextStatus] =
            Number(
              next[nextStatus] || 0
            ) + 1;
        }

        return next;
      });

      toast.success(
        response.data?.message ||
          `Artwork marked as ${nextStatus}.`
      );
    } catch (requestError) {
      console.error(
        "Artwork moderation error:",
        requestError
      );

      toast.error(
        requestError.response?.data?.error ||
          requestError.response?.data?.msg ||
          "Unable to update artwork status."
      );
    } finally {
      setUpdatingId(null);
    }
  }


  return (
    <>
      <PageHero
        eyebrow="Administration"
        title="Artwork moderation"
        text="Review catalogue activity and control publication status across ArtVault."
      />

      <section className="container">
        <div className="admin-artworks-summary-grid">
          <article className="panel admin-artworks-summary-card">
            <ShieldCheck size={22} />

            <div>
              <span>Total artworks</span>
              <strong>
                {summary.total}
              </strong>
            </div>
          </article>

          <article className="panel admin-artworks-summary-card">
            <CheckCircle2 size={22} />

            <div>
              <span>Published</span>
              <strong>
                {summary.published}
              </strong>
            </div>
          </article>

          <article className="panel admin-artworks-summary-card">
            <Archive size={22} />

            <div>
              <span>Archived</span>
              <strong>
                {summary.archived}
              </strong>
            </div>
          </article>

          <article className="panel admin-artworks-summary-card">
            <Eye size={22} />

            <div>
              <span>Drafts</span>
              <strong>
                {summary.draft}
              </strong>
            </div>
          </article>
        </div>

        <section className="panel admin-artworks-panel">
          <div className="admin-artworks-toolbar">
            <label className="admin-artworks-search">
              <Search size={18} />

              <input
                type="search"
                value={searchTerm}
                placeholder="Search title or artist"
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status === "all"
                      ? "All statuses"
                      : capitalize(status)}
                  </option>
                )
              )}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            <button
              className="admin-artworks-refresh"
              type="button"
              onClick={loadArtworks}
              disabled={loading}
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "admin-artworks-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>

          {error && (
            <div className="admin-artworks-error">
              {error}
            </div>
          )}

          <div className="admin-artworks-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Artwork</th>
                  <th>Artist</th>
                  <th>Price</th>
                  <th>Performance</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Moderation</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="admin-artworks-message"
                    >
                      Loading artworks...
                    </td>
                  </tr>
                ) : artworks.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="admin-artworks-message"
                    >
                      No artworks match the selected filters.
                    </td>
                  </tr>
                ) : (
                  artworks.map((artwork) => {
                    const imageUrl =
                      getImageUrl(
                        artwork.image_url ||
                          artwork.image
                      );

                    const status =
                      String(
                        artwork.status ||
                          "draft"
                      ).toLowerCase();

                    const isUpdating =
                      updatingId ===
                      artwork.id;

                    return (
                      <tr key={artwork.id}>
                        <td>
                          <div className="admin-artwork-identity">
                            <Link
                              to={`/artworks/${artwork.id}`}
                              className="admin-artwork-thumb"
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={
                                    artwork.title ||
                                    "Artwork"
                                  }
                                />
                              ) : (
                                <ImageOff
                                  size={20}
                                />
                              )}
                            </Link>

                            <div>
                              <Link
                                to={`/artworks/${artwork.id}`}
                              >
                                <strong>
                                  {artwork.title ||
                                    "Untitled artwork"}
                                </strong>
                              </Link>

                              <span>
                                {artwork.category ||
                                  "Uncategorized"}
                              </span>

                              <small>
                                {artwork.medium ||
                                  "Medium not specified"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="admin-artwork-artist">
                            <strong>
                              {artwork.artist?.name ||
                                artwork.artist_name ||
                                "Unknown artist"}
                            </strong>

                            <span>
                              {artwork.artist?.email ||
                                artwork.artist_email ||
                                "—"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <strong className="admin-artwork-price">
                            {formatPrice(
                              artwork.price
                            )}
                          </strong>
                        </td>

                        <td>
                          <div className="admin-artwork-performance">
                            <span>
                              {Number(
                                artwork.views || 0
                              ).toLocaleString(
                                "en-IN"
                              )}{" "}
                              views
                            </span>

                            <span>
                              {Number(
                                artwork.average_rating ??
                                  artwork.avg_rating ??
                                  0
                              ).toFixed(1)}{" "}
                              rating
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`status ${getStatusClass(
                              status
                            )}`}
                          >
                            {capitalize(status)}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            artwork.created_at
                          )}
                        </td>

                        <td>
                          <div className="admin-artwork-actions">
                            {status ===
                              "draft" && (
                              <button
                                type="button"
                                className="admin-artwork-action publish"
                                disabled={
                                  isUpdating
                                }
                                onClick={() =>
                                  changeStatus(
                                    artwork,
                                    "published"
                                  )
                                }
                              >
                                <CheckCircle2
                                  size={15}
                                />
                                Publish
                              </button>
                            )}

                            {status ===
                              "published" && (
                              <button
                                type="button"
                                className="admin-artwork-action archive"
                                disabled={
                                  isUpdating
                                }
                                onClick={() =>
                                  changeStatus(
                                    artwork,
                                    "archived"
                                  )
                                }
                              >
                                <Archive
                                  size={15}
                                />
                                Archive
                              </button>
                            )}

                            {status ===
                              "archived" && (
                              <button
                                type="button"
                                className="admin-artwork-action restore"
                                disabled={
                                  isUpdating
                                }
                                onClick={() =>
                                  changeStatus(
                                    artwork,
                                    "published"
                                  )
                                }
                              >
                                <RotateCcw
                                  size={15}
                                />
                                Restore
                              </button>
                            )}

                            {status ===
                              "sold" && (
                              <span className="admin-artwork-locked">
                                Locked after sale
                              </span>
                            )}

                            {isUpdating && (
                              <small>
                                Updating...
                              </small>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-artworks-pagination">
            <span>
              Page {page} of {pages}
            </span>

            <div>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      current - 1,
                      1
                    )
                  )
                }
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= pages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      current + 1,
                      pages
                    )
                  )
                }
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}