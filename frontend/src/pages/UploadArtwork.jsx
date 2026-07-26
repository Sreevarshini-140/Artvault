import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";

const BACKEND_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000/api"
).replace(/\/api\/?$/, "");

function getImageUrl(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith("blob:")
  ) {
    return imageUrl;
  }

  return `${BACKEND_URL}${
    imageUrl.startsWith("/") ? "" : "/"
  }${imageUrl}`;
}

function EditArtwork() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    medium: "",
    year: "",
    price: "",
    status: "draft",
  });

  const [image, setImage] =
    useState(null);

  const [currentImage, setCurrentImage] =
    useState("");

  const [preview, setPreview] =
    useState("");

  const [pageLoading, setPageLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const loadArtwork = async () => {
      try {
        setPageLoading(true);
        setError("");

        const response = await api.get(
          `/artworks/${id}`
        );

        const artwork =
          response.data?.artwork ||
          response.data;

        if (!artwork) {
          setError(
            "Artwork information was not found."
          );

          return;
        }

        setForm({
          title: artwork.title || "",
          description:
            artwork.description || "",
          category:
            artwork.category || "",
          medium:
            artwork.medium || "",
          year: artwork.year
            ? String(artwork.year)
            : "",
          price:
            artwork.price !== null &&
            artwork.price !== undefined
              ? String(artwork.price)
              : "",
          status:
            artwork.status || "draft",
        });

        setCurrentImage(
          getImageUrl(
            artwork.image_url ||
              artwork.image
          )
        );
      } catch (requestError) {
        console.error(
          "Failed to load artwork:",
          requestError
        );

        console.error(
          "Backend response:",
          requestError.response?.data
        );

        const backendMessage =
          requestError.response?.data
            ?.error ||
          requestError.response?.data
            ?.message ||
          requestError.response?.data
            ?.msg ||
          requestError.response?.data
            ?.detail;

        if (
          requestError.response?.status ===
          401
        ) {
          setError(
            backendMessage ||
              "Your session has expired. Please log in again."
          );

          return;
        }

        if (
          requestError.response?.status ===
          403
        ) {
          setError(
            backendMessage ||
              "You do not have permission to edit this artwork."
          );

          return;
        }

        if (
          requestError.response?.status ===
          404
        ) {
          setError(
            backendMessage ||
              "Artwork not found."
          );

          return;
        }

        setError(
          backendMessage ||
            "Failed to load artwork details."
        );
      } finally {
        setPageLoading(false);
      }
    };

    if (id) {
      loadArtwork();
    } else {
      setError(
        "Artwork ID is missing."
      );

      setPageLoading(false);
    }
  }, [id]);

  useEffect(() => {
    return () => {
      if (
        preview &&
        preview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const clearSelectedImage = () => {
    if (
      preview &&
      preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview("");
  };

  const handleImageChange = (
    event
  ) => {
    const selectedFile =
      event.target.files?.[0];

    setError("");
    setMessage("");

    if (!selectedFile) {
      clearSelectedImage();
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (
      !allowedTypes.includes(
        selectedFile.type
      )
    ) {
      setError(
        "Choose a JPG, PNG, WEBP or GIF image."
      );

      event.target.value = "";
      clearSelectedImage();
      return;
    }

    const maximumSize =
      5 * 1024 * 1024;

    if (
      selectedFile.size >
      maximumSize
    ) {
      setError(
        "The image must be smaller than 5 MB."
      );

      event.target.value = "";
      clearSelectedImage();
      return;
    }

    if (
      preview &&
      preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(preview);
    }

    setImage(selectedFile);

    setPreview(
      URL.createObjectURL(
        selectedFile
      )
    );
  };

  const validateForm = () => {
    const currentYear =
      new Date().getFullYear();

    if (!form.title.trim()) {
      return "Artwork title is required.";
    }

    if (!form.category) {
      return "Please select an artwork category.";
    }

    if (
      !form.price ||
      Number(form.price) <= 0
    ) {
      return "Enter a valid price greater than zero.";
    }

    if (
      form.year &&
      (Number(form.year) < 1000 ||
        Number(form.year) >
          currentYear)
    ) {
      return `Year must be between 1000 and ${currentYear}.`;
    }

    if (
      ![
        "draft",
        "published",
        "archived",
        "sold",
      ].includes(form.status)
    ) {
      return "Please select a valid artwork status.";
    }

    return "";
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const formData =
      new FormData();

    formData.append(
      "title",
      form.title.trim()
    );

    formData.append(
      "description",
      form.description.trim()
    );

    formData.append(
      "category",
      form.category
    );

    formData.append(
      "medium",
      form.medium.trim()
    );

    formData.append(
      "year",
      form.year
    );

    formData.append(
      "price",
      form.price
    );

    formData.append(
      "status",
      form.status
    );

    if (image) {
      formData.append(
        "image",
        image
      );
    }

    try {
      setSaving(true);

      const response = await api.put(
        `/artworks/${id}`,
        formData
      );

      console.log(
        "Artwork update response:",
        response.data
      );

      setMessage(
        "Artwork updated successfully."
      );

      const updatedArtwork =
        response.data?.artwork ||
        response.data;

      if (
        updatedArtwork?.image_url ||
        updatedArtwork?.image
      ) {
        setCurrentImage(
          getImageUrl(
            updatedArtwork.image_url ||
              updatedArtwork.image
          )
        );
      } else if (preview) {
        setCurrentImage(preview);
      }

      setImage(null);

      setTimeout(() => {
        navigate(
          `/artworks/${id}`
        );
      }, 700);
    } catch (requestError) {
      console.error(
        "Artwork update failed:",
        requestError
      );

      console.error(
        "Backend response:",
        requestError.response?.data
      );

      console.error(
        "Status code:",
        requestError.response?.status
      );

      const backendMessage =
        requestError.response?.data
          ?.error ||
        requestError.response?.data
          ?.message ||
        requestError.response?.data
          ?.msg ||
        requestError.response?.data
          ?.detail ||
        requestError.message;

      if (
        requestError.response?.status ===
        401
      ) {
        setError(
          backendMessage ||
            "Your session has expired. Please log in again."
        );

        return;
      }

      if (
        requestError.response?.status ===
        403
      ) {
        setError(
          backendMessage ||
            "You can only edit artworks that belong to your account."
        );

        return;
      }

      if (
        requestError.response?.status ===
        404
      ) {
        setError(
          backendMessage ||
            "Artwork not found."
        );

        return;
      }

      if (
        requestError.response?.status ===
        413
      ) {
        setError(
          "The selected image is too large. Maximum size is 5 MB."
        );

        return;
      }

      if (
        requestError.response?.status ===
        422
      ) {
        setError(
          backendMessage ||
            "Some artwork information is invalid."
        );

        return;
      }

      setError(
        backendMessage ||
          "Failed to update artwork."
      );
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <main className="page-container">
        <section className="form-card">
          <div className="loading-state">
            <p>
              Loading artwork details...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (error && !form.title) {
    return (
      <main className="page-container">
        <section className="form-card">
          <div className="error-state">
            <p
              className="error"
              role="alert"
            >
              {error}
            </p>

            <Link
              className="btn"
              to="/artist/artworks"
            >
              Back to My Artworks
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-container">
      <section className="form-card">
        <div className="form-heading">
          <p className="eyebrow">
            Artist Studio
          </p>

          <h1>Edit Artwork</h1>

          <p>
            Update your artwork
            information, price,
            publication status or
            image.
          </p>
        </div>

        {error && (
          <div
            className="alert alert-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            className="alert alert-success"
            role="status"
          >
            {message}
          </div>
        )}

        <form
          className="artwork-form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          <div className="form-group">
            <label htmlFor="title">
              Artwork title
            </label>

            <input
              id="title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter artwork title"
              maxLength="150"
              disabled={saving}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your artwork"
              rows="6"
              maxLength="2000"
              disabled={saving}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="category">
                Category
              </label>

              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                disabled={saving}
                required
              >
                <option value="">
                  Select category
                </option>

                <option value="Painting">
                  Painting
                </option>

                <option value="Digital Art">
                  Digital Art
                </option>

                <option value="Photography">
                  Photography
                </option>

                <option value="Illustration">
                  Illustration
                </option>

                <option value="Sculpture">
                  Sculpture
                </option>

                <option value="Mixed Media">
                  Mixed Media
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="medium">
                Medium
              </label>

              <input
                id="medium"
                type="text"
                name="medium"
                value={form.medium}
                onChange={handleChange}
                placeholder="For example: Oil on canvas"
                maxLength="120"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="year">
                Year created
              </label>

              <input
                id="year"
                type="number"
                name="year"
                value={form.year}
                onChange={handleChange}
                min="1000"
                max={
                  new Date().getFullYear()
                }
                placeholder={String(
                  new Date().getFullYear()
                )}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">
                Price
              </label>

              <input
                id="price"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="1"
                step="0.01"
                placeholder="2500"
                disabled={saving}
                required
              />
            </div>

            <div className="form-group full">
              <label htmlFor="status">
                Artwork status
              </label>

              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="draft">
                  Draft
                </option>

                <option value="published">
                  Published
                </option>

                <option value="archived">
                  Archived
                </option>

                <option value="sold">
                  Sold
                </option>
              </select>

              <small className="field-help">
                Published artworks are
                visible to visitors and
                collectors.
              </small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="image">
              Replace artwork image
            </label>

            <div className="upload-box">
              <input
                id="image"
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={
                  handleImageChange
                }
                disabled={saving}
              />

              <p>
                Leave this empty to keep
                the current image. Choose
                JPG, PNG, WEBP or GIF.
                Maximum size: 5 MB.
              </p>
            </div>
          </div>

          <div className="edit-image-grid">
            {currentImage && (
              <div className="image-preview">
                <p>Current image</p>

                <img
                  src={currentImage}
                  alt="Current artwork"
                />
              </div>
            )}

            {preview && (
              <div className="image-preview">
                <div className="preview-heading">
                  <p>New image</p>

                  <button
                    className="text-btn danger"
                    type="button"
                    onClick={
                      clearSelectedImage
                    }
                    disabled={saving}
                  >
                    Remove
                  </button>
                </div>

                <img
                  src={preview}
                  alt="New artwork preview"
                />
              </div>
            )}
          </div>

          <div className="form-actions">
            <Link
              className="btn btn-secondary"
              to="/artist/artworks"
            >
              Cancel
            </Link>

            <button
              className="btn"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving changes..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default EditArtwork;