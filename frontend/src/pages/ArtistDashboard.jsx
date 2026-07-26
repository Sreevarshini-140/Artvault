import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Bell,
  BookOpen,
  ChevronDown,
  CircleUserRound,
  DollarSign,
  Eye,
  Grid2X2,
  Images,
  LogOut,
  Mail,
  MessageSquareText,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Upload,
  UserRound,
  Users,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

import "../styles/Dashboard.css";


const FALLBACK_STATS = {
  total_artworks: 0,
  published_artworks: 0,
  draft_artworks: 0,
  total_views: 0,
  followers: 0,
  average_rating: 0,
  total_sales: 0,
  total_earnings: 0,
  unread_messages: 0,
  unread_notifications: 0,
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function ArtistStatCard({
  icon,
  title,
  value,
  note,
}) {
  return (
    <article className="dashboard-stat-card">
      <div className="dashboard-stat-icon">
        {icon}
      </div>

      <div className="dashboard-stat-content">
        <span className="dashboard-stat-title">
          {title}
        </span>

        <strong className="dashboard-stat-value">
          {value}
        </strong>

        <span className="dashboard-stat-note dashboard-neutral">
          • {note}
        </span>
      </div>
    </article>
  );
}

function ArtworkThumbnail({
  artwork,
}) {
  const [failed, setFailed] =
    useState(false);

  const rawImage =
    artwork?.image_url ||
    artwork?.image ||
    artwork?.thumbnail_url ||
    artwork?.cover_image;

  const imageUrl = rawImage
    ? getImageUrl(rawImage)
    : "";

  if (!imageUrl || failed) {
    return (
      <div className="artist-dashboard-artwork-placeholder">
        <BookOpen size={28} />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={artwork?.title || "Artwork"}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function ArtistDashboard() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [dashboardData, setDashboardData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadArtistDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/dashboard/artist"
        );

        if (mounted) {
          setDashboardData(
            response.data || {}
          );
        }
      } catch (requestError) {
        console.error(
          "Artist dashboard loading error:",
          requestError
        );

        if (mounted) {
          setError(
            requestError.response?.data?.error ||
              requestError.response?.data?.message ||
              requestError.response?.data?.msg ||
              "Unable to load artist dashboard data."
          );

          setDashboardData({});
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadArtistDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const rawStats =
    dashboardData?.stats ||
    dashboardData?.summary ||
    {};

  const stats = {
    ...FALLBACK_STATS,

    total_artworks:
      rawStats.total_artworks ??
      rawStats.artworks_count ??
      dashboardData?.total_artworks ??
      0,

    published_artworks:
      rawStats.published_artworks ??
      rawStats.published_count ??
      dashboardData?.published_artworks ??
      0,

    draft_artworks:
      rawStats.draft_artworks ??
      rawStats.drafts ??
      dashboardData?.draft_artworks ??
      0,

    total_views:
      rawStats.total_views ??
      rawStats.portfolio_views ??
      dashboardData?.total_views ??
      0,

    followers:
      rawStats.followers ??
      rawStats.follower_count ??
      dashboardData?.followers ??
      0,

    average_rating:
      rawStats.average_rating ??
      rawStats.avg_rating ??
      dashboardData?.average_rating ??
      0,

    total_sales:
      rawStats.total_sales ??
      rawStats.sales ??
      dashboardData?.total_sales ??
      0,

    total_earnings:
      rawStats.total_earnings ??
      rawStats.earnings ??
      rawStats.revenue ??
      dashboardData?.total_earnings ??
      0,

    unread_messages:
      rawStats.unread_messages ??
      0,

    unread_notifications:
      rawStats.unread_notifications ??
      0,
  };

  const recentArtworks = useMemo(
    () =>
      normalizeArray(
        dashboardData?.recent_artworks ||
          dashboardData?.artworks ||
          dashboardData?.portfolio
      ),
    [dashboardData]
  );

  const recentSales = useMemo(
    () =>
      normalizeArray(
        dashboardData?.recent_sales ||
          dashboardData?.recent_orders ||
          dashboardData?.sales
      ),
    [dashboardData]
  );

  const firstName =
    dashboardData?.user?.name?.split(" ")[0] ||
    user?.name?.split(" ")[0] ||
    "Artist";

  const fullName =
    dashboardData?.user?.name ||
    user?.name ||
    "ArtVault Artist";

  const profileImage =
    dashboardData?.user?.profile_image ||
    user?.profile_image ||
    user?.avatar ||
    "";

  const navigationItems = [
    {
      label: "Dashboard",
      icon: <Grid2X2 size={20} />,
      to: "/dashboard",
    },
    {
      label: "Upload Artwork",
      icon: <Upload size={20} />,
      to: "/artist/upload",
    },
    {
      label: "My Artworks",
      icon: <Images size={20} />,
      to: "/artist/artworks",
    },
    {
      label: "Exhibitions",
      icon: <BookOpen size={20} />,
      to: "/curator/exhibitions",
    },
    {
      label: "Orders",
      icon: <Package size={20} />,
      to: "/orders",
    },
    {
      label: "Reviews",
      icon: <Star size={20} />,
      to: "/reviews",
    },
    {
      label: "Messages",
      icon: <Mail size={20} />,
      to: "/messages",
      count: stats.unread_messages,
    },
    {
      label: "Notifications",
      icon: <Bell size={20} />,
      to: "/notifications",
      count: stats.unread_notifications,
    },
    {
      label: "Profile",
      icon: <CircleUserRound size={20} />,
      to: "/profile",
    },
    {
      label: "Settings",
      icon: <Settings size={20} />,
      to: "/settings",
    },
  ];

  const handleSearch = (event) => {
    event.preventDefault();

    const value = searchTerm.trim();

    if (!value) {
      return;
    }

    navigate(
      `/explore?search=${encodeURIComponent(value)}`
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <main className="collector-dashboard">
        <div className="dashboard-loading">
          <div className="dashboard-loader" />

          <h2>Preparing your studio</h2>

          <p>
            Loading your portfolio and artist
            performance.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="collector-dashboard artist-dashboard">
      <header className="dashboard-topbar">
        <Link
          className="dashboard-brand"
          to="/"
          aria-label="ArtVault home"
        >
          <span className="dashboard-logo-art">
            ART
          </span>

          <span className="dashboard-logo-vault">
            VAULT
          </span>
        </Link>

        <form
          className="dashboard-search"
          onSubmit={handleSearch}
        >
          <input
            type="search"
            placeholder="Search artworks, artists, exhibitions..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          <button
            type="submit"
            aria-label="Search ArtVault"
          >
            <Search size={21} />
          </button>
        </form>

        <div className="dashboard-topbar-actions">
          <Link
            className="dashboard-icon-button"
            to="/notifications"
            aria-label="Notifications"
          >
            <Bell size={23} />

            {stats.unread_notifications > 0 && (
              <span>
                {stats.unread_notifications > 99
                  ? "99+"
                  : stats.unread_notifications}
              </span>
            )}
          </Link>

          <div className="dashboard-profile-wrapper">
            <button
              className="dashboard-profile-button"
              type="button"
              onClick={() =>
                setProfileMenuOpen(
                  (current) => !current
                )
              }
            >
              {profileImage ? (
                <img
                  src={getImageUrl(profileImage)}
                  alt={fullName}
                />
              ) : (
                <div className="dashboard-profile-fallback">
                  {fullName
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <div>
                <strong>{fullName}</strong>
                <span>Artist</span>
              </div>

              <ChevronDown size={18} />
            </button>

            {profileMenuOpen && (
              <div className="dashboard-profile-menu">
                <Link to="/profile">
                  <UserRound size={17} />
                  Profile
                </Link>

                <Link to="/settings">
                  <Settings size={17} />
                  Settings
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <nav className="dashboard-navigation">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={
                  item.label === "Dashboard"
                    ? "dashboard-nav-item dashboard-nav-active"
                    : "dashboard-nav-item"
                }
              >
                <span className="dashboard-nav-icon">
                  {item.icon}
                </span>

                <span>{item.label}</span>

                {Number(item.count || 0) > 0 && (
                  <span className="dashboard-nav-count">
                    {item.count > 99
                      ? "99+"
                      : item.count}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="dashboard-sidebar-footer">
            <button
              type="button"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </aside>

        <section className="dashboard-content">
          {error && (
            <div className="dashboard-error">
              <strong>
                Artist data could not be loaded.
              </strong>

              <span>{error}</span>
            </div>
          )}

          <section className="dashboard-hero artist-dashboard-hero">
            <div className="dashboard-hero-overlay" />

            <div className="dashboard-hero-content">
              <span>Artist workspace</span>

              <h1>{firstName}</h1>

              <p>
                Build your portfolio, publish new
                work and track how collectors engage
                with your art.
              </p>

              <div className="artist-dashboard-hero-actions">
                <Link
                  className="dashboard-primary-button"
                  to="/artist/upload"
                >
                  Upload Artwork
                  <Upload size={18} />
                </Link>

                <Link
                  className="artist-dashboard-secondary-button"
                  to="/artist/artworks"
                >
                  Manage Portfolio
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </section>

          <section className="dashboard-stat-grid">
            <ArtistStatCard
              icon={<Images size={26} />}
              title="Total Artworks"
              value={formatNumber(
                stats.total_artworks
              )}
              note={`${formatNumber(
                stats.published_artworks
              )} published`}
            />

            <ArtistStatCard
              icon={<Eye size={26} />}
              title="Portfolio Views"
              value={formatNumber(
                stats.total_views
              )}
              note="Across all artworks"
            />

            <ArtistStatCard
              icon={<Users size={26} />}
              title="Followers"
              value={formatNumber(
                stats.followers
              )}
              note="Collectors following you"
            />

            <ArtistStatCard
              icon={<Star size={26} />}
              title="Average Rating"
              value={
                Number(stats.average_rating) > 0
                  ? Number(
                      stats.average_rating
                    ).toFixed(1)
                  : "0.0"
              }
              note="From collector reviews"
            />

            <ArtistStatCard
              icon={<ShoppingBag size={26} />}
              title="Artwork Sales"
              value={formatNumber(
                stats.total_sales
              )}
              note="Completed sales"
            />

            <ArtistStatCard
              icon={<DollarSign size={26} />}
              title="Earnings"
              value={formatCurrency(
                stats.total_earnings
              )}
              note="Total artist revenue"
            />
          </section>

          <section className="artist-dashboard-main-grid">
            <article className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <h2>Recent Artworks</h2>

                <Link to="/artist/artworks">
                  View all
                </Link>
              </div>

              {recentArtworks.length > 0 ? (
                <div className="artist-dashboard-artwork-grid">
                  {recentArtworks
                    .slice(0, 4)
                    .map((artwork, index) => (
                      <Link
                        className="artist-dashboard-artwork-card"
                        key={
                          artwork?.id ||
                          `${artwork?.title}-${index}`
                        }
                        to={`/artworks/${artwork.id}`}
                      >
                        <div className="artist-dashboard-artwork-image">
                          <ArtworkThumbnail
                            artwork={artwork}
                          />

                          <span>
                            {artwork?.status ||
                              "draft"}
                          </span>
                        </div>

                        <div className="artist-dashboard-artwork-copy">
                          <strong>
                            {artwork?.title ||
                              "Untitled Artwork"}
                          </strong>

                          <small>
                            {formatNumber(
                              artwork?.views
                            )}{" "}
                            views
                          </small>
                        </div>
                      </Link>
                    ))}
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  <Images size={34} />

                  <strong>
                    No artworks uploaded yet
                  </strong>

                  <p>
                    Upload your first artwork to
                    begin building your portfolio.
                  </p>

                  <Link to="/artist/upload">
                    Upload artwork
                  </Link>
                </div>
              )}
            </article>

            <article className="dashboard-panel artist-dashboard-actions-panel">
              <div className="dashboard-panel-heading">
                <h2>Quick Actions</h2>
              </div>

              <Link
                className="artist-dashboard-action"
                to="/artist/upload"
              >
                <span>
                  <Upload size={21} />
                </span>

                <div>
                  <strong>
                    Upload new artwork
                  </strong>

                  <small>
                    Add a new piece to your
                    portfolio
                  </small>
                </div>

                <ArrowRight size={18} />
              </Link>

              <Link
                className="artist-dashboard-action"
                to="/artist/artworks"
              >
                <span>
                  <Images size={21} />
                </span>

                <div>
                  <strong>
                    Manage portfolio
                  </strong>

                  <small>
                    Edit, publish or remove artworks
                  </small>
                </div>

                <ArrowRight size={18} />
              </Link>

              <Link
                className="artist-dashboard-action"
                to="/profile"
              >
                <span>
                  <UserRound size={21} />
                </span>

                <div>
                  <strong>
                    Edit artist profile
                  </strong>

                  <small>
                    Update your bio and profile image
                  </small>
                </div>

                <ArrowRight size={18} />
              </Link>

              <Link
                className="artist-dashboard-action"
                to="/curator/exhibitions"
              >
                <span>
                  <BookOpen size={21} />
                </span>

                <div>
                  <strong>
                    Manage exhibitions
                  </strong>

                  <small>
                    Curate and organize collections
                  </small>
                </div>

                <ArrowRight size={18} />
              </Link>
            </article>
          </section>

          <section className="artist-dashboard-bottom-grid">
            <article className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <h2>Recent Sales</h2>

                <Link to="/orders">
                  View all
                </Link>
              </div>

              {recentSales.length > 0 ? (
                <div className="artist-dashboard-sales-list">
                  {recentSales
                    .slice(0, 4)
                    .map((sale, index) => (
                      <div
                        className="artist-dashboard-sale-row"
                        key={
                          sale?.id ||
                          sale?.order_id ||
                          index
                        }
                      >
                        <span>
                          <ShoppingBag size={18} />
                        </span>

                        <div>
                          <strong>
                            {sale?.artwork_title ||
                              sale?.artwork?.title ||
                              "Artwork sale"}
                          </strong>

                          <small>
                            {sale?.buyer_name ||
                              sale?.customer_name ||
                              "ArtVault collector"}
                          </small>
                        </div>

                        <b>
                          {formatCurrency(
                            sale?.artist_earnings ??
                              sale?.total_amount ??
                              sale?.total
                          )}
                        </b>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  <ShoppingBag size={32} />

                  <strong>
                    No sales yet
                  </strong>

                  <p>
                    Completed artwork sales will
                    appear here.
                  </p>
                </div>
              )}
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <h2>Studio Summary</h2>
              </div>

              <div className="artist-dashboard-summary">
                <div>
                  <span>
                    <Images size={19} />
                  </span>

                  <p>
                    <strong>
                      {formatNumber(
                        stats.published_artworks
                      )}
                    </strong>
                    <small>
                      Published artworks
                    </small>
                  </p>
                </div>

                <div>
                  <span>
                    <BookOpen size={19} />
                  </span>

                  <p>
                    <strong>
                      {formatNumber(
                        stats.draft_artworks
                      )}
                    </strong>
                    <small>
                      Draft artworks
                    </small>
                  </p>
                </div>

                <div>
                  <span>
                    <MessageSquareText size={19} />
                  </span>

                  <p>
                    <strong>
                      {formatNumber(
                        stats.unread_messages
                      )}
                    </strong>
                    <small>
                      Unread messages
                    </small>
                  </p>
                </div>
              </div>
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}