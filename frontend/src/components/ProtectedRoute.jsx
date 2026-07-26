import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


export default function ProtectedRoute({
  children,
  roles = [],
}) {
  const location = useLocation();

  const {
    user,
    loading,
    isAdmin,
    isArtist,
    isCurator,
  } = useAuth();

  if (loading) {
    return (
      <section
        style={{
          minHeight: "calc(100vh - 72px)",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              margin: "0 auto 1rem",
              border:
                "3px solid rgba(201, 169, 110, 0.25)",
              borderTopColor: "#c9a96e",
              borderRadius: "50%",
              animation:
                "protected-route-spin 0.8s linear infinite",
            }}
          />

          <p
            style={{
              margin: 0,
              color: "#77736c",
              fontWeight: 600,
            }}
          >
            Checking your session...
          </p>

          <style>
            {`
              @keyframes protected-route-spin {
                to {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname +
            location.search,
        }}
      />
    );
  }

  const normalizedRoles = Array.isArray(roles)
    ? roles
        .map((role) =>
          String(role || "")
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    : [];

  if (normalizedRoles.length === 0) {
    return children;
  }

  const userRole = String(
    user?.role || ""
  )
    .trim()
    .toLowerCase();

  const hasRequiredRole =
    normalizedRoles.some(
      (requiredRole) => {
        if (requiredRole === "admin") {
          return Boolean(isAdmin);
        }

        if (requiredRole === "artist") {
          return Boolean(isArtist);
        }

        if (requiredRole === "curator") {
          return Boolean(isCurator);
        }

        return userRole === requiredRole;
      }
    );

  if (!hasRequiredRole) {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{
          accessDenied: true,
          attemptedPath:
            location.pathname,
        }}
      />
    );
  }

  return children;
}