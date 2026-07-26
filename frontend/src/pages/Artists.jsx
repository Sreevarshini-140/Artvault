import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import PageHero from "../components/PageHero";
import api from "../services/api";

export default function Artists() {
  const [artists, setArtists] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/users/artists")
      .then((response) => {
        setArtists(
          Array.isArray(response.data)
            ? response.data
            : response.data.items || []
        );
      })
      .catch((requestError) => {
        console.error(
          "Failed to load artists:",
          requestError
        );

        setError(
          requestError.response?.data?.error ||
            requestError.message ||
            "Failed to load artists."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Creators"
        title="Artists shaping the present"
        text="Meet established masters and rising voices selected by ArtVault curators."
      />

      <section className="container card-grid">
        {loading && <p>Loading artists…</p>}

        {!loading && error && <p>{error}</p>}

        {!loading &&
          !error &&
          artists.length === 0 && (
            <p>No artists found.</p>
          )}

        {!loading &&
          !error &&
          artists.map((item, index) => {
            const artist = item.artist;
            const artworks =
              item.artworks || [];

            const initials = artist.name
              .split(" ")
              .filter(Boolean)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <article
                className="artist-card"
                key={artist.id}
              >
                <div
                  className={`avatar avatar-${
                    (index % 4) + 1
                  }`}
                >
                  {initials}
                </div>

                <h3>{artist.name}</h3>

                <p>
                  {artist.bio ||
                    "Contemporary visual artist"}
                </p>

                <div className="mini-stats">
                  <span>
                    {artworks.length} works
                  </span>

                  <span>
                    {Number(
                      item.followers || 0
                    ).toLocaleString("en-IN")}{" "}
                    followers
                  </span>
                </div>

                <Link
                  className="btn secondary"
                  to={`/artists/${artist.id}`}
                >
                  View profile
                </Link>
              </article>
            );
          })}
      </section>
    </>
  );
}