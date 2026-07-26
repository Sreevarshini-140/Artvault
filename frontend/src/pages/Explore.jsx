import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Crown,
  Globe2,
  Grid2X2,
  Headphones,
  List,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import ArtworkCard from "../components/ArtworkCard";
import api from "../services/api";

import "../styles/Explore.css";

const CATEGORY_OPTIONS = [
  "All Categories",
  "Painting",
  "Digital Art",
  "Photography",
  "Sculpture",
  "Illustration",
  "Mixed Media",
];

const AVAILABILITY_OPTIONS = [
  {
    key: "available",
    label: "Available",
  },
  {
    key: "auction",
    label: "On Auction",
  },
  {
    key: "sold",
    label: "Sold",
  },
];

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest First",
  },
  {
    value: "oldest",
    label: "Oldest First",
  },
  {
    value: "price_low",
    label: "Price: Low to High",
  },
  {
    value: "price_high",
    label: "Price: High to Low",
  },
  {
    value: "popular",
    label: "Most Popular",
  },
  {
    value: "rating",
    label: "Highest Rated",
  },
];

const TRUST_ITEMS = [
  {
    id: "secure",
    title: "Secure Payments",
    description: "Protected payment processing",
    icon: ShieldCheck,
  },
  {
    id: "shipping",
    title: "Worldwide Shipping",
    description: "Delivering art globally",
    icon: Globe2,
  },
  {
    id: "authenticity",
    title: "Authenticity Guaranteed",
    description: "Original artworks only",
    icon: BadgeCheck,
  },
  {
    id: "support",
    title: "Dedicated Support",
    description: "We're here to help",
    icon: Headphones,
  },
];

const ITEMS_PER_PAGE = 9;

function getArtworkItems(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (
    Array.isArray(
      responseData?.items
    )
  ) {
    return responseData.items;
  }

  if (
    Array.isArray(
      responseData?.artworks
    )
  ) {
    return responseData.artworks;
  }

  return [];
}

function getNumericValue(value) {
  const numericValue =
    Number(value);

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : 0;
}

function getDateValue(artwork) {
  const artworkDate = new Date(
    artwork.created_at ||
      artwork.updated_at ||
      0
  );

  const timestamp =
    artworkDate.getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}

function getCategory(artwork) {
  return (
    artwork.category ||
    artwork.art_category ||
    artwork.medium ||
    "Uncategorized"
  );
}

function getAvailability(artwork) {
  const rawStatus = String(
    artwork.availability ||
      artwork.sale_status ||
      artwork.status ||
      ""
  ).toLowerCase();

  if (
    artwork.is_sold ||
    rawStatus === "sold"
  ) {
    return "sold";
  }

  if (
    artwork.is_auction ||
    rawStatus === "auction" ||
    rawStatus === "on auction"
  ) {
    return "auction";
  }

  return "available";
}

function normaliseText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export default function Explore() {
  const [artworks, setArtworks] =
    useState([]);

  const [searchInput, setSearchInput] =
    useState("");

  const [activeSearch, setActiveSearch] =
    useState("");

  const [category, setCategory] =
    useState("All Categories");

  const [sortBy, setSortBy] =
    useState("newest");

  const [minimumPrice, setMinimumPrice] =
    useState("");

  const [maximumPrice, setMaximumPrice] =
    useState("");

  const [
    availabilityFilters,
    setAvailabilityFilters,
  ] = useState({
    available: true,
    auction: false,
    sold: false,
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const [categoryOpen, setCategoryOpen] =
    useState(true);

  const [priceOpen, setPriceOpen] =
    useState(true);

  const [
    availabilityOpen,
    setAvailabilityOpen,
  ] = useState(true);

  const [viewMode, setViewMode] =
    useState("grid");

  const [currentPage, setCurrentPage] =
    useState(1);

  const loadArtworks =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/artworks"
        );

        setArtworks(
          getArtworkItems(response.data)
        );
      } catch (requestError) {
        console.error(
          "Failed to load artworks:",
          requestError
        );

        const backendMessage =
          requestError.response?.data
            ?.error ||
          requestError.response?.data
            ?.message ||
          requestError.response?.data
            ?.msg ||
          requestError.message;

        setError(
          backendMessage ||
            "Failed to load artworks."
        );

        setArtworks([]);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadArtworks();
  }, [loadArtworks]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeSearch,
    category,
    sortBy,
    minimumPrice,
    maximumPrice,
    availabilityFilters,
  ]);

  const filteredArtworks =
    useMemo(() => {
      const searchValue =
        normaliseText(
          activeSearch
        );

      const minimum =
        minimumPrice === ""
          ? null
          : Number(minimumPrice);

      const maximum =
        maximumPrice === ""
          ? null
          : Number(maximumPrice);

      const selectedAvailability =
        Object.entries(
          availabilityFilters
        )
          .filter(
            ([, isSelected]) =>
              isSelected
          )
          .map(([key]) => key);

      const filtered =
        artworks.filter((artwork) => {
          const price =
            getNumericValue(
              artwork.price
            );

          const artworkCategory =
            getCategory(artwork);

          const artworkAvailability =
            getAvailability(artwork);

          const searchableText = [
            artwork.title,
            artwork.medium,
            artwork.category,
            artwork.art_category,
            artwork.artist_name,
            artwork.artist?.name,
            artwork.artist?.full_name,
            artwork.user?.name,
          ]
            .map(normaliseText)
            .join(" ");

          if (
            searchValue &&
            !searchableText.includes(
              searchValue
            )
          ) {
            return false;
          }

          if (
            minimum !== null &&
            Number.isFinite(minimum) &&
            price < minimum
          ) {
            return false;
          }

          if (
            maximum !== null &&
            Number.isFinite(maximum) &&
            price > maximum
          ) {
            return false;
          }

          if (
            category !==
              "All Categories" &&
            normaliseText(
              artworkCategory
            ) !==
              normaliseText(category)
          ) {
            return false;
          }

          if (
            selectedAvailability.length >
              0 &&
            !selectedAvailability.includes(
              artworkAvailability
            )
          ) {
            return false;
          }

          return true;
        });

      return [...filtered].sort(
        (first, second) => {
          if (
            sortBy === "price_low"
          ) {
            return (
              getNumericValue(
                first.price
              ) -
              getNumericValue(
                second.price
              )
            );
          }

          if (
            sortBy === "price_high"
          ) {
            return (
              getNumericValue(
                second.price
              ) -
              getNumericValue(
                first.price
              )
            );
          }

          if (
            sortBy === "popular"
          ) {
            const firstPopularity =
              getNumericValue(
                first.views_count ??
                  first.views
              ) +
              getNumericValue(
                first.wishlist_count ??
                  first.wishlists
              );

            const secondPopularity =
              getNumericValue(
                second.views_count ??
                  second.views
              ) +
              getNumericValue(
                second.wishlist_count ??
                  second.wishlists
              );

            return (
              secondPopularity -
              firstPopularity
            );
          }

          if (
            sortBy === "rating"
          ) {
            return (
              getNumericValue(
                second.average_rating ??
                  second.rating
              ) -
              getNumericValue(
                first.average_rating ??
                  first.rating
              )
            );
          }

          if (
            sortBy === "oldest"
          ) {
            return (
              getDateValue(first) -
              getDateValue(second)
            );
          }

          return (
            getDateValue(second) -
            getDateValue(first)
          );
        }
      );
    }, [
      artworks,
      activeSearch,
      category,
      sortBy,
      minimumPrice,
      maximumPrice,
      availabilityFilters,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredArtworks.length /
        ITEMS_PER_PAGE
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedArtworks =
    useMemo(() => {
      const startIndex =
        (safeCurrentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredArtworks.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
      );
    }, [
      filteredArtworks,
      safeCurrentPage,
    ]);

  const visiblePageNumbers =
    useMemo(() => {
      if (totalPages <= 5) {
        return Array.from(
          {
            length: totalPages,
          },
          (_, index) =>
            index + 1
        );
      }

      if (
        safeCurrentPage <= 3
      ) {
        return [
          1,
          2,
          3,
          "...",
          totalPages,
        ];
      }

      if (
        safeCurrentPage >=
        totalPages - 2
      ) {
        return [
          1,
          "...",
          totalPages - 2,
          totalPages - 1,
          totalPages,
        ];
      }

      return [
        1,
        "...",
        safeCurrentPage,
        "...",
        totalPages,
      ];
    }, [
      safeCurrentPage,
      totalPages,
    ]);

  const handleSearchSubmit = (
    event
  ) => {
    event.preventDefault();

    setActiveSearch(
      searchInput.trim()
    );
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setActiveSearch("");

    setCategory(
      "All Categories"
    );

    setSortBy("newest");
    setMinimumPrice("");
    setMaximumPrice("");

    setAvailabilityFilters({
      available: true,
      auction: false,
      sold: false,
    });
  };

  const toggleAvailability = (
    filterName
  ) => {
    setAvailabilityFilters(
      (previous) => ({
        ...previous,
        [filterName]:
          !previous[filterName],
      })
    );
  };

  const hasActiveFilters =
    Boolean(activeSearch) ||
    category !==
      "All Categories" ||
    minimumPrice !== "" ||
    maximumPrice !== "" ||
    sortBy !== "newest" ||
    !availabilityFilters.available ||
    availabilityFilters.auction ||
    availabilityFilters.sold;

  return (
    <main className="explore-page">
      <section className="explore-hero">
        <div className="explore-hero-overlay" />

        <div className="explore-hero-content">
          <p className="explore-eyebrow">
            Discover extraordinary art
          </p>

          <h1>
            Explore. Inspire.{" "}
            <span>Collect.</span>
          </h1>

          <p className="explore-description">
            Browse original artworks from
            talented artists and discover
            the perfect piece that speaks
            to you.
          </p>

          <form
            className="explore-search"
            onSubmit={
              handleSearchSubmit
            }
          >
            <div className="explore-search-field">
              <Search
                size={20}
                aria-hidden="true"
              />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                placeholder="Search artworks, artists or mediums..."
                aria-label="Search artworks"
              />

              {searchInput && (
                <button
                  type="button"
                  className="explore-clear-search"
                  onClick={
                    handleClearSearch
                  }
                  aria-label="Clear search"
                >
                  <X
                    size={16}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>

            <button
              className="explore-search-button"
              type="submit"
              disabled={loading}
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="explore-marketplace">
        <button
          type="button"
          className="mobile-filter-button"
          onClick={() =>
            setFiltersOpen(
              (previous) =>
                !previous
            )
          }
        >
          <SlidersHorizontal
            size={18}
            aria-hidden="true"
          />

          {filtersOpen
            ? "Hide Filters"
            : "Show Filters"}
        </button>

        <div className="explore-market-layout">
          <aside
            className={`explore-sidebar ${
              filtersOpen
                ? "is-open"
                : ""
            }`}
          >
            <div className="explore-filter-title">
              <div>
                <SlidersHorizontal
                  size={19}
                  aria-hidden="true"
                />

                <span>Filters</span>
              </div>

              <button
                type="button"
                className="clear-all-button"
                onClick={
                  handleResetFilters
                }
                disabled={
                  !hasActiveFilters
                }
              >
                Clear All
              </button>
            </div>

            <div className="filter-divider" />

            <div className="filter-section">
              <button
                type="button"
                className="filter-section-heading"
                onClick={() =>
                  setCategoryOpen(
                    (previous) =>
                      !previous
                  )
                }
              >
                <span>Category</span>

                <ChevronDown
                  size={16}
                  className={
                    categoryOpen
                      ? "is-open"
                      : ""
                  }
                  aria-hidden="true"
                />
              </button>

              {categoryOpen && (
                <div className="category-list">
                  {CATEGORY_OPTIONS.map(
                    (option) => (
                      <label
                        className="radio-filter"
                        key={option}
                      >
                        <input
                          type="radio"
                          name="art-category"
                          value={option}
                          checked={
                            category ===
                            option
                          }
                          onChange={() =>
                            setCategory(
                              option
                            )
                          }
                        />

                        <span className="custom-radio" />

                        <span>
                          {option}
                        </span>
                      </label>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="filter-divider" />

            <div className="filter-section">
              <button
                type="button"
                className="filter-section-heading"
                onClick={() =>
                  setPriceOpen(
                    (previous) =>
                      !previous
                  )
                }
              >
                <span>Price Range</span>

                <ChevronDown
                  size={16}
                  className={
                    priceOpen
                      ? "is-open"
                      : ""
                  }
                  aria-hidden="true"
                />
              </button>

              {priceOpen && (
                <>
                  <div className="price-input-row">
                    <label className="price-input">
                      <span>₹</span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          minimumPrice
                        }
                        onChange={(
                          event
                        ) =>
                          setMinimumPrice(
                            event.target
                              .value
                          )
                        }
                        placeholder="Min"
                      />
                    </label>

                    <label className="price-input">
                      <span>₹</span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          maximumPrice
                        }
                        onChange={(
                          event
                        ) =>
                          setMaximumPrice(
                            event.target
                              .value
                          )
                        }
                        placeholder="Max"
                      />
                    </label>
                  </div>

                  <div className="price-range-line" />

                  <div className="price-scale-labels">
                    <span>₹0</span>
                    <span>
                      ₹1,00,000+
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="filter-divider" />

            <div className="filter-section">
              <button
                type="button"
                className="filter-section-heading"
                onClick={() =>
                  setAvailabilityOpen(
                    (previous) =>
                      !previous
                  )
                }
              >
                <span>
                  Availability
                </span>

                <ChevronDown
                  size={16}
                  className={
                    availabilityOpen
                      ? "is-open"
                      : ""
                  }
                  aria-hidden="true"
                />
              </button>

              {availabilityOpen && (
                <div className="availability-list">
                  {AVAILABILITY_OPTIONS.map(
                    (option) => (
                      <label
                        className="checkbox-filter"
                        key={option.key}
                      >
                        <input
                          type="checkbox"
                          checked={
                            availabilityFilters[
                              option.key
                            ]
                          }
                          onChange={() =>
                            toggleAvailability(
                              option.key
                            )
                          }
                        />

                        <span className="custom-checkbox">
                          ✓
                        </span>

                        <span>
                          {option.label}
                        </span>
                      </label>
                    )
                  )}
                </div>
              )}
            </div>

            <button
              className="apply-filter-button"
              type="button"
              onClick={() =>
                setFiltersOpen(false)
              }
            >
              Apply Filters
            </button>

            <button
              className="reset-filter-button"
              type="button"
              onClick={
                handleResetFilters
              }
              disabled={
                !hasActiveFilters
              }
            >
              <RotateCcw
                size={15}
                aria-hidden="true"
              />

              Reset
            </button>
          </aside>

          <section className="explore-results">
            <div className="explore-results-toolbar">
              <div className="results-count">
                <strong>
                  {
                    filteredArtworks.length
                  }
                </strong>

                <span>
                  {filteredArtworks.length ===
                  1
                    ? "Artwork Found"
                    : "Artworks Found"}
                </span>
              </div>

              <div className="results-actions">
                <label className="sort-control">
                  <span>Sort by:</span>

                  <select
                    value={sortBy}
                    onChange={(
                      event
                    ) =>
                      setSortBy(
                        event.target
                          .value
                      )
                    }
                  >
                    {SORT_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                  />
                </label>

                <div className="view-toggle">
                  <button
                    type="button"
                    className={
                      viewMode ===
                      "grid"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setViewMode(
                        "grid"
                      )
                    }
                    aria-label="Grid view"
                    aria-pressed={
                      viewMode ===
                      "grid"
                    }
                  >
                    <Grid2X2
                      size={18}
                      aria-hidden="true"
                    />
                  </button>

                  <button
                    type="button"
                    className={
                      viewMode ===
                      "list"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setViewMode(
                        "list"
                      )
                    }
                    aria-label="List view"
                    aria-pressed={
                      viewMode ===
                      "list"
                    }
                  >
                    <List
                      size={19}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </div>

            {activeSearch && (
              <div className="active-search-banner">
                <span>
                  Showing results for
                  “{activeSearch}”
                </span>

                <button
                  type="button"
                  onClick={
                    handleClearSearch
                  }
                >
                  Clear
                </button>
              </div>
            )}

            {loading && (
              <div className="explore-state">
                <div className="explore-spinner" />

                <h2>
                  Curating the collection
                </h2>

                <p>
                  Loading available
                  artworks...
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="explore-state error-state">
                <h2>
                  Collection unavailable
                </h2>

                <p>{error}</p>

                <button
                  type="button"
                  onClick={
                    loadArtworks
                  }
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              filteredArtworks.length ===
                0 && (
                <div className="explore-state">
                  <h2>
                    No artworks found
                  </h2>

                  <p>
                    Try another search or
                    reset the selected
                    filters.
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleResetFilters
                    }
                  >
                    Reset Filters
                  </button>
                </div>
              )}

            {!loading &&
              !error &&
              paginatedArtworks.length >
                0 && (
                <>
                  <div
                    className={`explore-art-grid ${
                      viewMode ===
                      "list"
                        ? "is-list-view"
                        : ""
                    }`}
                  >
                    {paginatedArtworks.map(
                      (artwork) => (
                        <ArtworkCard
                          key={
                            artwork.id
                          }
                          art={
                            artwork
                          }
                        />
                      )
                    )}
                  </div>

                  {totalPages > 1 && (
                    <nav
                      className="explore-pagination"
                      aria-label="Artwork pagination"
                    >
                      <button
                        type="button"
                        className="pagination-arrow"
                        disabled={
                          safeCurrentPage ===
                          1
                        }
                        onClick={() =>
                          setCurrentPage(
                            (page) =>
                              Math.max(
                                1,
                                page - 1
                              )
                          )
                        }
                        aria-label="Previous page"
                      >
                        ‹
                      </button>

                      {visiblePageNumbers.map(
                        (
                          page,
                          index
                        ) =>
                          page === "..." ? (
                            <span
                              className="pagination-dots"
                              key={`dots-${index}`}
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              type="button"
                              key={page}
                              className={
                                safeCurrentPage ===
                                page
                                  ? "active"
                                  : ""
                              }
                              onClick={() =>
                                setCurrentPage(
                                  page
                                )
                              }
                            >
                              {page}
                            </button>
                          )
                      )}

                      <button
                        type="button"
                        className="pagination-arrow"
                        disabled={
                          safeCurrentPage ===
                          totalPages
                        }
                        onClick={() =>
                          setCurrentPage(
                            (page) =>
                              Math.min(
                                totalPages,
                                page + 1
                              )
                          )
                        }
                        aria-label="Next page"
                      >
                        ›
                      </button>
                    </nav>
                  )}
                </>
              )}
          </section>

          <aside className="explore-promo-column">
            <article className="support-artists-card">
              <Crown
                className="support-card-icon"
                size={26}
                aria-hidden="true"
              />

              <h2>
                Support artists.
                <br />
                Own a masterpiece.
              </h2>

              <p>
                Every purchase empowers
                creativity, passion and
                independent artists.
              </p>

              <Link
                className="support-card-link"
                to="/collections"
              >
                Explore Collections

                <ArrowRight
                  size={17}
                  aria-hidden="true"
                />
              </Link>
            </article>

            <article className="trust-card">
              {TRUST_ITEMS.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <div
                      className="trust-item"
                      key={item.id}
                    >
                      <div className="trust-icon">
                        <Icon
                          size={20}
                          aria-hidden="true"
                        />
                      </div>

                      <div>
                        <h3>
                          {item.title}
                        </h3>

                        <p>
                          {
                            item.description
                          }
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}