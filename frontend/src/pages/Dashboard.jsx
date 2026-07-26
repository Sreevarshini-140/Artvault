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

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (
    isArtist ||
    role === "artist"
  ) {
    return <ArtistDashboard />;
  }

  return <VisitorDashboard />;
}