import { useEffect, useState } from "react";
import PageHero from "../components/PageHero";
import api from "../services/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const res = await api.get("/notifications");

      setNotifications(
        res.data.notifications || []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      await api.patch(
        `/notifications/${id}/read`
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                is_read: true,
              }
            : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllRead() {
    try {
      await api.patch(
        "/notifications/read-all"
      );

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteNotification(id) {
    try {
      await api.delete(
        `/notifications/${id}`
      );

      setNotifications((prev) =>
        prev.filter(
          (n) => n.id !== id
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Updates"
        title="Notifications"
      />

      <section className="container panel notification-list">

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 20,
          }}
        >
          <button
            className="btn btn-primary"
            onClick={markAllRead}
          >
            Mark all as read
          </button>
        </div>

        {loading && (
          <p>
            Loading notifications...
          </p>
        )}

        {!loading &&
          notifications.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "50px 0",
                opacity: 0.7,
              }}
            >
              <h3>
                No notifications yet
              </h3>

              <p>
                You're all caught up.
              </p>
            </div>
          )}

        {notifications.map(
          (notification) => (
            <div
              key={notification.id}
              className="notification"
            >
              <span
                className={
                  notification.is_read
                    ? "dot"
                    : "dot active"
                }
              />

              <div
                style={{
                  flex: 1,
                }}
              >
                <strong>
                  {notification.title}
                </strong>

                <p
                  style={{
                    marginTop: 6,
                    marginBottom: 6,
                  }}
                >
                  {
                    notification.message
                  }
                </p>

                <small>
                  {new Date(
                    notification.created_at
                  ).toLocaleString()}
                </small>
              </div>

              {!notification.is_read && (
                <button
                  className="btn btn-outline"
                  onClick={() =>
                    markRead(
                      notification.id
                    )
                  }
                >
                  Read
                </button>
              )}

              <button
                className="btn btn-danger"
                onClick={() =>
                  deleteNotification(
                    notification.id
                  )
                }
              >
                Delete
              </button>
            </div>
          )
        )}
      </section>
    </>
  );
}