import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Check,
  ChevronDown,
  ImageOff,
  PackageSearch,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

import {
  addToCart,
} from "../services/cart";

import {
  getImageUrl,
} from "../utils/imageUrl";

import "../styles/Shop.css";

const FORMAT_OPTIONS = [
  "All formats",
  "Canvas",
  "Print",
  "Frame",
  "Poster",
  "Digital",
  "Graphite",
  "Ink",
];

const PRICE_OPTIONS = [
  "Any price",
  "Under ₹5,000",
  "₹5,000–₹20,000",
  "₹20,000+",
];

export default function Shop() {
  const navigate = useNavigate();

  const [artworks, setArtworks] =
    useState([]);

  const [format, setFormat] =
    useState("All formats");

  const [price, setPrice] =
    useState("Any price");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [applied, setApplied] =
    useState({
      format: "All formats",
      price: "Any price",
    });

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadArtworks() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/artworks"
        );

        const responseData =
          response.data;

        const receivedArtworks =
          Array.isArray(responseData)
            ? responseData
            : responseData?.artworks ||
              responseData?.items ||
              responseData?.data ||
              [];

        const sellableArtworks =
          receivedArtworks.filter(
            (artwork) => {
              const status = String(
                artwork?.status || ""
              ).toLowerCase();

              const artworkPrice =
                Number(
                  artwork?.price || 0
                );

              const isPublished =
                !status ||
                status === "published" ||
                status === "available";

              const isAvailable =
                artwork?.is_available !==
                  false &&
                artwork?.is_sold !== true;

              return (
                isPublished &&
                isAvailable &&
                artworkPrice > 0
              );
            }
          );

        if (active) {
          setArtworks(
            sellableArtworks
          );
        }
      } catch (requestError) {
        console.error(
          "Failed to load shop artworks:",
          requestError
        );

        if (active) {
          setError(
            requestError.response?.data
              ?.error ||
              "Unable to load artworks."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadArtworks();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setMessage("");
    }, 4500);

    return () => {
      clearTimeout(timer);
    };
  }, [message]);

  function getArtworkFormat(
    artwork
  ) {
    return String(
      artwork?.product_type ||
        artwork?.format ||
        artwork?.medium ||
        artwork?.category?.name ||
        artwork?.category_name ||
        "artwork"
    )
      .trim()
      .toLowerCase();
  }

  function getArtistName(
    artwork
  ) {
    return (
      artwork?.artist_name ||
      artwork?.artist?.name ||
      artwork?.artist?.full_name ||
      artwork?.artist?.username ||
      artwork?.user?.name ||
      artwork?.user?.full_name ||
      artwork?.creator_name ||
      "ArtVault Artist"
    );
  }

  function getArtworkImage(
    artwork
  ) {
    return (
      artwork?.image_url ||
      artwork?.image ||
      artwork?.thumbnail_url ||
      artwork?.cover_image ||
      ""
    );
  }

  function getArtworkMedium(
    artwork
  ) {
    return (
      artwork?.medium ||
      artwork?.category?.name ||
      artwork?.category_name ||
      artwork?.product_type ||
      "Original artwork"
    );
  }

  const shownArtworks =
    useMemo(() => {
      const query = searchTerm
        .trim()
        .toLowerCase();

      return artworks.filter(
        (artwork) => {
          const artworkFormat =
            getArtworkFormat(
              artwork
            );

          const artworkPrice =
            Number(
              artwork?.price || 0
            );

          const selectedFormat =
            applied.format
              .toLowerCase()
              .trim();

          const title = String(
            artwork?.title || ""
          ).toLowerCase();

          const artistName =
            getArtistName(
              artwork
            ).toLowerCase();

          const medium =
            getArtworkMedium(
              artwork
            ).toLowerCase();

          const matchesSearch =
            !query ||
            title.includes(query) ||
            artistName.includes(query) ||
            medium.includes(query);

          const matchesFormat =
            applied.format ===
              "All formats" ||
            artworkFormat.includes(
              selectedFormat
            );

          const matchesPrice =
            applied.price ===
              "Any price" ||
            (applied.price ===
              "Under ₹5,000" &&
              artworkPrice < 5000) ||
            (applied.price ===
              "₹5,000–₹20,000" &&
              artworkPrice >= 5000 &&
              artworkPrice <= 20000) ||
            (applied.price ===
              "₹20,000+" &&
              artworkPrice > 20000);

          return (
            matchesSearch &&
            matchesFormat &&
            matchesPrice
          );
        }
      );
    }, [
      artworks,
      applied,
      searchTerm,
    ]);

  const highestPrice =
    useMemo(() => {
      if (artworks.length === 0) {
        return 0;
      }

      return Math.max(
        ...artworks.map((artwork) =>
          Number(
            artwork?.price || 0
          )
        )
      );
    }, [artworks]);

  const filtersActive =
    applied.format !==
      "All formats" ||
    applied.price !==
      "Any price" ||
    searchTerm.trim() !== "";

  function applyFilters() {
    setApplied({
      format,
      price,
    });
  }

  function resetFilters() {
    setFormat("All formats");
    setPrice("Any price");
    setApplied({
      format: "All formats",
      price: "Any price",
    });
    setSearchTerm("");
  }

  function handleAddToCart(
    artwork
  ) {
    const artworkId =
      artwork?.id ||
      artwork?.artwork_id;

    const artistName =
      getArtistName(
        artwork
      );

    const rawImage =
      getArtworkImage(
        artwork
      );

    addToCart({
      id: artworkId,
      artwork_id: artworkId,

      title:
        artwork?.title ||
        "Untitled Artwork",

      price: Number(
        artwork?.price || 0
      ),

      product_type:
        getArtworkFormat(
          artwork
        ),

      image_url: rawImage,

      artist_name:
        artistName,

      artist: {
        name: artistName,
      },

      quantity: 1,
    });

    setMessage(
      `${
        artwork?.title ||
        "Artwork"
      } added to your cart.`
    );
  }

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <div className="shop-hero-glow shop-hero-glow-one" />
        <div className="shop-hero-glow shop-hero-glow-two" />

        <div className="shop-hero-inner">
          <div className="shop-hero-content">
            <div className="shop-eyebrow">
              <Sparkles
                size={15}
                strokeWidth={1.8}
              />

              <span>
                Art marketplace
              </span>
            </div>

            <h1>
              Bring the gallery
              <span> home.</span>
            </h1>

            <p>
              Discover original works
              created by independent
              artists and collect art
              that makes your space
              distinctly yours.
            </p>

            <div className="shop-hero-stats">
              <div>
                <strong>
                  {loading
                    ? "—"
                    : artworks.length.toLocaleString(
                        "en-IN"
                      )}
                </strong>

                <span>
                  Available works
                </span>
              </div>

              <div className="shop-stat-divider" />

              <div>
                <strong>
                  {loading
                    ? "—"
                    : shownArtworks.length.toLocaleString(
                        "en-IN"
                      )}
                </strong>

                <span>
                  Curated results
                </span>
              </div>

              <div className="shop-stat-divider" />

              <div>
                <strong>
                  {loading ||
                  highestPrice === 0
                    ? "—"
                    : `₹${highestPrice.toLocaleString(
                        "en-IN"
                      )}`}
                </strong>

                <span>
                  Highest value
                </span>
              </div>
            </div>
          </div>

          <div className="shop-hero-seal">
            <div className="shop-seal-ring">
              <ShoppingBag
                size={38}
                strokeWidth={1.3}
              />

              <strong>
                AV
              </strong>

              <span>
                Original works
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="shop-directory">
        <div className="shop-directory-inner">
          <div className="shop-heading-row">
            <div className="shop-heading">
              <span>
                01
              </span>

              <div>
                <p>
                  The collection
                </p>

                <h2>
                  Shop original art
                </h2>
              </div>
            </div>

            <label className="shop-search">
              <Search
                size={19}
                strokeWidth={1.8}
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search artwork, artist or medium"
                aria-label="Search shop artworks"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                >
                  Clear
                </button>
              )}
            </label>
          </div>

          <div className="shop-content">
            <aside className="shop-filter-panel">
              <div className="shop-filter-header">
                <div>
                  <SlidersHorizontal
                    size={18}
                    strokeWidth={1.8}
                  />

                  <span>
                    Refine collection
                  </span>
                </div>

                {filtersActive && (
                  <button
                    type="button"
                    className="shop-reset-button"
                    onClick={
                      resetFilters
                    }
                  >
                    <RotateCcw
                      size={14}
                    />

                    Reset
                  </button>
                )}
              </div>

              <div className="shop-filter-group">
                <label
                  htmlFor="shop-format"
                >
                  Format
                </label>

                <div className="shop-select-wrap">
                  <select
                    id="shop-format"
                    value={format}
                    onChange={(event) =>
                      setFormat(
                        event.target
                          .value
                      )
                    }
                  >
                    {FORMAT_OPTIONS.map(
                      (option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={17}
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="shop-filter-group">
                <label
                  htmlFor="shop-price"
                >
                  Price
                </label>

                <div className="shop-select-wrap">
                  <select
                    id="shop-price"
                    value={price}
                    onChange={(event) =>
                      setPrice(
                        event.target
                          .value
                      )
                    }
                  >
                    {PRICE_OPTIONS.map(
                      (option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={17}
                    aria-hidden="true"
                  />
                </div>
              </div>

              <button
                className="shop-apply-button"
                type="button"
                onClick={applyFilters}
              >
                <span>
                  Apply filters
                </span>

                <ArrowRight
                  size={17}
                />
              </button>

              <div className="shop-filter-note">
                <Sparkles
                  size={16}
                />

                <p>
                  Every listed piece is
                  an original work
                  published by an
                  ArtVault artist.
                </p>
              </div>
            </aside>

            <div className="shop-results">
              <div className="shop-results-header">
                <p>
                  Showing{" "}
                  <strong>
                    {shownArtworks.length}
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {artworks.length}
                  </strong>{" "}
                  artworks
                </p>

                <span>
                  Curated by ArtVault
                </span>
              </div>

              {message && (
                <div className="shop-cart-notice">
                  <div>
                    <span className="shop-cart-notice-icon">
                      <Check
                        size={16}
                        strokeWidth={2.2}
                      />
                    </span>

                    <p>{message}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/cart")
                    }
                  >
                    View cart
                    <ArrowRight
                      size={16}
                    />
                  </button>
                </div>
              )}

              {loading && (
                <div className="shop-product-grid">
                  {Array.from({
                    length: 6,
                  }).map(
                    (_, index) => (
                      <article
                        className="shop-product-card shop-product-skeleton-card"
                        key={index}
                      >
                        <div className="shop-skeleton shop-skeleton-image" />

                        <div className="shop-skeleton shop-skeleton-label" />

                        <div className="shop-skeleton shop-skeleton-title" />

                        <div className="shop-skeleton shop-skeleton-text" />

                        <div className="shop-skeleton shop-skeleton-footer" />
                      </article>
                    )
                  )}
                </div>
              )}

              {!loading && error && (
                <div className="shop-state">
                  <div className="shop-state-icon">
                    <PackageSearch
                      size={29}
                      strokeWidth={1.5}
                    />
                  </div>

                  <p className="shop-state-label">
                    Collection unavailable
                  </p>

                  <h2>
                    The shop could not be
                    loaded.
                  </h2>

                  <p>
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      window.location.reload()
                    }
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loading &&
                !error &&
                shownArtworks.length ===
                  0 && (
                  <div className="shop-state">
                    <div className="shop-state-icon">
                      <Search
                        size={28}
                        strokeWidth={1.5}
                      />
                    </div>

                    <p className="shop-state-label">
                      No matching works
                    </p>

                    <h2>
                      No artworks match
                      your filters.
                    </h2>

                    <p>
                      Adjust the format,
                      price range, or
                      search phrase to
                      explore more of the
                      collection.
                    </p>

                    <button
                      type="button"
                      onClick={
                        resetFilters
                      }
                    >
                      Reset filters
                    </button>
                  </div>
                )}

              {!loading &&
                !error &&
                shownArtworks.length >
                  0 && (
                  <div className="shop-product-grid">
                    {shownArtworks.map(
                      (
                        artwork,
                        index
                      ) => {
                        const artworkId =
                          artwork?.id ||
                          artwork?.artwork_id;

                        const rawImage =
                          getArtworkImage(
                            artwork
                          );

                        const finalImage =
                          rawImage
                            ? getImageUrl(
                                rawImage
                              )
                            : "";

                        const artistName =
                          getArtistName(
                            artwork
                          );

                        const artworkPrice =
                          Number(
                            artwork?.price ||
                              0
                          );

                        const artworkMedium =
                          getArtworkMedium(
                            artwork
                          );

                        return (
                          <article
                            className="shop-product-card"
                            key={
                              artworkId
                            }
                            style={{
                              "--shop-card-index":
                                index,
                            }}
                          >
                            <button
                              className="shop-product-image-button"
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/artworks/${artworkId}`
                                )
                              }
                              aria-label={`View ${
                                artwork?.title ||
                                "artwork"
                              }`}
                            >
                              {finalImage ? (
                                <img
                                  className="shop-product-image"
                                  src={
                                    finalImage
                                  }
                                  alt={
                                    artwork?.title ||
                                    "Artwork"
                                  }
                                  loading="lazy"
                                  onError={(
                                    event
                                  ) => {
                                    event.currentTarget.style.display =
                                      "none";

                                    const fallback =
                                      event
                                        .currentTarget
                                        .nextElementSibling;

                                    if (
                                      fallback
                                    ) {
                                      fallback.style.display =
                                        "flex";
                                    }
                                  }}
                                />
                              ) : null}

                              <div
                                className="shop-product-image-fallback"
                                style={{
                                  display:
                                    finalImage
                                      ? "none"
                                      : "flex",
                                }}
                              >
                                <ImageOff
                                  size={27}
                                  strokeWidth={
                                    1.5
                                  }
                                />

                                <span>
                                  Image
                                  unavailable
                                </span>
                              </div>

                              <div className="shop-product-image-overlay">
                                <span>
                                  View artwork
                                </span>

                                <ArrowRight
                                  size={18}
                                />
                              </div>

                              <span className="shop-product-number">
                                {String(
                                  index + 1
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </span>
                            </button>

                            <div className="shop-product-info">
                              <div className="shop-product-meta">
                                <span>
                                  Original
                                  artwork
                                </span>

                                <span>
                                  {
                                    artworkMedium
                                  }
                                </span>
                              </div>

                              <button
                                type="button"
                                className="shop-product-title-button"
                                onClick={() =>
                                  navigate(
                                    `/artworks/${artworkId}`
                                  )
                                }
                              >
                                <h3>
                                  {artwork?.title ||
                                    "Untitled Artwork"}
                                </h3>
                              </button>

                              <p className="shop-product-artist">
                                By{" "}
                                <strong>
                                  {
                                    artistName
                                  }
                                </strong>
                              </p>

                              <div className="shop-product-bottom">
                                <div className="shop-product-price">
                                  <span>
                                    Price
                                  </span>

                                  <strong>
                                    ₹
                                    {artworkPrice.toLocaleString(
                                      "en-IN"
                                    )}
                                  </strong>
                                </div>

                                <button
                                  className="shop-cart-button"
                                  type="button"
                                  onClick={() =>
                                    handleAddToCart(
                                      artwork
                                    )
                                  }
                                  aria-label={`Add ${
                                    artwork?.title ||
                                    "artwork"
                                  } to cart`}
                                >
                                  <ShoppingBag
                                    size={18}
                                    strokeWidth={
                                      1.8
                                    }
                                  />

                                  <span>
                                    Add to cart
                                  </span>
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}