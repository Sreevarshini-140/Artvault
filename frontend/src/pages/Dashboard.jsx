import { useAuth } from "../context/AuthContext";

import AdminDashboard from "./AdminDashboard";
import ArtistDashboard from "./ArtistDashboard";
import VisitorDashboard from "./VisitorDashboard";

export default function Dashboard() {
  const {
    user,
    isAdmin,
    isArtist,
  } = useAuth();

  const role = String(
    user?.role || "visitor"
  )
    .trim()
    .toLowerCase();

  return (
    <div>
      <div
        style={{
          position: "fixed",
          top: "10px",
          left: "50%",
          zIndex: 99999,
          padding: "10px 18px",
          color: "black",
          background: "gold",
          borderRadius: "8px",
          transform: "translateX(-50%)",
          fontWeight: "700",
        }}
      >
        ACTIVE BUILD — role: {role} —
        isArtist: {String(isArtist)}
      </div>

      {isArtist || role === "artist" ? (
        <ArtistDashboard />
      ) : isAdmin ? (
        <AdminDashboard />
      ) : (
        <VisitorDashboard />
      )}
    </div>
  );
}