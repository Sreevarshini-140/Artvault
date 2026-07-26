const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:5000"
).replace(/\/$/, "");

export function getImageUrl(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("blob:") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  const normalizedPath = imageUrl.startsWith("/")
    ? imageUrl
    : `/${imageUrl}`;

  return `${BACKEND_URL}${normalizedPath}`;
}