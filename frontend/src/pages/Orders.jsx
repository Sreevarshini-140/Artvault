import { useEffect, useState } from "react";
import PageHero from "../components/PageHero";
import api from "../services/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);

      const response = await api.get("/orders");

      setOrders(response.data.orders || []);
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          "Failed to load your orders."
      );
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  return (
    <>
      <PageHero
        eyebrow="Purchases"
        title="Your Orders"
      />

      <section className="container panel table-wrap">

        {loading ? (
          <p>Loading orders...</p>
        ) : message ? (
          <p>{message}</p>
        ) : orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>
                      AV-
                      {String(order.id).padStart(
                        5,
                        "0"
                      )}
                    </strong>
                  </td>

                  <td>
                    {formatDate(
                      order.created_at
                    )}
                  </td>

                  <td>
                    {formatPrice(
                      order.total_amount
                    )}
                  </td>

                  <td>
                    <span
                      className={`status ${
                        order.status ===
                        "paid"
                          ? "success"
                          : ""
                      }`}
                    >
                      {order.status
  ? order.status.charAt(0).toUpperCase() +
    order.status.slice(1)
  : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}