import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Bell,
  BookOpen,
  Box,
  ChevronDown,
  CircleUserRound,
  Crown,
  Download,
  Gavel,
  Grid2X2,
  Heart,
  LogOut,
  Mail,
  Package,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

import AdminDashboard from "./AdminDashboard";

import "../styles/Dashboard.css";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const FALLBACK_STATS = {
  total_orders: 0,
  total_spent: 0,
  wishlist_items: 0,
  artists_followed: 0,
  unread_messages: 0,
  unread_notifications: 0,
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function capitalize(value) {
  if (!value) {
    return "Pending";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function getOrderStatusClass(status) {
  const normalizedStatus = String(
    status || ""
  ).toLowerCase();

  if (
    normalizedStatus === "delivered" ||
    normalizedStatus === "completed" ||
    normalizedStatus === "paid"
  ) {
    return "dashboard-status-success";
  }

  if (
    normalizedStatus === "shipped" ||
    normalizedStatus === "confirmed"
  ) {
    return "dashboard-status-warning";
  }

  if (
    normalizedStatus === "cancelled" ||
    normalizedStatus === "failed"
  ) {
    return "dashboard-status-danger";
  }

  return "dashboard-status-info";
}

function DashboardArtworkImage({
  artwork,
  className = "",
}) {
  const [failed, setFailed] = useState(false);

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
      <div
        className={`dashboard-image-placeholder ${className}`}
      >
        <BookOpen size={26} />
      </div>
    );
  }

  return (
    <img
      className={className}
      src={imageUrl}
      alt={artwork?.title || "Artwork"}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function DashboardStatCard({
  icon,
  title,
  value,
  note,
  positive = true,
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

        {note && (
          <span
            className={`dashboard-stat-note ${
              positive
                ? "dashboard-positive"
                : "dashboard-neutral"
            }`}
          >
            {positive ? "↗" : "•"} {note}
          </span>
        )}
      </div>
    </article>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    user,
    logout,
    isAdmin,
  } = useAuth();

  const [dashboardData, setDashboardData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedPeriod, setSelectedPeriod] =
    useState("year");

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const role = String(
    user?.role || "visitor"
  ).toLowerCase();

  if (isAdmin) {
    return <AdminDashboard />;
  }

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      if (!user) {
        if (mounted) {
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setError("");

        let endpoint = "/dashboard/visitor";

        if (role === "artist") {
          endpoint = "/dashboard/artist";
        } else if (role === "curator") {
          endpoint = "/dashboard/curator";
        } else if (
          role === "collector" ||
          role === "customer"
        ) {
          endpoint = "/dashboard/collector";
        }

        const response = await api.get(endpoint);

        if (mounted) {
          setDashboardData(response.data || {});
        }
      } catch (requestError) {
        console.error(
          "Dashboard loading error:",
          requestError
        );

        if (mounted) {
          setError(
            requestError.response?.data?.error ||
              requestError.response?.data?.msg ||
              "Unable to load your dashboard data."
          );

          setDashboardData({});
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [user, role, isAdmin]);

  const stats = {
    ...FALLBACK_STATS,
    ...(dashboardData?.stats || {}),
  };

  const recentOrders =
    dashboardData?.recent_orders || [];

  const recommendations =
    dashboardData?.recommended_artworks ||
    dashboardData?.recommendations ||
    [];

  const spendingData = useMemo(() => {
    const backendData =
      dashboardData?.monthly_spending ||
      dashboardData?.spending_overview ||
      [];

    if (!Array.isArray(backendData)) {
      return MONTHS.map((month) => ({
        month,
        amount: 0,
      }));
    }

    if (backendData.length === 0) {
      return MONTHS.map((month) => ({
        month,
        amount: 0,
      }));
    }

    return backendData.map((item, index) => ({
      month:
        item?.month ||
        item?.label ||
        MONTHS[index] ||
        `M${index + 1}`,

      amount: Number(
        item?.amount ??
          item?.total ??
          item?.value ??
          0
      ),
    }));
  }, [dashboardData]);

  const maximumSpending = useMemo(() => {
    return Math.max(
      ...spendingData.map((item) =>
        Number(item.amount || 0)
      ),
      0
    );
  }, [spendingData]);

  const chartDisplayMaximum =
    maximumSpending <= 0
      ? 20000
      : Math.max(
          5000,
          Math.ceil(maximumSpending / 5000) * 5000
        );

  const chartPoints = useMemo(() => {
    if (spendingData.length === 0) {
      return "";
    }

    return spendingData
      .map((item, index) => {
        const x =
          spendingData.length === 1
            ? 50
            : (index /
                (spendingData.length - 1)) *
              100;

        const y =
          92 -
          (Number(item.amount || 0) /
            chartDisplayMaximum) *
            74;

        return `${x},${Math.max(10, y)}`;
      })
      .join(" ");
  }, [spendingData, chartDisplayMaximum]);

  const firstName =
    dashboardData?.user?.name?.split(" ")[0] ||
    user?.name?.split(" ")[0] ||
    "Member";

  const fullName =
    dashboardData?.user?.name ||
    user?.name ||
    "ArtVault Member";

  const profileImage =
    dashboardData?.user?.profile_image ||
    user?.profile_image ||
    user?.avatar ||
    "";

  const notificationCount =
    stats.unread_notifications || 0;

  const messageCount =
    stats.unread_messages || 0;

  const cartCount =
    stats.cart_items || 0;

  const wishlistCount =
    stats.wishlist_items || 0;

  const navigationItems = [
    {
      label: "Dashboard",
      icon: <Grid2X2 size={20} />,
      to: "/dashboard",
    },
    {
      label: "Explore",
      icon: <Search size={20} />,
      to: "/explore",
    },
    {
      label: "Collections",
      icon: <UsersRound size={20} />,
      to: "/collections",
    },
    {
      label: "Exhibitions",
      icon: <BookOpen size={20} />,
      to: "/exhibitions",
    },
    {
      label: "Auctions",
      icon: <Gavel size={20} />,
      to: "/auctions",
    },
    {
      label: "Wishlist",
      icon: <Heart size={20} />,
      to: "/wishlist",
    },
    {
      label: "Orders",
      icon: <Package size={20} />,
      to: "/orders",
    },
    {
      label: "Downloads",
      icon: <Download size={20} />,
      to: "/downloads",
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
      count: messageCount,
    },
    {
      label: "Notifications",
      icon: <Bell size={20} />,
      to: "/notifications",
      count: notificationCount,
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
      if (logout) {
        await logout();
      }

      navigate("/login");
    } catch (logoutError) {
      console.error(
        "Logout failed:",
        logoutError
      );

      navigate("/login");
    }
  };

  if (loading) {
    return (
      <main className="collector-dashboard">
        <div className="dashboard-loading">
          <div className="dashboard-loader" />

          <h2>Preparing your ArtVault</h2>

          <p>
            Loading your collection, orders and
            recommendations.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="collector-dashboard">
      <header className="dashboard-topbar">
        <Link
          className="dashboard-brand"
          to="/"
          aria-label="ArtVault home"
        >
          <span className="dashboard-logo-art">ART</span>
          <span className="dashboard-logo-vault">VAULT</span>
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
              setSearchTerm(event.target.value)
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
            to="/wishlist"
            aria-label="Wishlist"
          >
            <Heart size={23} />

            {wishlistCount > 0 && (
              <span>
                {wishlistCount > 99
                  ? "99+"
                  : wishlistCount}
              </span>
            )}
          </Link>

          <Link
            className="dashboard-icon-button"
            to="/cart"
            aria-label="Shopping cart"
          >
            <ShoppingCart size={23} />

            {cartCount > 0 && (
              <span>
                {cartCount > 99
                  ? "99+"
                  : cartCount}
              </span>
            )}
          </Link>

          <Link
            className="dashboard-icon-button"
            to="/notifications"
            aria-label="Notifications"
          >
            <Bell size={23} />

            {notificationCount > 0 && (
              <span>
                {notificationCount > 99
                  ? "99+"
                  : notificationCount}
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

                <span>
                  {isAdmin && role === "artist"
                    ? "Artist · Admin"
                    : isAdmin
                      ? "Admin"
                      : capitalize(role)}
                </span>
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
                Dashboard data could not be loaded.
              </strong>

              <span>{error}</span>
            </div>
          )}

          <section className="dashboard-hero">
            <div className="dashboard-hero-overlay" />

            <div className="dashboard-hero-content">
              <span>Welcome back,</span>

              <h1>
                {firstName}

                <Crown size={31} />
              </h1>

              <p>
                Discover, collect and support
                incredible artists from around the
                world.
              </p>

              <Link
                className="dashboard-primary-button"
                to="/explore"
              >
                Explore Artworks
                <ArrowRight size={19} />
              </Link>
            </div>
          </section>

          <section className="dashboard-stat-grid">
            <DashboardStatCard
              icon={<ShoppingBag size={26} />}
              title="Total Orders"
              value={formatNumber(
                stats.total_orders
              )}
              note={
                stats.orders_change_percentage
                  ? `${stats.orders_change_percentage}% from last month`
                  : "Your completed purchases"
              }
            />

            <DashboardStatCard
              icon={<WalletCards size={26} />}
              title="Total Spent"
              value={formatCurrency(
                stats.total_spent
              )}
              note={
                stats.spending_change_percentage
                  ? `${stats.spending_change_percentage}% from last month`
                  : "Across all orders"
              }
            />

            <DashboardStatCard
              icon={<Heart size={26} />}
              title="Wishlist Items"
              value={formatNumber(
                stats.wishlist_items
              )}
              note={
                stats.wishlist_change_percentage
                  ? `${stats.wishlist_change_percentage}% from last month`
                  : "Saved artworks"
              }
            />

            <DashboardStatCard
              icon={<UserRound size={26} />}
              title="Artists Followed"
              value={formatNumber(
                stats.artists_followed
              )}
              note={
                stats.following_change_percentage
                  ? `${stats.following_change_percentage}% from last month`
                  : "Artists you support"
              }
            />
          </section>

          <section className="dashboard-middle-grid">
            <article className="dashboard-panel dashboard-chart-panel">
              <div className="dashboard-panel-heading">
                <h2>Spending Overview</h2>

                <select
                  value={selectedPeriod}
                  onChange={(event) =>
                    setSelectedPeriod(
                      event.target.value
                    )
                  }
                >
                  <option value="year">
                    This Year
                  </option>

                  <option value="six-months">
                    Last 6 Months
                  </option>
                </select>
              </div>

              <div className="dashboard-chart">
                <div className="dashboard-chart-y-axis">
                  <span>
                    {formatCurrency(
                      chartDisplayMaximum
                    )}
                  </span>

                  <span>
                    {formatCurrency(
                      chartDisplayMaximum * 0.75
                    )}
                  </span>

                  <span>
                    {formatCurrency(
                      chartDisplayMaximum * 0.5
                    )}
                  </span>

                  <span>
                    {formatCurrency(
                      chartDisplayMaximum * 0.25
                    )}
                  </span>

                  <span>₹0</span>
                </div>

                <div className="dashboard-chart-plot">
                  <div className="dashboard-grid-lines">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  <svg
                    className="dashboard-line-chart"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Monthly spending chart"
                  >
                    <defs>
                      <linearGradient
                        id="dashboard-chart-fill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#e9ae36"
                          stopOpacity="0.35"
                        />

                        <stop
                          offset="100%"
                          stopColor="#e9ae36"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    <polygon
                      points={`0,100 ${chartPoints} 100,100`}
                      fill="url(#dashboard-chart-fill)"
                    />

                    <polyline
                      points={chartPoints}
                      fill="none"
                      stroke="#efb33e"
                      strokeWidth="1.4"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  <div className="dashboard-chart-points">
                    {spendingData.map(
                      (item, index) => {
                        const left =
                          spendingData.length === 1
                            ? 50
                            : (index /
                                (spendingData.length -
                                  1)) *
                              100;

                        const top =
                          92 -
                          (Number(
                            item.amount || 0
                          ) /
                            chartDisplayMaximum) *
                            74;

                        return (
                          <span
                            key={`${item.month}-${index}`}
                            title={`${item.month}: ${formatCurrency(
                              item.amount
                            )}`}
                            style={{
                              left: `${left}%`,
                              top: `${Math.max(
                                10,
                                top
                              )}%`,
                            }}
                          />
                        );
                      }
                    )}
                  </div>

                  <div className="dashboard-chart-x-axis">
                    {spendingData.map(
                      (item, index) => (
                        <span
                          key={`${item.month}-${index}`}
                        >
                          {item.month}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </article>

            <article className="dashboard-panel dashboard-orders-panel">
              <div className="dashboard-panel-heading">
                <h2>Recent Orders</h2>

                <Link to="/orders">
                  View all
                </Link>
              </div>

              <div className="dashboard-order-list">
                {recentOrders.length > 0 ? (
                  recentOrders
                    .slice(0, 3)
                    .map((order, index) => {
                      const artwork =
                        order?.artwork ||
                        order?.items?.[0]
                          ?.artwork ||
                        order?.artworks?.[0] ||
                        {};

                      const orderId =
                        order?.id ||
                        order?.order_id ||
                        index;

                      return (
                        <Link
                          className="dashboard-order-item"
                          key={orderId}
                          to={`/orders/${orderId}`}
                        >
                          <DashboardArtworkImage
                            artwork={artwork}
                            className="dashboard-order-image"
                          />

                          <div className="dashboard-order-info">
                            <strong>
                              {artwork?.title ||
                                order?.artwork_title ||
                                "Artwork Order"}
                            </strong>

                            <span>
                              by{" "}
                              {artwork?.artist?.name ||
                                artwork?.artist_name ||
                                order?.artist_name ||
                                "ArtVault Artist"}
                            </span>

                            <b>
                              {formatCurrency(
                                order?.total_amount ??
                                  order?.total ??
                                  artwork?.price
                              )}
                            </b>
                          </div>

                          <div className="dashboard-order-status">
                            <span
                              className={getOrderStatusClass(
                                order?.status
                              )}
                            >
                              {capitalize(
                                order?.status
                              )}
                            </span>

                            <small>
                              {formatDate(
                                order?.created_at ||
                                  order?.order_date
                              )}
                            </small>
                          </div>
                        </Link>
                      );
                    })
                ) : (
                  <div className="dashboard-empty-state">
                    <Box size={32} />

                    <strong>
                      No recent orders
                    </strong>

                    <p>
                      Your purchased artworks will
                      appear here.
                    </p>

                    <Link to="/explore">
                      Browse artworks
                    </Link>
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="dashboard-bottom-grid">
            <article className="dashboard-panel dashboard-recommended-panel">
              <div className="dashboard-panel-heading">
                <h2>Recommended For You</h2>

                <Link to="/explore">
                  View all
                </Link>
              </div>

              <div className="dashboard-artwork-grid">
                {recommendations.length > 0 ? (
                  recommendations
                    .slice(0, 5)
                    .map((artwork, index) => (
                      <article
                        className="dashboard-artwork-card"
                        key={
                          artwork?.id ||
                          `${artwork?.title}-${index}`
                        }
                      >
                        <Link
                          className="dashboard-artwork-image-wrapper"
                          to={`/artworks/${artwork.id}`}
                        >
                          <DashboardArtworkImage
                            artwork={artwork}
                            className="dashboard-artwork-image"
                          />

                          <button
                            type="button"
                            className="dashboard-artwork-heart"
                            aria-label={`Save ${
                              artwork?.title ||
                              "artwork"
                            }`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                          >
                            <Heart size={18} />
                          </button>
                        </Link>

                        <div className="dashboard-artwork-details">
                          <Link
                            to={`/artworks/${artwork.id}`}
                          >
                            {artwork?.title ||
                              "Untitled Artwork"}
                          </Link>

                          <span>
                            by{" "}
                            {artwork?.artist?.name ||
                              artwork?.artist_name ||
                              "Independent Artist"}
                          </span>

                          <strong>
                            {formatCurrency(
                              artwork?.price
                            )}
                          </strong>
                        </div>
                      </article>
                    ))
                ) : (
                  <div className="dashboard-empty-recommendations">
                    <Heart size={29} />

                    <strong>
                      Recommendations are being
                      prepared
                    </strong>

                    <p>
                      Explore and wishlist artworks
                      to improve your recommendations.
                    </p>

                    <Link to="/explore">
                      Explore collection
                    </Link>
                  </div>
                )}
              </div>
            </article>

            <article className="dashboard-support-card">
              <div className="dashboard-support-content">
                <Crown size={24} />

                <h2>
                  Support artists.
                  <br />
                  Own a masterpiece.
                </h2>

                <p>
                  Every purchase empowers creativity.
                </p>

                <Link to="/explore">
                  Explore Now
                  <ArrowRight size={17} />
                </Link>
              </div>

              <div className="dashboard-support-statue">
                <Crown size={90} />
              </div>
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}