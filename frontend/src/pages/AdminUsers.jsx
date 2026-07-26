import {
  useEffect,
  useMemo,
  useState,
} from "react";
import "../styles/AdminUsers.css";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import toast from "react-hot-toast";

import PageHero from "../components/PageHero";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";


const ROLE_OPTIONS = [
  "all",
  "visitor",
  "artist",
  "curator",
  "admin",
];

const STATUS_OPTIONS = [
  "all",
  "active",
  "inactive",
];


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


function formatDate(value) {
  if (!value) {
    return "—";
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


export default function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    verified: 0,
  });

  const [searchTerm, setSearchTerm] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [page, setPage] =
    useState(1);

  const [pages, setPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState(null);


  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (searchTerm.trim()) {
      params.set(
        "search",
        searchTerm.trim()
      );
    }

    if (roleFilter !== "all") {
      params.set("role", roleFilter);
    }

    if (statusFilter !== "all") {
      params.set(
        "status",
        statusFilter
      );
    }

    params.set("page", String(page));
    params.set("per_page", "10");

    return params.toString();
  }, [
    searchTerm,
    roleFilter,
    statusFilter,
    page,
  ]);


  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/users/admin?${queryString}`
      );

      const payload = response.data || {};

      setUsers(payload.users || []);
      setSummary(
        payload.summary || {
          total: 0,
          active: 0,
          inactive: 0,
          verified: 0,
        }
      );

      setPages(
        Math.max(
          Number(
            payload.pagination?.pages || 1
          ),
          1
        )
      );
    } catch (requestError) {
      console.error(
        "Admin users loading error:",
        requestError
      );

      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.msg ||
          "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [queryString]);


  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    roleFilter,
    statusFilter,
  ]);


  async function toggleUserStatus(account) {
    if (
      Number(account.id) ===
      Number(currentUser?.id)
    ) {
      toast.error(
        "You cannot suspend your own admin account."
      );
      return;
    }

    const nextStatus = !account.is_active;

    const actionText = nextStatus
      ? "activate"
      : "suspend";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${account.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(account.id);

      const response = await api.patch(
        `/users/admin/${account.id}/status`,
        {
          is_active: nextStatus,
        }
      );

      const updatedUser =
        response.data?.user;

      setUsers((current) =>
        current.map((item) =>
          item.id === account.id
            ? {
                ...item,
                ...updatedUser,
              }
            : item
        )
      );

      setSummary((current) => ({
        ...current,
        active:
          current.active +
          (nextStatus ? 1 : -1),
        inactive:
          current.inactive +
          (nextStatus ? -1 : 1),
      }));

      toast.success(
        response.data?.message ||
          `User ${
            nextStatus
              ? "activated"
              : "suspended"
          } successfully.`
      );
    } catch (requestError) {
      console.error(
        "User status update error:",
        requestError
      );

      toast.error(
        requestError.response?.data?.error ||
          requestError.response?.data?.msg ||
          "Unable to update user status."
      );
    } finally {
      setUpdatingId(null);
    }
  }


  return (
    <>
      <PageHero
        eyebrow="Administration"
        title="User management"
      />

      <section className="container">
        <div className="admin-users-summary-grid">
          <article className="panel admin-users-summary-card">
            <Users size={22} />

            <div>
              <span>Total users</span>
              <strong>
                {summary.total}
              </strong>
            </div>
          </article>

          <article className="panel admin-users-summary-card">
            <UserCheck size={22} />

            <div>
              <span>Active</span>
              <strong>
                {summary.active}
              </strong>
            </div>
          </article>

          <article className="panel admin-users-summary-card">
            <Ban size={22} />

            <div>
              <span>Inactive</span>
              <strong>
                {summary.inactive}
              </strong>
            </div>
          </article>

          <article className="panel admin-users-summary-card">
            <ShieldCheck size={22} />

            <div>
              <span>Verified</span>
              <strong>
                {summary.verified}
              </strong>
            </div>
          </article>
        </div>

        <section className="panel admin-users-panel">
          <div className="admin-users-toolbar">
            <label className="admin-users-search">
              <Search size={18} />

              <input
                type="search"
                value={searchTerm}
                placeholder="Search by name or email"
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />
            </label>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value
                )
              }
            >
              {ROLE_OPTIONS.map((role) => (
                <option
                  key={role}
                  value={role}
                >
                  {role === "all"
                    ? "All roles"
                    : capitalize(role)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status === "all"
                      ? "All statuses"
                      : capitalize(status)}
                  </option>
                )
              )}
            </select>

            <button
              className="text-btn admin-users-refresh"
              type="button"
              onClick={loadUsers}
              disabled={loading}
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "admin-users-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>

          {error && (
            <div className="admin-users-error">
              {error}
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="admin-users-message"
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="admin-users-message"
                    >
                      No users match the selected
                      filters.
                    </td>
                  </tr>
                ) : (
                  users.map((account) => {
                    const isCurrentUser =
                      Number(account.id) ===
                      Number(currentUser?.id);

                    return (
                      <tr key={account.id}>
                        <td>
                          <div className="admin-user-identity">
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
                                {account.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="admin-user-role">
                            {capitalize(
                              account.role
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status ${
                              account.is_verified
                                ? "success"
                                : "warning"
                            }`}
                          >
                            {account.is_verified
                              ? "Verified"
                              : "Unverified"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status ${
                              account.is_active
                                ? "success"
                                : "danger"
                            }`}
                          >
                            {account.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            account.created_at
                          )}
                        </td>

                        <td>
                          <button
                            className={`admin-user-action ${
                              account.is_active
                                ? "admin-user-action-danger"
                                : "admin-user-action-success"
                            }`}
                            type="button"
                            disabled={
                              isCurrentUser ||
                              updatingId ===
                                account.id
                            }
                            onClick={() =>
                              toggleUserStatus(
                                account
                              )
                            }
                          >
                            {updatingId ===
                            account.id ? (
                              "Updating..."
                            ) : account.is_active ? (
                              <>
                                <Ban size={15} />
                                Suspend
                              </>
                            ) : (
                              <>
                                <CheckCircle2
                                  size={15}
                                />
                                Activate
                              </>
                            )}
                          </button>

                          {isCurrentUser && (
                            <small className="admin-current-user-note">
                              Current admin
                            </small>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-users-pagination">
            <span>
              Page {page} of {pages}
            </span>

            <div>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      current - 1,
                      1
                    )
                  )
                }
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= pages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      current + 1,
                      pages
                    )
                  )
                }
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}