import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  Archive,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  Crown,
  Eye,
  FileText,
  GalleryVerticalEnd,
  Heart,
  Images,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../utils/imageUrl";

import "../styles/AdminDashboard.css";


function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}


function formatNumber(value) {
  return Number(value || 0).toLocaleString(
    "en-IN"
  );
}


function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function capitalize(value) {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


function statusClass(status) {
  const value = String(
    status || ""
  ).toLowerCase();

  if (
    value === "active" ||
    value === "published" ||
    value === "paid" ||
    value === "delivered" ||
    value === "verified"
  ) {
    return "admin-status-success";
  }

  if (
    value === "pending" ||
    value === "draft" ||
    value === "shipped"
  ) {
    return "admin-status-warning";
  }

  if (
    value === "cancelled" ||
    value === "inactive" ||
    value === "archived"
  ) {
    return "admin-status-danger";
  }

  return "admin-status-neutral";
}


function AdminArtworkImage({
  artwork,
  className = "",
}) {
  const [failed, setFailed] = useState(false);

  const rawImage =
    artwork?.image_url ||
    artwork?.image ||
    artwork?.thumbnail_url;

  const imageUrl = rawImage
    ? getImageUrl(rawImage)
    : "";

  if (!imageUrl || failed) {
    return (
      <div
        className={`admin-image-placeholder ${className}`}
      >
        <Images size={24} />
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


function AdminMetricCard({
  icon,
  label,
  value,
  note,
  accent = false,
}) {
  return (
    <article
      className={`admin-metric-card ${
        accent
          ? "admin-metric-card-accent"
          : ""
      }`}
    >
      <div className="admin-metric-icon">
        {icon}
      </div>

      <div className="admin-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}


export default function AdminDashboard() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [profileOpen, setProfileOpen] =
    useState(false);


  useEffect(() => {
    let mounted = true;

    async function loadAdminDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/dashboard/admin"
        );

        if (mounted) {
          setData(response.data || {});
        }
      } catch (requestError) {
        console.error(
          "Admin dashboard error:",
          requestError
        );

        if (mounted) {
          setError(
            requestError.response?.data?.error ||
              requestError.response?.data?.msg ||
              "Unable to load the admin dashboard."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAdminDashboard();

    return () => {
      mounted = false;
    };
  }, []);


  const users = data?.users || {};
  const artworks = data?.artworks || {};
  const orders = data?.orders || {};
  const exhibitions =
    data?.exhibitions || {};
  const reviews = data?.reviews || {};
  const engagement =
    data?.engagement || {};

  const topArtworks =
    data?.top_artworks || [];

  const topArtists =
    data?.top_artists || [];

  const recentUsers =
    data?.recent_users || [];

  const recentOrders =
    data?.recent_orders || [];

  const recentExhibitions =
    data?.recent_exhibitions || [];


  const roleDistribution = useMemo(() => {
    const rows = [
      {
        label: "Artists",
        value: users.artists || 0,
      },
      {
        label: "Visitors",
        value: users.visitors || 0,
      },
      {
        label: "Curators",
        value: users.curators || 0,
      },
      {
        label: "Admins",
        value: users.admins || 0,
      },
    ];

    const maximum = Math.max(
      ...rows.map((item) => item.value),
      1
    );

    return rows.map((item) => ({
      ...item,
      percentage:
        (item.value / maximum) * 100,
    }));
  }, [users]);


  const orderDistribution = useMemo(() => {
    const rows = [
      {
        label: "Pending",
        value: orders.pending || 0,
      },
      {
        label: "Paid",
        value: orders.paid || 0,
      },
      {
        label: "Shipped",
        value: orders.shipped || 0,
      },
      {
        label: "Delivered",
        value: orders.delivered || 0,
      },
      {
        label: "Cancelled",
        value: orders.cancelled || 0,
      },
    ];

    const maximum = Math.max(
      ...rows.map((item) => item.value),
      1
    );

    return rows.map((item) => ({
      ...item,
      percentage:
        (item.value / maximum) * 100,
    }));
  }, [orders]);


  const fullName =
    user?.name || "ArtVault Admin";

  const profileImage =
    user?.avatar_url ||
    user?.profile_image ||
    user?.avatar ||
    "";


  const navigationItems = [
    {
      label: "Overview",
      icon: <LayoutDashboard size={19} />,
      to: "/dashboard",
    },
    {
      label: "Users",
      icon: <Users size={19} />,
      to: "/admin/users",
    },
    {
      label: "Artworks",
      icon: <GalleryVerticalEnd size={19} />,
      to: "/admin/artworks",
    },
    {
      label: "Reviews",
      icon: <Star size={19} />,
      to: "/artworks",
    },
    {
      label: "Orders",
      icon: <Package size={19} />,
      to: "/orders",
    },
    {
      label: "Exhibitions",
      icon: <Store size={19} />,
      to: "/exhibitions",
    },
    {
      label: "Reports",
      icon: <BarChart3 size={19} />,
      to: "/admin/reports",
    },
  ];


  const handleSearch = (event) => {
    event.preventDefault();

    const value = searchTerm.trim();

    if (!value) {
      return;
    }

    navigate(
      `/admin/users?search=${encodeURIComponent(
        value
      )}`
    );
  };


  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
    } finally {
      navigate("/login");
    }
  };


  if (loading) {
    return (
      <main className="admin-dashboard">
        <section className="admin-loading">
          <div className="admin-loading-ring" />
          <h1>Preparing command center</h1>
          <p>
            Loading users, artworks, orders and
            platform intelligence.
          </p>
        </section>
      </main>
    );
  }


  return (
    <main className="admin-dashboard">
      <header className="admin-topbar">
        <Link
          className="admin-brand"
          to="/"
        >
          <span>ART</span>
          <strong>VAULT</strong>
        </Link>

        <form
          className="admin-search"
          onSubmit={handleSearch}
        >
          <Search size={19} />

          <input
            type="search"
            placeholder="Search users, artworks or orders"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </form>

        <div className="admin-topbar-actions">
          <Link
            className="admin-icon-button"
            to="/notifications"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </Link>

          <div className="admin-profile-wrap">
            <button
              className="admin-profile-button"
              type="button"
              onClick={() =>
                setProfileOpen(
                  (current) => !current
                )
              }
            >
              {profileImage ? (
                <img
                  src={getImageUrl(
                    profileImage
                  )}
                  alt={fullName}
                />
              ) : (
                <span className="admin-avatar">
                  {fullName
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

              <div>
                <strong>{fullName}</strong>
                <span>Platform administrator</span>
              </div>

              <ChevronDown size={17} />
            </button>

            {profileOpen && (
              <div className="admin-profile-menu">
                <Link to="/profile">
                  <UserRound size={17} />
                  Profile
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

      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-heading">
            <ShieldCheck size={19} />
            <span>Administration</span>
          </div>

          <nav>
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={
                  item.label === "Overview"
                    ? "admin-nav-link admin-nav-active"
                    : "admin-nav-link"
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <div>
              <Crown size={18} />
              <span>
                Secure admin workspace
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        <section className="admin-content">
          {error && (
            <div className="admin-error">
              <strong>
                Dashboard data could not be loaded.
              </strong>
              <span>{error}</span>
            </div>
          )}

          <section className="admin-welcome">
            <div>
              <span className="admin-eyebrow">
                Platform control center
              </span>

              <h1>
                Good to see you,{" "}
                {fullName.split(" ")[0]}
              </h1>

              <p>
                Monitor growth, moderate content and
                keep ArtVault running smoothly.
              </p>
            </div>

            <div className="admin-welcome-badge">
              <Sparkles size={18} />
              <span>
                Live platform overview
              </span>
            </div>
          </section>

          <section className="admin-metric-grid">
            <AdminMetricCard
              icon={<UsersRound size={24} />}
              label="Total users"
              value={formatNumber(
                users.total
              )}
              note={`${formatNumber(
                users.active
              )} active accounts`}
            />

            <AdminMetricCard
              icon={<Images size={24} />}
              label="Total artworks"
              value={formatNumber(
                artworks.total
              )}
              note={`${formatNumber(
                artworks.published
              )} published`}
            />

            <AdminMetricCard
              icon={<ShoppingBag size={24} />}
              label="Total orders"
              value={formatNumber(
                orders.total
              )}
              note={`${formatNumber(
                orders.pending
              )} pending`}
            />

            <AdminMetricCard
              icon={
                <CircleDollarSign size={24} />
              }
              label="Platform revenue"
              value={formatCurrency(
                orders.revenue
              )}
              note={`${formatNumber(
                orders.items_sold
              )} items sold`}
              accent
            />

            <AdminMetricCard
              icon={<Store size={24} />}
              label="Exhibitions"
              value={formatNumber(
                exhibitions.total
              )}
              note={`${formatNumber(
                exhibitions.published
              )} published`}
            />

            <AdminMetricCard
              icon={<Star size={24} />}
              label="Reviews"
              value={formatNumber(
                reviews.total
              )}
              note={`${Number(
                reviews.average_rating || 0
              ).toFixed(1)} average rating`}
            />

            <AdminMetricCard
              icon={<Eye size={24} />}
              label="Artwork views"
              value={formatNumber(
                artworks.total_views
              )}
              note="Across the full catalogue"
            />

            <AdminMetricCard
              icon={<Heart size={24} />}
              label="Wishlist saves"
              value={formatNumber(
                engagement.wishlist_adds
              )}
              note={`${formatNumber(
                engagement.follows
              )} artist follows`}
            />
          </section>

          <section className="admin-grid-two">
            <article className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <span>User composition</span>
                  <h2>Accounts by role</h2>
                </div>

                <Link to="/admin/users">
                  Manage users
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="admin-progress-list">
                {roleDistribution.map(
                  (item) => (
                    <div
                      className="admin-progress-row"
                      key={item.label}
                    >
                      <div>
                        <span>{item.label}</span>
                        <strong>
                          {formatNumber(
                            item.value
                          )}
                        </strong>
                      </div>

                      <div className="admin-progress-track">
                        <span
                          style={{
                            width: `${item.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="admin-panel-summary">
                <span>
                  <BadgeCheck size={16} />
                  {formatNumber(
                    users.verified
                  )}{" "}
                  verified
                </span>

                <span>
                  <Archive size={16} />
                  {formatNumber(
                    users.inactive
                  )}{" "}
                  inactive
                </span>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <span>Commerce health</span>
                  <h2>Order status</h2>
                </div>

                <Link to="/admin/orders">
                  View orders
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="admin-progress-list">
                {orderDistribution.map(
                  (item) => (
                    <div
                      className="admin-progress-row"
                      key={item.label}
                    >
                      <div>
                        <span>{item.label}</span>
                        <strong>
                          {formatNumber(
                            item.value
                          )}
                        </strong>
                      </div>

                      <div className="admin-progress-track">
                        <span
                          style={{
                            width: `${item.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="admin-panel-summary">
                <span>
                  <CircleDollarSign size={16} />
                  {formatCurrency(
                    orders.average_order_value
                  )}{" "}
                  average order
                </span>

                <span>
                  <Package size={16} />
                  {formatNumber(
                    orders.delivered
                  )}{" "}
                  delivered
                </span>
              </div>
            </article>
          </section>

          <section className="admin-grid-wide">
            <article className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <span>Catalogue performance</span>
                  <h2>Top artworks</h2>
                </div>

                <Link to="/admin/artworks">
                  Moderate artworks
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="admin-artwork-list">
                {topArtworks.length > 0 ? (
                  topArtworks.map(
                    (artwork, index) => (
                      <Link
                        className="admin-artwork-row"
                        key={artwork.id}
                        to={`/artworks/${artwork.id}`}
                      >
                        <span className="admin-rank">
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </span>

                        <AdminArtworkImage
                          artwork={artwork}
                          className="admin-artwork-thumb"
                        />

                        <div className="admin-artwork-main">
                          <strong>
                            {artwork.title}
                          </strong>

                          <span>
                            {artwork.artist?.name ||
                              "Unknown artist"}
                          </span>
                        </div>

                        <div className="admin-artwork-stat">
                          <Eye size={15} />
                          <span>
                            {formatNumber(
                              artwork.views
                            )}
                          </span>
                        </div>

                        <div className="admin-artwork-stat">
                          <Heart size={15} />
                          <span>
                            {formatNumber(
                              artwork.wishlist_count
                            )}
                          </span>
                        </div>

                        <div className="admin-artwork-stat">
                          <Star size={15} />
                          <span>
                            {Number(
                              artwork.average_rating ||
                                0
                            ).toFixed(1)}
                          </span>
                        </div>

                        <span
                          className={`admin-status ${statusClass(
                            artwork.status
                          )}`}
                        >
                          {capitalize(
                            artwork.status
                          )}
                        </span>
                      </Link>
                    )
                  )
                ) : (
                  <div className="admin-empty">
                    <Images size={28} />
                    <strong>
                      No artworks yet
                    </strong>
                    <span>
                      Published artwork performance
                      will appear here.
                    </span>
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <span>Creator performance</span>
                  <h2>Top artists</h2>
                </div>

                <Link to="/admin/users">
                  View artists
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="admin-artist-list">
                {topArtists.length > 0 ? (
                  topArtists.map(
                    (artist, index) => (
                      <Link
                        className="admin-artist-row"
                        key={artist.id}
                        to={`/artists/${artist.id}`}
                      >
                        <span className="admin-rank">
                          {index + 1}
                        </span>

                        {artist.avatar_url ? (
                          <img
                            src={getImageUrl(
                              artist.avatar_url
                            )}
                            alt={artist.name}
                          />
                        ) : (
                          <span className="admin-artist-avatar">
                            {artist.name
                              ?.charAt(0)
                              .toUpperCase()}
                          </span>
                        )}

                        <div>
                          <strong>
                            {artist.name}
                          </strong>
                          <span>
                            {formatNumber(
                              artist.artwork_count
                            )}{" "}
                            artworks
                          </span>
                        </div>

                        <div className="admin-artist-performance">
                          <strong>
                            {formatNumber(
                              artist.total_views
                            )}
                          </strong>
                          <span>views</span>
                        </div>
                      </Link>
                    )
                  )
                ) : (
                  <div className="admin-empty">
                    <Users size={28} />
                    <strong>
                      No artists yet
                    </strong>
                    <span>
                      Artist performance will appear
                      here.
                    </span>
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="admin-grid-three">
            <article className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <span>Newest accounts</span>
                  <h2>Recent users</h2>
                </div>

                <Link to="/admin/users">
                  View all
                </Link>
              </div>

              <div className="admin-compact-list">
                {recentUsers.slice(0, 5).map(
                  (account) => (
                    <div
                      className="admin-compact-row"
                      key={account.id}
                    >
                      <span className="admin-user-avatar">
                        {account.name
                          ?.charAt(0)
                          .toUpperCase()}
                      </span>

                      <div>
                        <strong>
                          {account.name}
                        </strong>
                        <span>
                          {capitalize(
                            account.role
                          )}{" "}
                          ·{" "}
                          {formatDate(
                            account.created_at
                          )}
                        </span>
                      </div>

                      <span
                        className={`admin-status ${statusClass(
                          account.is_active
                            ? "active"
                            : "inactive"
                        )}`}
                      >
                        {account.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  )
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <span>Latest commerce</span>
                  <h2>Recent orders</h2>
                </div>

                <Link to="/admin/orders">
                  View all
                </Link>
              </div>

              <div className="admin-compact-list">
                {recentOrders.slice(0, 5).map(
                  (order) => (
                    <div
                      className="admin-compact-row"
                      key={order.id}
                    >
                      <span className="admin-order-icon">
                        <Package size={17} />
                      </span>

                      <div>
                        <strong>
                          Order #{order.id}
                        </strong>
                        <span>
                          {order.buyer?.name ||
                            "Unknown buyer"}{" "}
                          ·{" "}
                          {formatDate(
                            order.created_at
                          )}
                        </span>
                      </div>

                      <div className="admin-order-value">
                        <strong>
                          {formatCurrency(
                            order.total_amount
                          )}
                        </strong>

                        <span
                          className={`admin-status ${statusClass(
                            order.status
                          )}`}
                        >
                          {capitalize(
                            order.status
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <span>Curated programme</span>
                  <h2>Recent exhibitions</h2>
                </div>

                <Link to="/admin/exhibitions">
                  View all
                </Link>
              </div>

              <div className="admin-compact-list">
                {recentExhibitions
                  .slice(0, 5)
                  .map((exhibition) => (
                    <div
                      className="admin-compact-row"
                      key={exhibition.id}
                    >
                      <span className="admin-order-icon">
                        <Boxes size={17} />
                      </span>

                      <div>
                        <strong>
                          {exhibition.title}
                        </strong>
                        <span>
                          {exhibition.curator?.name ||
                            "Unknown curator"}{" "}
                          ·{" "}
                          {formatNumber(
                            exhibition.artwork_count
                          )}{" "}
                          artworks
                        </span>
                      </div>

                      <span
                        className={`admin-status ${statusClass(
                          exhibition.status
                        )}`}
                      >
                        {capitalize(
                          exhibition.status
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            </article>
          </section>

          <section className="admin-footer-insight">
            <div>
              <Activity size={21} />

              <div>
                <strong>
                  Platform engagement
                </strong>
                <span>
                  {formatNumber(
                    exhibitions.total_views
                  )}{" "}
                  exhibition views and{" "}
                  {formatNumber(
                    exhibitions.total_likes
                  )}{" "}
                  exhibition likes.
                </span>
              </div>
            </div>

            <Link to="/admin/reports">
              Open analytics
              <FileText size={17} />
            </Link>
          </section>
        </section>
      </div>
    </main>
  );
}