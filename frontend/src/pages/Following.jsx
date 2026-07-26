import {
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  Heart,
  Image,
  Loader2,
  UserRoundCheck,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

import "../styles/Following.css";

export default function Following() {
  const navigate = useNavigate();

  const [artists, setArtists] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [message, setMessage] =
    useState("");
  const [unfollowingId, setUnfollowingId] =
    useState(null);

  useEffect(() => {
    loadFollowing();
  }, []);

  const loadFollowing = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.get(
        "/users/following"
      );

      setArtists(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }

      setMessage(
        error.response?.data?.error ||
          error.message ||
          "Failed to load followed artists."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (
    artistId
  ) => {
    if (unfollowingId) {
      return;
    }

    setUnfollowingId(artistId);
    setMessage("");

    try {
      await api.delete(
        `/users/follow/${artistId}`
      );

      setArtists((currentArtists) =>
        currentArtists.filter(
          (item) =>
            Number(item.artist.id) !==
            Number(artistId)
        )
      );

      setMessage(
        "Artist removed from your following list."
      );
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to unfollow artist."
      );
    } finally {
      setUnfollowingId(null);
    }
  };

  if (loading) {
    return (
      <section className="av-following-page">
        <div className="av-following-loading">
          <Loader2
            size={28}
            className="av-following-spinner"
          />

          <p>Loading followed artists…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="av-following-page">
      <div className="av-following-glow av-following-glow-left" />
      <div className="av-following-glow av-following-glow-right" />

      <div className="av-following-container">
        <header className="av-following-header">
          <div>
            <p className="av-following-eyebrow">
              YOUR COLLECTION
            </p>

            <h1>Artists You Follow</h1>

            <p className="av-following-description">
              Keep up with the artists whose
              work inspires you and discover
              their latest published pieces.
            </p>
          </div>

          <div className="av-following-count">
            <UserRoundCheck size={17} />

            {artists.length}{" "}
            {artists.length === 1
              ? "artist"
              : "artists"}
          </div>
        </header>

        {message && (
          <p className="av-following-message">
            {message}
          </p>
        )}

        {artists.length === 0 ? (
          <div className="av-following-empty">
            <div className="av-following-empty-icon">
              <Heart size={30} />
            </div>

            <p className="av-following-eyebrow">
              START DISCOVERING
            </p>

            <h2>
              You are not following any
              artists yet
            </h2>

            <p>
              Explore ArtVault and follow
              artists to see them collected
              here.
            </p>

            <Link
              className="av-following-explore"
              to="/artists"
            >
              Explore artists
              <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <div className="av-following-grid">
            {artists.map((item) => {
              const artist = item.artist;
              const isRemoving =
                Number(unfollowingId) ===
                Number(artist.id);

              return (
                <article
                  className="av-following-card"
                  key={artist.id}
                >
                  <div className="av-following-avatar">
                    {artist.avatar_url ? (
                      <img
                        src={artist.avatar_url}
                        alt={artist.name}
                      />
                    ) : (
                      <span>
                        {artist.name
                          ?.charAt(0)
                          ?.toUpperCase() || "A"}
                      </span>
                    )}
                  </div>

                  <div className="av-following-card-copy">
                    <p className="av-following-card-label">
                      FOLLOWED ARTIST
                    </p>

                    <h2>{artist.name}</h2>

                    <p className="av-following-bio">
                      {artist.bio ||
                        "Contemporary artist represented by ArtVault."}
                    </p>

                    <div className="av-following-stats">
                      <span>
                        <UserRoundCheck
                          size={15}
                        />

                        {Number(
                          item.followers || 0
                        ).toLocaleString(
                          "en-IN"
                        )}{" "}
                        followers
                      </span>

                      <span>
                        <Image size={15} />

                        {Number(
                          item.artworks || 0
                        )}{" "}
                        artworks
                      </span>
                    </div>
                  </div>

                  <div className="av-following-actions">
                    <Link
                      className="av-following-view"
                      to={`/artists/${artist.id}`}
                    >
                      View profile
                      <ArrowRight size={16} />
                    </Link>

                    <button
                      className="av-following-unfollow"
                      type="button"
                      disabled={isRemoving}
                      onClick={() =>
                        handleUnfollow(
                          artist.id
                        )
                      }
                    >
                      {isRemoving ? (
                        <>
                          <Loader2
                            size={15}
                            className="av-following-spinner"
                          />
                          Removing…
                        </>
                      ) : (
                        "Unfollow"
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}