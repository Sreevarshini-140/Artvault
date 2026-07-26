import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import api from "../services/api";

import "../styles/Artists.css";

export default function Artists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadArtists() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/users/artists"
        );

        const receivedArtists =
          Array.isArray(response.data)
            ? response.data
            : response.data?.items || [];

        if (active) {
          setArtists(receivedArtists);
        }
      } catch (requestError) {
        console.error(
          "Failed to load artists:",
          requestError
        );

        if (active) {
          setError(
            requestError.response?.data
              ?.error ||
              requestError.message ||
              "We could not load the artists."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadArtists();

    return () => {
      active = false;
    };
  }, []);

  const validArtists = useMemo(() => {
    return artists.filter(
      (item) =>
        item &&
        item.artist &&
        item.artist.id
    );
  }, [artists]);

  const filteredArtists = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    if (!query) {
      return validArtists;
    }

    return validArtists.filter((item) => {
      const artistName =
        item.artist?.name
          ?.toLowerCase() || "";

      const artistBio =
        item.artist?.bio
          ?.toLowerCase() || "";

      return (
        artistName.includes(query) ||
        artistBio.includes(query)
      );
    });
  }, [searchTerm, validArtists]);

  const totalWorks = useMemo(() => {
    return validArtists.reduce(
      (total, item) =>
        total +
        (Array.isArray(item.artworks)
          ? item.artworks.length
          : 0),
      0
    );
  }, [validArtists]);

  const totalFollowers = useMemo(() => {
    return validArtists.reduce(
      (total, item) =>
        total +
        Number(item.followers || 0),
      0
    );
  }, [validArtists]);

  function getInitials(name = "") {
    const initials = name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return initials || "A";
  }

  function getWorksLabel(count) {
    return `${count} ${
      count === 1 ? "work" : "works"
    }`;
  }

  function getFollowersLabel(count) {
    return `${Number(
      count
    ).toLocaleString("en-IN")} ${
      Number(count) === 1
        ? "follower"
        : "followers"
    }`;
  }

  return (
    <main className="artists-page">
      <section className="artists-hero">
        <div className="artists-hero-glow artists-hero-glow-one" />
        <div className="artists-hero-glow artists-hero-glow-two" />

        <div className="artists-hero-inner">
          <div className="artists-hero-content">
            <div className="artists-eyebrow">
              <Sparkles
                size={15}
                strokeWidth={1.8}
              />

              <span>
                ArtVault creators
              </span>
            </div>

            <h1>
              Artists shaping
              <span> the present.</span>
            </h1>

            <p className="artists-hero-description">
              Discover established
              masters and emerging
              voices whose work defines
              the evolving language of
              contemporary art.
            </p>

            <div className="artists-hero-meta">
              <div className="artists-hero-stat">
                <strong>
                  {loading
                    ? "—"
                    : validArtists.length.toLocaleString(
                        "en-IN"
                      )}
                </strong>

                <span>
                  Featured artists
                </span>
              </div>

              <div className="artists-hero-divider" />

              <div className="artists-hero-stat">
                <strong>
                  {loading
                    ? "—"
                    : totalWorks.toLocaleString(
                        "en-IN"
                      )}
                </strong>

                <span>
                  Published works
                </span>
              </div>

              <div className="artists-hero-divider" />

              <div className="artists-hero-stat">
                <strong>
                  {loading
                    ? "—"
                    : totalFollowers.toLocaleString(
                        "en-IN"
                      )}
                </strong>

                <span>
                  Artist followers
                </span>
              </div>
            </div>
          </div>

          <div className="artists-hero-mark">
            <span>AV</span>
            <small>
              Curated artistic voices
            </small>
          </div>
        </div>
      </section>

      <section className="artists-directory">
        <div className="artists-directory-inner">
          <div className="artists-toolbar">
            <div className="artists-toolbar-heading">
              <span className="artists-section-number">
                01
              </span>

              <div>
                <p>Artist directory</p>

                <h2>
                  Meet the creators
                </h2>
              </div>
            </div>

            <label className="artists-search">
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
                placeholder="Search by artist or style"
                aria-label="Search artists"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  aria-label="Clear artist search"
                >
                  Clear
                </button>
              )}
            </label>
          </div>

          {!loading && !error && (
            <div className="artists-results-row">
              <p>
                Showing{" "}
                <strong>
                  {filteredArtists.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {validArtists.length}
                </strong>{" "}
                artists
              </p>

              <span>
                Curated by ArtVault
              </span>
            </div>
          )}

          {loading && (
            <div
              className="artists-grid"
              aria-label="Loading artists"
            >
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <article
                  className="artist-card artist-card-skeleton"
                  key={index}
                >
                  <div className="artist-skeleton artist-skeleton-avatar" />

                  <div className="artist-skeleton artist-skeleton-title" />

                  <div className="artist-skeleton artist-skeleton-text" />
                  <div className="artist-skeleton artist-skeleton-text artist-skeleton-text-short" />

                  <div className="artist-skeleton artist-skeleton-stats" />

                  <div className="artist-skeleton artist-skeleton-button" />
                </article>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="artists-state">
              <div className="artists-state-icon">
                <UsersRound
                  size={28}
                  strokeWidth={1.6}
                />
              </div>

              <p className="artists-state-label">
                Unable to display artists
              </p>

              <h2>
                The artist directory
                could not be loaded.
              </h2>

              <p>{error}</p>

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
            validArtists.length === 0 && (
              <div className="artists-state">
                <div className="artists-state-icon">
                  <UsersRound
                    size={28}
                    strokeWidth={1.6}
                  />
                </div>

                <p className="artists-state-label">
                  Artist directory
                </p>

                <h2>
                  No artists have been
                  published yet.
                </h2>

                <p>
                  New artistic voices
                  will appear here once
                  their profiles are
                  available.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            validArtists.length > 0 &&
            filteredArtists.length ===
              0 && (
              <div className="artists-state">
                <div className="artists-state-icon">
                  <Search
                    size={28}
                    strokeWidth={1.6}
                  />
                </div>

                <p className="artists-state-label">
                  No matching artists
                </p>

                <h2>
                  We could not find
                  “{searchTerm}”.
                </h2>

                <p>
                  Try searching with a
                  different artist name
                  or artistic style.
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

          {!loading &&
            !error &&
            filteredArtists.length >
              0 && (
              <div className="artists-grid">
                {filteredArtists.map(
                  (item, index) => {
                    const artist =
                      item.artist;

                    const artworks =
                      Array.isArray(
                        item.artworks
                      )
                        ? item.artworks
                        : [];

                    const followerCount =
                      Number(
                        item.followers ||
                          0
                      );

                    const initials =
                      getInitials(
                        artist.name
                      );

                    return (
                      <article
                        className="artist-card"
                        key={artist.id}
                        style={{
                          "--artist-index":
                            index,
                        }}
                      >
                        <div className="artist-card-topline">
                          <span>
                            Artist{" "}
                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          <span className="artist-card-status">
                            Featured
                          </span>
                        </div>

                        <div className="artist-card-identity">
                          <div
                            className={`artist-avatar artist-avatar-${
                              (index %
                                6) +
                              1
                            }`}
                            aria-hidden="true"
                          >
                            <span>
                              {initials}
                            </span>
                          </div>

                          <div className="artist-card-name">
                            <p>
                              Contemporary
                              artist
                            </p>

                            <h3>
                              {artist.name}
                            </h3>
                          </div>
                        </div>

                        <p className="artist-card-bio">
                          {artist.bio ||
                            "A contemporary visual artist exploring distinctive ideas through original creative expression."}
                        </p>

                        <div className="artist-card-stats">
                          <div>
                            <strong>
                              {artworks.length.toLocaleString(
                                "en-IN"
                              )}
                            </strong>

                            <span>
                              {getWorksLabel(
                                artworks.length
                              ).replace(
                                /^\d+\s/,
                                ""
                              )}
                            </span>
                          </div>

                          <div>
                            <strong>
                              {followerCount.toLocaleString(
                                "en-IN"
                              )}
                            </strong>

                            <span>
                              {getFollowersLabel(
                                followerCount
                              ).replace(
                                /^[\d,]+\s/,
                                ""
                              )}
                            </span>
                          </div>
                        </div>

                        <Link
                          className="artist-profile-link"
                          to={`/artists/${artist.id}`}
                          aria-label={`View ${artist.name}'s profile`}
                        >
                          <span>
                            View profile
                          </span>

                          <span className="artist-profile-link-icon">
                            <ArrowRight
                              size={18}
                              strokeWidth={
                                1.8
                              }
                            />
                          </span>
                        </Link>
                      </article>
                    );
                  }
                )}
              </div>
            )}
        </div>
      </section>
    </main>
  );
}