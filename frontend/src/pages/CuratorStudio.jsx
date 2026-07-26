import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CalendarDays,
  Check,
  ImagePlus,
  LoaderCircle,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import PageHero from "../components/PageHero";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

import "../styles/CuratorStudio.css";

const initialForm = {
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "draft",
};

const formatPrice = (price) => {
  const numericPrice = Number(price || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericPrice);
};

export default function CuratorStudio() {
  const bannerInputRef = useRef(null);

  const [formData, setFormData] =
    useState(initialForm);

  const [bannerFile, setBannerFile] =
    useState(null);

  const [bannerPreview, setBannerPreview] =
    useState("");

  const [artworks, setArtworks] =
    useState([]);

  const [selectedArtworkIds, setSelectedArtworkIds] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [loadingArtworks, setLoadingArtworks] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    fetchArtworks();
  }, []);

  useEffect(() => {
    return () => {
      if (bannerPreview) {
        URL.revokeObjectURL(
          bannerPreview
        );
      }
    };
  }, [bannerPreview]);

  const fetchArtworks = async () => {
    try {
      setLoadingArtworks(true);
      setError("");

      const response = await api.get(
        "/artworks",
        {
          params: {
            status: "published",
          },
        }
      );

      const responseData =
        response.data;

      const artworkData =
        Array.isArray(responseData)
          ? responseData
          : Array.isArray(
              responseData?.items
            )
          ? responseData.items
          : Array.isArray(
              responseData?.artworks
            )
          ? responseData.artworks
          : [];

      let currentUser = null;

      try {
        const storedUser =
          localStorage.getItem(
            "user"
          );

        currentUser = storedUser
          ? JSON.parse(storedUser)
          : null;
      } catch {
        currentUser = null;
      }

      const currentUserId =
        Number(currentUser?.id);

      const visibleArtworks =
        currentUser?.role === "admin"
          ? artworkData
          : artworkData.filter(
              (artwork) =>
                Number(
                  artwork?.artist_id ??
                    artwork?.artist?.id
                ) === currentUserId
            );

      setArtworks(
        visibleArtworks
      );
    } catch (requestError) {
      setArtworks([]);

      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Failed to load artworks."
      );
    } finally {
      setLoadingArtworks(false);
    }
  };

  const categories = useMemo(() => {
    const categorySet = new Set();

    artworks.forEach((artwork) => {
      const category =
        artwork?.category?.trim();

      if (category) {
        categorySet.add(category);
      }
    });

    return [
      "All",
      ...Array.from(categorySet).sort(),
    ];
  }, [artworks]);

  const filteredArtworks = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return artworks.filter((artwork) => {
      const title =
        artwork?.title
          ?.toLowerCase() || "";

      const artistName =
        artwork?.artist_name
          ?.toLowerCase() ||
        artwork?.artist?.name
          ?.toLowerCase() ||
        "";

      const medium =
        artwork?.medium
          ?.toLowerCase() || "";

      const category =
        artwork?.category
          ?.toLowerCase() || "";

      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        artistName.includes(
          normalizedSearch
        ) ||
        medium.includes(normalizedSearch) ||
        category.includes(
          normalizedSearch
        );

      const matchesCategory =
        selectedCategory === "All" ||
        artwork?.category ===
          selectedCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    artworks,
    searchTerm,
    selectedCategory,
  ]);

  const selectedArtworks = useMemo(() => {
    return artworks.filter((artwork) => {
      const artworkId =
        artwork.id || artwork._id;

      return selectedArtworkIds.includes(
        artworkId
      );
    });
  }, [
    artworks,
    selectedArtworkIds,
  ]);

  const isFormReady = useMemo(() => {
    if (!formData.title.trim()) {
      return false;
    }

    if (!formData.description.trim()) {
      return false;
    }

    if (!formData.start_date) {
      return false;
    }

    if (!formData.end_date) {
      return false;
    }

    if (
      new Date(formData.end_date) <=
      new Date(formData.start_date)
    ) {
      return false;
    }

    if (!bannerFile) {
      return false;
    }

    if (
      selectedArtworkIds.length === 0
    ) {
      return false;
    }

    return true;
  }, [
    formData,
    bannerFile,
    selectedArtworkIds,
  ]);

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const handleBannerChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(file.type)
    ) {
      setError(
        "Banner must be a JPG, PNG, or WebP image."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Banner image must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    if (bannerPreview) {
      URL.revokeObjectURL(
        bannerPreview
      );
    }

    setBannerFile(file);

    setBannerPreview(
      URL.createObjectURL(file)
    );

    setError("");
    setMessage("");
  };

  const removeBanner = () => {
    if (bannerPreview) {
      URL.revokeObjectURL(
        bannerPreview
      );
    }

    setBannerFile(null);
    setBannerPreview("");

    if (bannerInputRef.current) {
      bannerInputRef.current.value =
        "";
    }
  };

  const toggleArtworkSelection = (
    artworkId
  ) => {
    setSelectedArtworkIds(
      (currentIds) => {
        const isSelected =
          currentIds.includes(
            artworkId
          );

        if (isSelected) {
          return currentIds.filter(
            (id) =>
              id !== artworkId
          );
        }

        return [
          ...currentIds,
          artworkId,
        ];
      }
    );

    setError("");
    setMessage("");
  };

  const removeSelectedArtwork = (
    artworkId
  ) => {
    setSelectedArtworkIds(
      (currentIds) =>
        currentIds.filter(
          (id) => id !== artworkId
        )
    );
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "Enter an exhibition title.";
    }

    if (
      !formData.description.trim()
    ) {
      return "Enter an exhibition description.";
    }

    if (!formData.start_date) {
      return "Choose an opening date.";
    }

    if (!formData.end_date) {
      return "Choose a closing date.";
    }

    if (
      new Date(formData.end_date) <=
      new Date(formData.start_date)
    ) {
      return "Closing date must be after the opening date.";
    }

    if (!bannerFile) {
      return "Upload an exhibition banner.";
    }

    if (
      selectedArtworkIds.length === 0
    ) {
      return "Select at least one artwork.";
    }

    return "";
  };

  const resetForm = () => {
    setFormData(initialForm);
    setSelectedArtworkIds([]);
    setSearchTerm("");
    setSelectedCategory("All");

    removeBanner();
  };

  const handleSubmit = async (
    event,
    requestedStatus = "draft"
  ) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const exhibitionPayload =
        new FormData();

      exhibitionPayload.append(
        "title",
        formData.title.trim()
      );

      exhibitionPayload.append(
        "description",
        formData.description.trim()
      );

      exhibitionPayload.append(
        "start_date",
        formData.start_date
      );

      exhibitionPayload.append(
        "end_date",
        formData.end_date
      );

      exhibitionPayload.append(
        "status",
        requestedStatus
      );

      exhibitionPayload.append(
        "banner",
        bannerFile
      );

      exhibitionPayload.append(
        "artwork_ids",
        JSON.stringify(
          selectedArtworkIds
        )
      );

      await api.post(
        "/exhibitions",
        exhibitionPayload
      );

      setMessage(
        requestedStatus ===
          "published"
          ? "Exhibition published successfully."
          : "Exhibition saved as a draft."
      );

      resetForm();
    } catch (requestError) {
      setError(
        requestError.response?.data
          ?.error ||
          requestError.response?.data
            ?.message ||
          "Failed to create exhibition."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Curator workspace"
        title="Build an exhibition"
        text="Create a narrative, choose artworks, and schedule your exhibition."
      />

      <section className="container curator-studio">
        <div className="curator-studio-heading">
          <div>
            <span className="curator-section-label">
              <Sparkles size={16} />
              Exhibition builder
            </span>

            <h2>
              Create a curated collection
            </h2>

            <p>
              Complete the exhibition
              details, upload a banner,
              and select the artworks you
              want to feature.
            </p>
          </div>

          <div className="curator-selection-count">
            <strong>
              {
                selectedArtworkIds.length
              }
            </strong>

            <span>
              artwork
              {selectedArtworkIds.length ===
              1
                ? ""
                : "s"}{" "}
              selected
            </span>
          </div>
        </div>

        {(error || message) && (
          <div
            className={`curator-alert ${
              error
                ? "curator-alert-error"
                : "curator-alert-success"
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="curator-grid">
          <form
            className="panel curator-form"
            onSubmit={(event) =>
              handleSubmit(
                event,
                "draft"
              )
            }
          >
            <div className="curator-panel-heading">
              <div>
                <span>Step 1</span>

                <h2>
                  Exhibition details
                </h2>
              </div>

              <CalendarDays
                size={22}
              />
            </div>

            <label className="curator-field">
              <span>
                Exhibition title
              </span>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={
                  handleInputChange
                }
                placeholder="For example: The Modern Masters"
                maxLength={120}
              />
            </label>

            <label className="curator-field">
              <span>
                Curatorial description
              </span>

              <textarea
                name="description"
                value={
                  formData.description
                }
                onChange={
                  handleInputChange
                }
                rows="6"
                placeholder="Describe the theme, story, and artistic vision behind this exhibition."
                maxLength={1500}
              />

              <small>
                {
                  formData.description
                    .length
                }
                /1500 characters
              </small>
            </label>

            <div className="curator-date-grid">
              <label className="curator-field">
                <span>
                  Opening date
                </span>

                <input
                  type="date"
                  name="start_date"
                  value={
                    formData.start_date
                  }
                  onChange={
                    handleInputChange
                  }
                />
              </label>

              <label className="curator-field">
                <span>
                  Closing date
                </span>

                <input
                  type="date"
                  name="end_date"
                  value={
                    formData.end_date
                  }
                  min={
                    formData.start_date ||
                    undefined
                  }
                  onChange={
                    handleInputChange
                  }
                />
              </label>
            </div>

            <div className="curator-banner-section">
              <div className="curator-field-title">
                <span>
                  Exhibition banner
                </span>

                <small>
                  JPG, PNG or WebP ·
                  Maximum 5 MB
                </small>
              </div>

              {bannerPreview ? (
                <div className="curator-banner-preview">
                  <img
                    src={
                      bannerPreview
                    }
                    alt="Exhibition banner preview"
                  />

                  <button
                    type="button"
                    className="curator-banner-remove"
                    onClick={
                      removeBanner
                    }
                    aria-label="Remove banner"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <label className="curator-banner-upload">
                  <ImagePlus
                    size={30}
                  />

                  <strong>
                    Upload banner image
                  </strong>

                  <span>
                    Recommended size:
                    1600 × 700 pixels
                  </span>

                  <span>
                    JPG, PNG or WebP
                  </span>

                  <span>
                    Maximum 5 MB
                  </span>

                  <input
                    ref={
                      bannerInputRef
                    }
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={
                      handleBannerChange
                    }
                    hidden
                  />
                </label>
              )}
            </div>

            {selectedArtworks.length >
              0 && (
              <div className="curator-selected-summary">
                <div className="curator-selected-summary-heading">
                  <strong>
                    Selected artworks
                  </strong>

                  <span>
                    {
                      selectedArtworks.length
                    }
                  </span>
                </div>

                <div className="curator-selected-list">
                  {selectedArtworks.map(
                    (artwork) => {
                      const artworkId =
                        artwork.id ||
                        artwork._id;

                      return (
                        <div
                          key={
                            artworkId
                          }
                          className="curator-selected-item"
                        >
                          <span>
                            <Check
                              size={
                                15
                              }
                            />

                            {
                              artwork.title
                            }
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeSelectedArtwork(
                                artworkId
                              )
                            }
                            aria-label={`Remove ${artwork.title}`}
                          >
                            <X
                              size={15}
                            />
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            <div className="curator-form-actions">
              <button
                className="btn secondary"
                type="submit"
                disabled={
                  submitting ||
                  !isFormReady
                }
              >
                {submitting ? (
                  <LoaderCircle
                    className="spin"
                    size={18}
                  />
                ) : (
                  <Upload
                    size={18}
                  />
                )}

                Save draft
              </button>

              <button
                className="btn"
                type="button"
                disabled={
                  submitting ||
                  !isFormReady
                }
                onClick={(event) =>
                  handleSubmit(
                    event,
                    "published"
                  )
                }
              >
                {submitting ? (
                  <LoaderCircle
                    className="spin"
                    size={18}
                  />
                ) : (
                  <Sparkles
                    size={18}
                  />
                )}

                Publish exhibition
              </button>
            </div>
          </form>

          <article className="panel curator-artworks-panel">
            <div className="curator-panel-heading">
              <div>
                <span>Step 2</span>

                <h2>
                  Select artworks
                </h2>
              </div>

              <strong className="curator-selected-badge">
                {
                  selectedArtworkIds.length
                }
              </strong>
            </div>

            <div className="curator-search">
              <Search size={18} />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search title, artist, medium or category..."
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  aria-label="Clear search"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="curator-category-filters">
              {categories.map(
                (category) => (
                  <button
                    key={category}
                    type="button"
                    className={
                      selectedCategory ===
                      category
                        ? "is-active"
                        : ""
                    }
                    onClick={() =>
                      setSelectedCategory(
                        category
                      )
                    }
                  >
                    {category}
                  </button>
                )
              )}
            </div>

            {loadingArtworks ? (
              <div className="curator-loading">
                <LoaderCircle
                  className="spin"
                  size={28}
                />

                <p>
                  Loading artworks...
                </p>
              </div>
            ) : filteredArtworks.length ===
              0 ? (
              <div className="empty-state curator-empty-state">
                <ImagePlus
                  size={34}
                />

                <strong>
                  {searchTerm ||
                  selectedCategory !==
                    "All"
                    ? "No matching artworks"
                    : "No artworks available"}
                </strong>

                <p>
                  {searchTerm ||
                  selectedCategory !==
                    "All"
                    ? "Try another search term or category."
                    : "Published artworks will appear here."}
                </p>
              </div>
            ) : (
              <div className="curator-artwork-grid">
                {filteredArtworks.map(
                  (artwork) => {
                    const artworkId =
                      artwork.id ||
                      artwork._id;

                    const isSelected =
                      selectedArtworkIds.includes(
                        artworkId
                      );

                    const imageSource =
                      artwork.image_url ||
                      artwork.image ||
                      artwork.thumbnail_url ||
                      artwork.cover_image;

                    const artistName =
                      artwork.artist_name ||
                      artwork.artist
                        ?.name ||
                      "Unknown artist";

                    return (
                      <button
                        key={artworkId}
                        type="button"
                        className={`curator-artwork-card ${
                          isSelected
                            ? "is-selected"
                            : ""
                        }`}
                        onClick={() =>
                          toggleArtworkSelection(
                            artworkId
                          )
                        }
                        aria-pressed={
                          isSelected
                        }
                      >
                        <div className="curator-artwork-image">
                          {imageSource ? (
                            <img
                              src={getImageUrl(
                                imageSource
                              )}
                              alt={
                                artwork.title ||
                                "Artwork"
                              }
                            />
                          ) : (
                            <div className="curator-image-placeholder">
                              <ImagePlus
                                size={
                                  28
                                }
                              />
                            </div>
                          )}

                          <span className="curator-checkbox">
                            {isSelected && (
                              <Check
                                size={
                                  16
                                }
                              />
                            )}
                          </span>

                          <span className="curator-artwork-status">
                            {artwork.status ||
                              "published"}
                          </span>
                        </div>

                        <div className="curator-artwork-info">
                          <strong>
                            {artwork.title ||
                              "Untitled artwork"}
                          </strong>

                          <span className="curator-artwork-artist">
                            {
                              artistName
                            }
                          </span>

                          <div className="curator-artwork-meta">
                            <span>
                              {artwork.medium ||
                                artwork.category ||
                                "Original artwork"}
                            </span>

                            <strong>
                              {formatPrice(
                                artwork.price
                              )}
                            </strong>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </article>
        </div>
      </section>
    </>
  );
}