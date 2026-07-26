const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000/api";

const BACKEND_BASE_URL =
  API_BASE_URL.replace(/\/api\/?$/, "");

export function getImageUrl(imagePath) {
  if (!imagePath) {
    return "";
  }

  // Replace old local URLs stored in the database.
  if (
    imagePath.startsWith("http://127.0.0.1:5000") ||
    imagePath.startsWith("http://localhost:5000")
  ) {
    const url = new URL(imagePath);
    return `${BACKEND_BASE_URL}${url.pathname}`;
  }

  // Keep already-correct external URLs unchanged.
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  // Handle relative paths from the backend.
  const normalizedPath = imagePath.startsWith("/")
    ? imagePath
    : `/${imagePath}`;

  return `${BACKEND_BASE_URL}${normalizedPath}`;
}