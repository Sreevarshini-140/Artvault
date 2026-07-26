import {
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import ArtworkDetail from "./pages/ArtworkDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Wishlist from "./pages/Wishlist";
import Following from "./pages/Following";
import Artists from "./pages/Artists";
import ArtistProfile from "./pages/ArtistProfile";
import Exhibitions from "./pages/Exhibitions";
import ExhibitionDetail from "./pages/ExhibitionDetail";
import ManageExhibitions from "./pages/ManageExhibitions";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Notifications from "./pages/Notifications";
import UploadArtwork from "./pages/UploadArtwork";
import MyArtworks from "./pages/MyArtworks";
import EditArtwork from "./pages/EditArtwork";
import CuratorStudio from "./pages/CuratorStudio";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";
import AdminArtworks from "./pages/AdminArtworks";
import NotFound from "./pages/NotFound";


function Guard({
  children,
  roles = [],
}) {
  return (
    <ProtectedRoute roles={roles}>
      {children}
    </ProtectedRoute>
  );
}


export default function App() {
  const location = useLocation();

  const isDashboardPage =
    location.pathname === "/dashboard";

  return (
    <div className="app">
      {!isDashboardPage && <Navbar />}

      <main
        className={
          isDashboardPage
            ? "dashboard-main"
            : ""
        }
      >
        <Routes>
          {/* PUBLIC ROUTES */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/explore"
            element={<Explore />}
          />

          <Route
            path="/artworks/:id"
            element={<ArtworkDetail />}
          />

          <Route
            path="/artists"
            element={<Artists />}
          />

          <Route
            path="/artists/:id"
            element={<ArtistProfile />}
          />

          <Route
            path="/exhibitions"
            element={<Exhibitions />}
          />

          <Route
            path="/exhibitions/:slug"
            element={<ExhibitionDetail />}
          />

          <Route
            path="/shop"
            element={<Shop />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* AUTHENTICATED ROUTES */}

          <Route
            path="/checkout"
            element={
              <Guard>
                <Checkout />
              </Guard>
            }
          />

          <Route
            path="/dashboard"
            element={
              <Guard>
                <Dashboard />
              </Guard>
            }
          />

          <Route
            path="/wishlist"
            element={
              <Guard>
                <Wishlist />
              </Guard>
            }
          />

          <Route
            path="/following"
            element={
              <Guard>
                <Following />
              </Guard>
            }
          />

          <Route
            path="/profile"
            element={
              <Guard>
                <Profile />
              </Guard>
            }
          />

          <Route
            path="/orders"
            element={
              <Guard>
                <Orders />
              </Guard>
            }
          />

          <Route
            path="/notifications"
            element={
              <Guard>
                <Notifications />
              </Guard>
            }
          />

          {/* ARTIST ROUTES */}

          <Route
            path="/artist/upload"
            element={
              <Guard roles={["artist", "admin"]}>
                <UploadArtwork />
              </Guard>
            }
          />

          <Route
            path="/artist/artworks"
            element={
              <Guard roles={["artist", "admin"]}>
                <MyArtworks />
              </Guard>
            }
          />

          <Route
            path="/artist/artworks/:id/edit"
            element={
              <Guard roles={["artist", "admin"]}>
                <EditArtwork />
              </Guard>
            }
          />

          {/* CURATOR ROUTES */}

          <Route
            path="/curator/studio"
            element={
              <Guard
                roles={[
                  "artist",
                  "curator",
                  "admin",
                ]}
              >
                <CuratorStudio />
              </Guard>
            }
          />

          <Route
            path="/curator/exhibitions"
            element={
              <Guard
                roles={[
                  "artist",
                  "curator",
                  "admin",
                ]}
              >
                <ManageExhibitions />
              </Guard>
            }
          />

          <Route
            path="/manage-exhibitions"
            element={
              <Guard
                roles={[
                  "artist",
                  "curator",
                  "admin",
                ]}
              >
                <ManageExhibitions />
              </Guard>
            }
          />

          {/* ADMIN ROUTES */}

          <Route
            path="/admin/artworks"
            element={
              <Guard roles={["admin"]}>
                <AdminArtworks />
              </Guard>
            }
          />

          <Route
            path="/admin/users"
            element={
              <Guard roles={["admin"]}>
                <AdminUsers />
              </Guard>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <Guard roles={["admin"]}>
                <AdminReports />
              </Guard>
            }
          />

          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </main>

      {!isDashboardPage && <Footer />}
    </div>
  );
}