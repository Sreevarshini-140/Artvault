import {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  ImageOff,
  LoaderCircle,
  Users,
} from "lucide-react";
import "../styles/Exhibitions.css";
import {
  Link,
} from "react-router-dom";

import PageHero from "../components/PageHero";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

export default function Exhibitions() {
  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchExhibitions =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await api.get(
              "/exhibitions"
            );

          const exhibitionData =
            Array.isArray(
              response.data
            )
              ? response.data
              : Array.isArray(
                  response.data
                    ?.exhibitions
                )
              ? response.data
                  .exhibitions
              : [];

          if (isMounted) {
            setItems(
              exhibitionData
            );
          }
        } catch (
          requestError
        ) {
          console.error(
            "Failed to load exhibitions:",
            requestError
          );

          if (isMounted) {
            setItems([]);

            setError(
              requestError
                .response?.data
                ?.error ||
                requestError
                  .response?.data
                  ?.message ||
                "Failed to load exhibitions."
            );
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

    fetchExhibitions();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "Date not available";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Date not available";
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

  const formatLifecycleStatus = (
    status
  ) => {
    if (!status) {
      return "Published";
    }

    return status
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  return (
    <>
      <PageHero
        eyebrow="Curated experiences"
        title="Current exhibitions"
        text="Enter collections designed as journeys, not catalogues."
      />

      <section className="container exhibition-list">
        {error && (
          <div className="exhibition-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="exhibition-loading">
            <LoaderCircle
              className="spin"
              size={30}
            />

            <p>
              Loading exhibitions...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state exhibition-empty-state">
            <ImageOff
              size={38}
            />

            <h2>
              No exhibitions available
            </h2>

            <p>
              Published exhibitions
              will appear here.
            </p>
          </div>
        ) : (
          items.map(
            (
              exhibition,
              index
            ) => {
              const bannerSource =
                exhibition.banner_url ||
                exhibition.banner ||
                exhibition.image_url;

              const artworkCount =
                Number(
                  exhibition.artwork_count ??
                    exhibition
                      .artworks
                      ?.length ??
                    0
                );

              const artistCount =
                Number(
                  exhibition.artist_count ??
                    0
                );

              return (
                <article
                  className="exhibition-row"
                  key={
                    exhibition.id ||
                    exhibition.slug
                  }
                >
                  <div
                    className={`exhibition-art exhibition-${
                      (index % 4) +
                      1
                    }`}
                  >
                    {bannerSource ? (
                      <img
                        src={getImageUrl(
                          bannerSource
                        )}
                        alt={`${exhibition.title} exhibition banner`}
                      />
                    ) : (
                      <div className="exhibition-image-placeholder">
                        <ImageOff
                          size={34}
                        />
                      </div>
                    )}

                    <span className="exhibition-status">
                      {formatLifecycleStatus(
                        exhibition.lifecycle_status
                      )}
                    </span>
                  </div>

                  <div className="exhibition-content">
                    <span className="eyebrow">
                      CURATED COLLECTION
                    </span>

                    <h2>
                      {exhibition.title ||
                        "Untitled exhibition"}
                    </h2>

                    <p>
                      {exhibition.description ||
                        "Discover a carefully curated collection of original artworks."}
                    </p>

                    <div className="exhibition-meta">
                      <span>
                        <CalendarDays
                          size={
                            16
                          }
                        />

                        {formatDate(
                          exhibition.starts_at
                        )}
                        {" — "}
                        {formatDate(
                          exhibition.ends_at
                        )}
                      </span>

                      <span>
                        <ImageOff
                          size={
                            16
                          }
                        />

                        {
                          artworkCount
                        }{" "}
                        artwork
                        {artworkCount ===
                        1
                          ? ""
                          : "s"}
                      </span>

                      {artistCount >
                        0 && (
                        <span>
                          <Users
                            size={
                              16
                            }
                          />

                          {
                            artistCount
                          }{" "}
                          artist
                          {artistCount ===
                          1
                            ? ""
                            : "s"}
                        </span>
                      )}
                    </div>

                    <div className="exhibition-curator">
                      Curated by{" "}
                      <strong>
                        {exhibition
                          .curator
                          ?.name ||
                          "ArtVault curator"}
                      </strong>
                    </div>

                    <Link
                      className="btn secondary"
                      to={`/exhibitions/${exhibition.slug}`}
                    >
                      Enter exhibition
                    </Link>
                  </div>
                </article>
              );
            }
          )
        )}
      </section>
    </>
  );
}