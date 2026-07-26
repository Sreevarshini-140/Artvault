import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  Loader2,
  UserPlus,
  UserRoundCheck,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";
import ArtworkCard from "../components/ArtworkCard";
import { useAuth } from "../context/AuthContext";

export default function ArtistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [isFollowing, setIsFollowing] =
    useState(false);
  const [followLoading, setFollowLoading] =
    useState(false);
  const [pageLoading, setPageLoading] =
    useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("");

  const artistId = Number(id);
  const isOwnProfile =
    user && Number(user.id) === artistId;

  useEffect(() => {
    let isMounted = true;

    const loadArtist = async () => {
      setPageLoading(true);
      setMessage("");
      setMessageType("");

      try {
        const artistResponse = await api.get(
          `/users/artists/${id}`
        );

        if (!isMounted) {
          return;
        }

        setData(artistResponse.data);

        if (user && Number(user.id) !== artistId) {
          try {
            const statusResponse = await api.get(
              `/users/follow-status/${id}`
            );

            if (!isMounted) {
              return;
            }

            setIsFollowing(
              Boolean(
                statusResponse.data.following
              )
            );

            setData((currentData) => ({
              ...currentData,
              followers: Number(
                statusResponse.data.followers ?? 
                currentData.followers ??
                0
              ),
            }));
          } catch (statusError) {
            console.error(
              "Failed to load follow status:",
              statusError
            );
          }
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setMessage(
          error.response?.data?.error ||
            error.message ||
            "Failed to load artist."
        );

        setMessageType("error");
      } finally {
        if (isMounted) {
          setPageLoading(false);
        }
      }
    };

    loadArtist();

    return () => {
      isMounted = false;
    };
  }, [id, user, artistId]);

  const handleFollowToggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (isOwnProfile || followLoading) {
      return;
    }

    setFollowLoading(true);
    setMessage("");
    setMessageType("");

    try {
      if (isFollowing) {
        await api.delete(
          `/users/follow/${id}`
        );

        setIsFollowing(false);

        setData((currentData) => ({
          ...currentData,
          followers: Math.max(
            Number(
              currentData.followers || 0
            ) - 1,
            0
          ),
        }));

        setMessage(
          "You are no longer following this artist."
        );
      } else {
        await api.post(
          `/users/follow/${id}`
        );

        setIsFollowing(true);

        setData((currentData) => ({
          ...currentData,
          followers:
            Number(
              currentData.followers || 0
            ) + 1,
        }));

        setMessage(
          "You are now following this artist."
        );
      }

      setMessageType("success");
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Unable to update follow status."
      );

      setMessageType("error");
    } finally {
      setFollowLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <section className="section page">
        <div className="artist-profile-loading">
          <Loader2
            size={24}
            className="artist-profile-spinner"
          />

          <p>Loading artist profile…</p>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="section page">
        <p className="error-message">
          {message || "Artist not found."}
        </p>
      </section>
    );
  }

  const artworks = data.artworks || [];
  const followers = Number(
    data.followers || 0
  );

  return (
    <section className="section page">
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">
            ARTIST PROFILE
          </p>

          <h1>{data.artist.name}</h1>

          <p>
            {data.artist.bio ||
              "Contemporary artist represented by ArtVault."}
          </p>

          <small>
            {followers.toLocaleString(
              "en-IN"
            )}{" "}
            {followers === 1
              ? "follower"
              : "followers"}{" "}
            • {artworks.length}{" "}
            {artworks.length === 1
              ? "artwork"
              : "artworks"}
          </small>
        </div>

        {!isOwnProfile && (
          <button
            className={`btn ${
              isFollowing
                ? "btn-following"
                : ""
            }`}
            type="button"
            onClick={handleFollowToggle}
            disabled={followLoading}
          >
            {followLoading ? (
              <>
                <Loader2
                  size={17}
                  className="artist-profile-spinner"
                />
                Updating…
              </>
            ) : isFollowing ? (
              <>
                <UserRoundCheck size={17} />
                Following
                <Check size={15} />
              </>
            ) : (
              <>
                <UserPlus size={17} />
                Follow artist
              </>
            )}
          </button>
        )}
      </div>

      {isOwnProfile && (
        <p className="artist-profile-own-note">
          This is your public artist profile.
        </p>
      )}

      {message && (
        <p
          className={
            messageType === "error"
              ? "error-message"
              : "success-message"
          }
        >
          {message}
        </p>
      )}

      {artworks.length === 0 ? (
        <p>
          This artist has no published
          artworks yet.
        </p>
      ) : (
        <div className="art-grid">
          {artworks.map((artwork) => (
            <ArtworkCard
              key={artwork.id}
              art={artwork}
            />
          ))}
        </div>
      )}
    </section>
  );
}