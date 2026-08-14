import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  Bell,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  ShoppingBag,
  Sun,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext";


export default function Navbar() {
  const {
    user,
    logout,
    isAdmin,
    isArtist,
    isCurator,
  } = useAuth();

  const navigate =
    useNavigate();

  const [dark, setDark] =
    useState(() => {
      return (
        localStorage.getItem(
          "theme"
        ) !== "light"
      );
    });

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  // =============================
  // THEME
  // =============================

  useEffect(() => {
    document.documentElement.dataset.theme =
      dark ? "dark" : "light";

    localStorage.setItem(
      "theme",
      dark ? "dark" : "light"
    );
  }, [dark]);

  // =============================
  // CLOSE MOBILE MENU ON RESIZE
  // =============================

  useEffect(() => {
    const handleResize = () => {
      if (
        window.innerWidth > 980
      ) {
        setMenuOpen(false);
      }
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  // =============================
  // PREVENT PAGE SCROLL
  // =============================

  useEffect(() => {
    document.body.style.overflow =
      menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate("/login");
  };

  const navLinkClass = ({
    isActive,
  }) => {
    return isActive
      ? "active"
      : "";
  };

  return (
    <header className="nav">
      {/* =========================
          BRAND
      ========================== */}

      <Link
        className="brand"
        to="/"
        onClick={closeMenu}
      >
        ART<span>VAULT</span>
      </Link>

      {/* =========================
          DESKTOP NAVIGATION
      ========================== */}

      <nav className="desktop-nav">
        <NavLink
          className={navLinkClass}
          to="/explore"
        >
          Explore
        </NavLink>

        <NavLink
          className={navLinkClass}
          to="/artists"
        >
          Artists
        </NavLink>

        <NavLink
          className={navLinkClass}
          to="/exhibitions"
        >
          Exhibitions
        </NavLink>

        <NavLink
          className={navLinkClass}
          to="/collected"
        >
          Collected
        </NavLink>

        <NavLink
          className={navLinkClass}
          to="/shop"
        >
          Shop
        </NavLink>

        {user && (
          <>
            <NavLink
              className={navLinkClass}
              to="/following"
            >
              Following
            </NavLink>

            <NavLink
              className={navLinkClass}
              to="/dashboard"
            >
              Dashboard
            </NavLink>
          </>
        )}

        {isAdmin && (
          <NavLink
            className={navLinkClass}
            to="/admin/users"
          >
            Admin
          </NavLink>
        )}
      </nav>

      {/* =========================
          NAVBAR ACTIONS
      ========================== */}

      <div className="nav-actions">
        <button
          aria-label={
            dark
              ? "Switch to light theme"
              : "Switch to dark theme"
          }
          className="icon-btn"
          type="button"
          onClick={() =>
            setDark(
              (current) =>
                !current
            )
          }
        >
          {dark ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
        </button>

        <Link
          aria-label="Cart"
          className="icon-btn desktop-action"
          to="/cart"
        >
          <ShoppingBag
            size={18}
          />
        </Link>

        {user && (
          <>
            <Link
              aria-label="Notifications"
              className="icon-btn desktop-action"
              to="/notifications"
            >
              <Bell size={18} />
            </Link>

            <Link
              aria-label="Wishlist"
              className="icon-btn desktop-action"
              to="/wishlist"
            >
              <Heart size={18} />
            </Link>

            <Link
              aria-label="Following"
              className="icon-btn desktop-action"
              title="Following"
              to="/following"
            >
              <Users size={18} />
            </Link>

            <Link
              aria-label="Profile"
              className="icon-btn desktop-action"
              to="/profile"
            >
              <UserRound
                size={18}
              />
            </Link>
          </>
        )}

        {user ? (
          <button
            className="text-btn desktop-action"
            type="button"
            onClick={
              handleLogout
            }
          >
            <LogOut size={16} />
            Logout
          </button>
        ) : (
          <Link
            className="btn small desktop-action"
            to="/login"
          >
            Sign in
          </Link>
        )}

        <button
          aria-expanded={
            menuOpen
          }
          aria-controls="artvault-mobile-menu"
          aria-label={
            menuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          className="mobile-menu-button"
          type="button"
          onClick={() =>
            setMenuOpen(
              (current) =>
                !current
            )
          }
        >
          {menuOpen ? (
            <X size={23} />
          ) : (
            <Menu size={23} />
          )}
        </button>
      </div>

      {/* =========================
          MOBILE OVERLAY
      ========================== */}

      <div
        className={
          menuOpen
            ? "mobile-menu-overlay open"
            : "mobile-menu-overlay"
        }
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* =========================
          MOBILE MENU
      ========================== */}

      <aside
        id="artvault-mobile-menu"
        className={
          menuOpen
            ? "mobile-menu open"
            : "mobile-menu"
        }
        aria-hidden={
          !menuOpen
        }
      >
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">
            Navigation
          </span>

          <button
            aria-label="Close menu"
            className="mobile-menu-close"
            type="button"
            onClick={closeMenu}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="mobile-nav-links">
          <NavLink
            className={navLinkClass}
            to="/explore"
            onClick={closeMenu}
          >
            Explore
          </NavLink>

          <NavLink
            className={navLinkClass}
            to="/artists"
            onClick={closeMenu}
          >
            Artists
          </NavLink>

          <NavLink
            className={navLinkClass}
            to="/exhibitions"
            onClick={closeMenu}
          >
            Exhibitions
          </NavLink>

          <NavLink
            className={navLinkClass}
            to="/collected"
            onClick={closeMenu}
          >
            Collected
          </NavLink>

          <NavLink
            className={navLinkClass}
            to="/shop"
            onClick={closeMenu}
          >
            Shop
          </NavLink>

          <NavLink
            className={navLinkClass}
            to="/cart"
            onClick={closeMenu}
          >
            <ShoppingBag
              size={18}
            />
            Cart
          </NavLink>

          {user && (
            <>
              <NavLink
                className={navLinkClass}
                to="/dashboard"
                onClick={closeMenu}
              >
                <LayoutDashboard
                  size={18}
                />
                Dashboard
              </NavLink>

              {(isArtist ||
                isCurator) && (
                <NavLink
                  className={
                    navLinkClass
                  }
                  to="/following"
                  onClick={
                    closeMenu
                  }
                >
                  <Users
                    size={18}
                  />
                  Following
                </NavLink>
              )}

              <NavLink
                className={navLinkClass}
                to="/notifications"
                onClick={closeMenu}
              >
                <Bell size={18} />
                Notifications
              </NavLink>

              <NavLink
                className={navLinkClass}
                to="/wishlist"
                onClick={closeMenu}
              >
                <Heart size={18} />
                Wishlist
              </NavLink>

              <NavLink
                className={navLinkClass}
                to="/profile"
                onClick={closeMenu}
              >
                <UserRound
                  size={18}
                />
                Profile
              </NavLink>

              {isAdmin && (
                <NavLink
                  className={
                    navLinkClass
                  }
                  to="/admin/users"
                  onClick={
                    closeMenu
                  }
                >
                  <ShieldCheck
                    size={18}
                  />
                  Admin Dashboard
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="mobile-menu-footer">
          {user ? (
            <button
              className="mobile-logout-button"
              type="button"
              onClick={
                handleLogout
              }
            >
              <LogOut size={18} />
              Logout
            </button>
          ) : (
            <Link
              className="mobile-signin-button"
              to="/login"
              onClick={closeMenu}
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </header>
  );
}