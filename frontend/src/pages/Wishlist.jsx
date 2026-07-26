import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowUpDown,
  Heart,
  Palette,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import ArtworkCard from "../components/ArtworkCard";

import api from "../services/api";

import {
  addToCart,
} from "../services/cart";

import "../styles/Wishlist.css";

export default function Wishlist() {
  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [sortOption, setSortOption] =
    useState("newest");

  const loadWishlist =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await api.get(
            "/users/wishlist"
          );

        const wishlistItems =
          Array.isArray(
            response.data
          )
            ? response.data
            : response.data?.items ||
              response.data
                ?.artworks ||
              [];

        setItems(wishlistItems);
      } catch (requestError) {
        console.error(
          "Failed to load wishlist:",
          requestError
        );

        setError(
          requestError.response?.data
            ?.error ||
            requestError.response?.data
              ?.message ||
            "We could not load your wishlist."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleWishlistChange = ({
    artworkId,
    isSaved,
    artwork,
  }) => {
    if (!isSaved) {
      setItems(
        (currentItems) =>
          currentItems.filter(
            (item) =>
              String(item.id) !==
              String(artworkId)
          )
      );

      return;
    }

    setItems(
      (currentItems) => {
        const alreadyExists =
          currentItems.some(
            (item) =>
              String(item.id) ===
              String(artworkId)
          );

        if (alreadyExists) {
          return currentItems;
        }

        return [
          {
            ...artwork,
            is_wishlisted: true,
          },
          ...currentItems,
        ];
      }
    );
  };

  const handleMoveToCart =
    async (artwork) => {
      /*
       * First remove the artwork from
       * the wishlist database.
       *
       * If this request fails, the item
       * will not be moved.
       */
      await api.delete(
        `/users/wishlist/${artwork.id}`
      );

      /*
       * Then save the artwork inside
       * the localStorage cart.
       */
      addToCart({
        ...artwork,

        product_type:
          artwork.product_type ||
          "artwork",
      });

      /*
       * Finally remove it from the
       * visible Wishlist page.
       */
      setItems(
        (currentItems) =>
          currentItems.filter(
            (item) =>
              String(item.id) !==
              String(artwork.id)
          )
      );
    };

  const getArtistName = (
    artwork
  ) =>
    artwork.artist?.name ||
    artwork.artist?.full_name ||
    artwork.artist_name ||
    artwork.user?.name ||
    artwork.creator_name ||
    "ArtVault Artist";

  const collectionStats =
    useMemo(() => {
      const artists = new Set(
        items.map((artwork) =>
          getArtistName(artwork)
        )
      );

      const totalValue =
        items.reduce(
          (sum, artwork) => {
            const price = Number(
              artwork.price ?? 0
            );

            return (
              sum +
              (Number.isFinite(
                price
              )
                ? price
                : 0)
            );
          },
          0
        );

      const categories =
        new Set(
          items
            .map(
              (artwork) =>
                artwork.category ||
                artwork.art_category ||
                artwork.medium
            )
            .filter(Boolean)
        );

      return {
        artworks: items.length,
        artists: artists.size,
        categories:
          categories.size,
        totalValue,
      };
    }, [items]);

  const visibleItems =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      const filteredItems =
        normalizedSearch
          ? items.filter(
              (artwork) => {
                const searchableText =
                  [
                    artwork.title,
                    getArtistName(
                      artwork
                    ),
                    artwork.category,
                    artwork.art_category,
                    artwork.medium,
                    artwork.description,
                  ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return searchableText.includes(
                  normalizedSearch
                );
              }
            )
          : [...items];

      filteredItems.sort(
        (
          firstArtwork,
          secondArtwork
        ) => {
          const firstPrice =
            Number(
              firstArtwork.price ??
                0
            );

          const secondPrice =
            Number(
              secondArtwork.price ??
                0
            );

          if (
            sortOption ===
            "price-low"
          ) {
            return (
              firstPrice -
              secondPrice
            );
          }

          if (
            sortOption ===
            "price-high"
          ) {
            return (
              secondPrice -
              firstPrice
            );
          }

          if (
            sortOption ===
            "title"
          ) {
            return String(
              firstArtwork.title ||
                ""
            ).localeCompare(
              String(
                secondArtwork.title ||
                  ""
              )
            );
          }

          const firstDate =
            new Date(
              firstArtwork.created_at ||
                firstArtwork
                  .wishlisted_at ||
                0
            ).getTime();

          const secondDate =
            new Date(
              secondArtwork.created_at ||
                secondArtwork
                  .wishlisted_at ||
                0
            ).getTime();

          return (
            secondDate -
            firstDate
          );
        }
      );

      return filteredItems;
    }, [
      items,
      searchTerm,
      sortOption,
    ]);

  const formattedCollectionValue =
    collectionStats.totalValue.toLocaleString(
      "en-IN"
    );

  return (
    <main className="wishlist-page">
      <div className="wishlist-background-glow wishlist-background-glow-one" />

      <div className="wishlist-background-glow wishlist-background-glow-two" />

      <section className="wishlist-container">
        <header className="wishlist-hero">
          <div className="wishlist-hero-copy">
            <div className="wishlist-hero-label">
              <Sparkles
                size={15}
                aria-hidden="true"
              />

              <span>
                Your private gallery
              </span>
            </div>

            <h1>
              Art worth
              <span>
                {" "}
                remembering.
              </span>
            </h1>

            <p>
              A personal collection of
              artworks, artists and ideas
              that captured your
              attention.
            </p>

            <div className="wishlist-hero-actions">
              <Link
                to="/explore"
                className="wishlist-primary-link"
              >
                Explore more art
              </Link>

              {!loading &&
                !error &&
                items.length > 0 && (
                  <span className="wishlist-hero-count">
                    <Heart
                      size={17}
                      fill="currentColor"
                      aria-hidden="true"
                    />

                    {items.length}
                    {items.length === 1
                      ? " saved artwork"
                      : " saved artworks"}
                  </span>
                )}
            </div>
          </div>

          <div
            className="wishlist-hero-art"
            aria-hidden="true"
          >
            <div className="wishlist-art-frame wishlist-art-frame-back">
              <div />
            </div>

            <div className="wishlist-art-frame wishlist-art-frame-front">
              <Heart
                size={52}
                strokeWidth={1.2}
              />

              <span>
                ARTVAULT
              </span>
            </div>
          </div>
        </header>

        {!loading &&
          !error &&
          items.length > 0 && (
            <section
              className="wishlist-statistics"
              aria-label="Wishlist statistics"
            >
              <article className="wishlist-stat-card">
                <div className="wishlist-stat-icon">
                  <Heart
                    size={20}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <strong>
                    {
                      collectionStats.artworks
                    }
                  </strong>

                  <span>
                    Saved artworks
                  </span>
                </div>
              </article>

              <article className="wishlist-stat-card">
                <div className="wishlist-stat-icon">
                  <Users
                    size={20}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <strong>
                    {
                      collectionStats.artists
                    }
                  </strong>

                  <span>
                    Artists discovered
                  </span>
                </div>
              </article>

              <article className="wishlist-stat-card">
                <div className="wishlist-stat-icon">
                  <Palette
                    size={20}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <strong>
                    {
                      collectionStats.categories
                    }
                  </strong>

                  <span>
                    Art categories
                  </span>
                </div>
              </article>

              <article className="wishlist-stat-card wishlist-stat-card-value">
                <div className="wishlist-stat-icon wishlist-value-icon">
                  ₹
                </div>

                <div>
                  <strong>
                    ₹
                    {
                      formattedCollectionValue
                    }
                  </strong>

                  <span>
                    Collection value
                  </span>
                </div>
              </article>
            </section>
          )}

        {loading && (
          <div
            className="wishlist-status"
            role="status"
          >
            <div className="wishlist-loader" />

            <p className="wishlist-status-label">
              CURATING YOUR GALLERY
            </p>

            <h2>
              Loading your collection
            </h2>

            <p>
              Gathering your saved
              artworks.
            </p>
          </div>
        )}

        {!loading && error && (
          <div
            className="wishlist-status wishlist-error"
            role="alert"
          >
            <div className="wishlist-status-icon">
              <Heart size={31} />
            </div>

            <p className="wishlist-status-label">
              SOMETHING WENT WRONG
            </p>

            <h2>
              Wishlist unavailable
            </h2>

            <p>{error}</p>

            <button
              type="button"
              className="wishlist-retry-button"
              onClick={
                loadWishlist
              }
            >
              <RefreshCw
                size={17}
                aria-hidden="true"
              />

              Try again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          items.length === 0 && (
            <div className="wishlist-status wishlist-empty">
              <div className="wishlist-status-icon">
                <Heart size={36} />
              </div>

              <p className="wishlist-status-label">
                YOUR COLLECTION IS EMPTY
              </p>

              <h2>
                Begin your private
                gallery
              </h2>

              <p>
                Explore original
                artworks and select the
                heart whenever something
                speaks to you.
              </p>

              <Link
                to="/explore"
                className="wishlist-explore-button"
              >
                Explore artworks
              </Link>
            </div>
          )}

        {!loading &&
          !error &&
          items.length > 0 && (
            <section
              className="wishlist-gallery-panel"
              aria-label="Saved artworks"
            >
              <div className="wishlist-gallery-header">
                <div>
                  <p className="wishlist-section-label">
                    PRIVATE COLLECTION
                  </p>

                  <h2>
                    Your saved artworks
                  </h2>

                  <p className="wishlist-gallery-description">
                    Revisit the pieces
                    that inspired you and
                    continue shaping your
                    personal collection.
                  </p>
                </div>

                <span className="wishlist-curated-label">
                  Curated by you
                </span>
              </div>

              <div className="wishlist-toolbar">
                <label className="wishlist-search">
                  <Search
                    size={18}
                    aria-hidden="true"
                  />

                  <input
                    type="search"
                    placeholder="Search your collection..."
                    value={
                      searchTerm
                    }
                    onChange={(
                      event
                    ) =>
                      setSearchTerm(
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label className="wishlist-sort">
                  <ArrowUpDown
                    size={17}
                    aria-hidden="true"
                  />

                  <select
                    value={
                      sortOption
                    }
                    onChange={(
                      event
                    ) =>
                      setSortOption(
                        event.target
                          .value
                      )
                    }
                    aria-label="Sort wishlist"
                  >
                    <option value="newest">
                      Recently added
                    </option>

                    <option value="price-low">
                      Price: Low to high
                    </option>

                    <option value="price-high">
                      Price: High to low
                    </option>

                    <option value="title">
                      Title: A to Z
                    </option>
                  </select>
                </label>
              </div>

              {visibleItems.length >
              0 ? (
                <div className="wishlist-grid">
                  {visibleItems.map(
                    (artwork) => (
                      <ArtworkCard
                        key={
                          artwork.id
                        }
                        art={artwork}
                        onWishlistChange={
                          handleWishlistChange
                        }
                        onMoveToCart={
                          handleMoveToCart
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="wishlist-no-results">
                  <Search
                    size={30}
                    aria-hidden="true"
                  />

                  <h3>
                    No matching artwork
                  </h3>

                  <p>
                    Try searching with a
                    different title,
                    artist or category.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setSearchTerm("")
                    }
                  >
                    Clear search
                  </button>
                </div>
              )}
            </section>
          )}
      </section>
    </main>
  );
}