import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import PageHero from "../components/PageHero";

import api from "../services/api";

import {
  addToCart,
} from "../services/cart";

import {
  getImageUrl,
} from "../utils/imageUrl";


export default function Shop() {
  const navigate = useNavigate();

  const [artworks, setArtworks] =
    useState([]);

  const [format, setFormat] =
    useState("All formats");

  const [price, setPrice] =
    useState("Any price");

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

  // =============================
  // LOAD REAL DATABASE ARTWORKS
  // =============================

  useEffect(() => {
    let active = true;

    const loadArtworks = async () => {
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

        if (!active) {
          return;
        }

        /*
          Only show published artworks
          that have a valid price.

          If your backend already returns
          only published artworks, this
          still works correctly.
        */
        const sellableArtworks =
          receivedArtworks.filter(
            (artwork) => {
              const status =
                String(
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

        setArtworks(
          sellableArtworks
        );
      } catch (requestError) {
        if (!active) {
          return;
        }

        console.error(
          "Failed to load shop artworks:",
          requestError
        );

        setError(
          requestError.response?.data
            ?.error ||
            "Unable to load artworks."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadArtworks();

    return () => {
      active = false;
    };
  }, []);

  // =============================
  // NORMALIZE ARTWORK DETAILS
  // =============================

  const getArtworkFormat = (
    artwork
  ) => {
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
  };

  const getArtistName = (
    artwork
  ) => {
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
  };

  const getArtworkImage = (
    artwork
  ) => {
    return (
      artwork?.image_url ||
      artwork?.image ||
      artwork?.thumbnail_url ||
      artwork?.cover_image ||
      ""
    );
  };

  // =============================
  // FILTER PRODUCTS
  // =============================

  const shownArtworks =
    useMemo(() => {
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

          const matchesFormat =
            applied.format ===
              "All formats" ||
            artworkFormat.includes(
              selectedFormat
            );

          const matchesPrice =
            applied.price ===
              "Any price" ||
            (
              applied.price ===
                "Under ₹5,000" &&
              artworkPrice < 5000
            ) ||
            (
              applied.price ===
                "₹5,000–₹20,000" &&
              artworkPrice >= 5000 &&
              artworkPrice <= 20000
            ) ||
            (
              applied.price ===
                "₹20,000+" &&
              artworkPrice > 20000
            );

          return (
            matchesFormat &&
            matchesPrice
          );
        }
      );
    }, [
      artworks,
      applied,
    ]);

  // =============================
  // ADD REAL ARTWORK TO CART
  // =============================

  const handleAddToCart = (
    artwork
  ) => {
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
      } added to cart.`
    );
  };

  // =============================
  // PAGE STATES
  // =============================

  if (loading) {
    return (
      <>
        <PageHero
          eyebrow="Art marketplace"
          title="Bring the gallery home"
          text="Discover original artworks created by independent artists."
        />

        <section className="container">
          <p className="status-message">
            Loading artworks...
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Art marketplace"
        title="Bring the gallery home"
        text="Discover original artworks created by independent artists."
      />

      <section className="container shop-layout">
        <aside className="filter-panel">
          <h3>
            Shop by
          </h3>

          <label>
            Format

            <select
              value={format}
              onChange={(event) =>
                setFormat(
                  event.target.value
                )
              }
            >
              <option>
                All formats
              </option>

              <option>
                Canvas
              </option>

              <option>
                Print
              </option>

              <option>
                Frame
              </option>

              <option>
                Poster
              </option>

              <option>
                Digital
              </option>

              <option>
                Graphite
              </option>

              <option>
                Ink
              </option>
            </select>
          </label>

          <label>
            Price

            <select
              value={price}
              onChange={(event) =>
                setPrice(
                  event.target.value
                )
              }
            >
              <option>
                Any price
              </option>

              <option>
                Under ₹5,000
              </option>

              <option>
                ₹5,000–₹20,000
              </option>

              <option>
                ₹20,000+
              </option>
            </select>
          </label>

          <button
            className="btn"
            type="button"
            onClick={() =>
              setApplied({
                format,
                price,
              })
            }
          >
            Apply filters
          </button>

          {message && (
            <div className="shop-cart-message">
              <p className="success-message">
                {message}
              </p>

              <button
                className="text-btn"
                type="button"
                onClick={() =>
                  navigate(
                    "/cart"
                  )
                }
              >
                View cart
              </button>
            </div>
          )}
        </aside>

        <div className="shop-results">
          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          {!error &&
            shownArtworks.length ===
              0 && (
              <div className="empty-state">
                <h3>
                  No artworks found
                </h3>

                <p>
                  No published artworks
                  match the selected
                  filters.
                </p>
              </div>
            )}

          <div className="product-grid">
            {shownArtworks.map(
              (artwork) => {
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

                return (
                  <article
                    className="product-card"
                    key={artworkId}
                  >
                    <button
                      className="product-image-button"
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
                          className="product-image"
                          src={finalImage}
                          alt={
                            artwork?.title ||
                            "Artwork"
                          }
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
                        className="product-image-fallback"
                        style={{
                          display:
                            finalImage
                              ? "none"
                              : "flex",
                        }}
                      >
                        Image unavailable
                      </div>
                    </button>

                    <span className="eyebrow">
                      Original artwork
                    </span>

                    <h3>
                      {artwork?.title ||
                        "Untitled Artwork"}
                    </h3>

                    <p className="product-artist">
                      by {artistName}
                    </p>

                    <p>
                      {artwork?.medium ||
                        artwork?.category_name ||
                        "Original artwork"}
                    </p>

                    <div className="product-bottom">
                      <strong>
                        ₹
                        {artworkPrice.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                      <button
                        className="btn small"
                        type="button"
                        onClick={() =>
                          handleAddToCart(
                            artwork
                          )
                        }
                      >
                        Add to cart
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </div>
      </section>
    </>
  );
}