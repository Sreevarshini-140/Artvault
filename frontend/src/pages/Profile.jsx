import { useEffect, useState } from "react";

import PageHero from "../components/PageHero";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Profile() {
  const {
    user,
    updateCurrentUser,
  } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      bio: user?.bio || "",
    });
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await api.put(
        "/users/me",
        {
          name: form.name.trim(),
          email: form.email.trim(),
          bio: form.bio.trim(),
        }
      );

      const updatedUser =
        response.data?.user ||
        response.data?.data?.user ||
        response.data;

      if (!updatedUser) {
        throw new Error(
          "The backend did not return the updated profile."
        );
      }

      updateCurrentUser(updatedUser);

      setMessage(
        "Profile saved successfully."
      );
    } catch (requestError) {
      console.error(
        "Profile update failed:",
        requestError.response?.data ||
          requestError
      );

      const backendMessage =
        requestError.response?.data?.error ||
        requestError.response?.data?.message ||
        requestError.response?.data?.msg ||
        requestError.message;

      setError(
        backendMessage ||
          "Failed to save profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Your profile"
        text="Manage your personal information and preferences."
      />

      <section className="container profile-grid">
        <article className="panel profile-summary">
          <div className="avatar large">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>

          <h2>
            {user?.name || "ArtVault Member"}
          </h2>

          <p>{user?.email}</p>

          <span className="role-pill">
            {user?.role || "member"}
          </span>
        </article>

        <form
          className="panel settings-form"
          onSubmit={submit}
        >
          <h2>Profile details</h2>

          <label htmlFor="profile-name">
            Full name

            <input
              id="profile-name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              disabled={saving}
            />
          </label>

          <label htmlFor="profile-email">
            Email

            <input
              id="profile-email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              disabled={saving}
            />
          </label>

          <label htmlFor="profile-bio">
            Bio

            <textarea
              id="profile-bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Tell collectors about yourself"
              rows="5"
              maxLength="1000"
              disabled={saving}
            />
          </label>

          {message && (
            <p
              className="success-message"
              role="status"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              className="error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="btn"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save changes"}
          </button>
        </form>
      </section>
    </>
  );
}