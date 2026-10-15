
import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/orders";

const STATUSES = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("All");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in as an admin.");
      }

      const response = await fetch(`${API_URL}/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch orders.");
      }

      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function updateStatus(orderId, status) {
    try {
      setUpdatingId(orderId);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status.");
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                ...(data.order || {}),
                status: data.order?.status || status,
              }
            : order
        )
      );
    } catch (err) {
      setError(err.message || "Unable to update order status.");
    } finally {
      setUpdatingId(null);
    }
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return "Date unavailable";

    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getPaymentMethod(order) {
    if (order.paymentMethod === "Razorpay") return "Razorpay";
    if (order.paymentMethod === "COD") return "Cash on Delivery";

    return order.paymentMethod || "Not specified";
  }

  function getPaymentStatus(order) {
    if (order.paymentStatus === "Paid") return "Paid";
    if (order.paymentStatus === "Failed") return "Failed";
    if (order.paymentStatus === "Refunded") return "Refunded";

    if (order.paymentMethod === "COD") {
      return "Pending — Pay on Delivery";
    }

    return order.paymentStatus || "Pending";
  }

  function getPaymentStatusClass(order) {
    if (order.paymentStatus === "Paid") return "paid";
    if (order.paymentStatus === "Failed") return "failed";
    if (order.paymentStatus === "Refunded") return "refunded";

    return "payment-pending";
  }

  const visibleOrders =
    filter === "All"
      ? orders
      : orders.filter(
          (order) => (order.status || "Pending") === filter
        );

  const totalRevenue = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce(
      (total, order) => total + (Number(order.totalAmount) || 0),
      0
    );

  return (
    <main className="admin-orders-page">
      <div className="admin-orders-heading">
        <div>
          <p className="admin-orders-eyebrow">HERBHAVEN ADMIN PANEL</p>
          <h1>Customer Orders</h1>
          <p>View purchases, payment details, and manage order status.</p>
        </div>

        <button
          className="admin-refresh-button"
          onClick={fetchOrders}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Orders"}
        </button>
      </div>

      {error && (
        <div className="admin-orders-error" role="alert">
          {error}
        </div>
      )}

      <section className="admin-order-stats">
        <div className="admin-order-stat">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
        </div>

        <div className="admin-order-stat">
          <span>Pending Orders</span>
          <strong>
            {orders.filter((order) => order.status === "Pending").length}
          </strong>
        </div>

        <div className="admin-order-stat">
          <span>Delivered Orders</span>
          <strong>
            {orders.filter((order) => order.status === "Delivered").length}
          </strong>
        </div>

        <div className="admin-order-stat">
          <span>Order Value</span>
          <strong>{formatPrice(totalRevenue)}</strong>
        </div>
      </section>

      <div className="admin-order-filters">
        <label htmlFor="order-filter">Filter orders:</label>
        <select
          id="order-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="All">All Orders</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {loading && orders.length === 0 ? (
        <p className="admin-orders-message">Loading orders...</p>
      ) : visibleOrders.length === 0 ? (
        <div className="admin-orders-empty">
          <h2>No orders found</h2>
          <p>Orders matching this filter will appear here.</p>
        </div>
      ) : (
        <section className="admin-orders-list">
          {visibleOrders.map((order) => (
            <article className="admin-order-card" key={order._id}>
              <div className="admin-order-card-header">
                <div>
                  <span className="admin-order-label">ORDER ID</span>
                  <h2>#{order._id}</h2>
                  <p>{formatDate(order.createdAt)}</p>
                </div>

                <span
                  className={`admin-order-status ${
                    (order.status || "Pending").toLowerCase()
                  }`}
                >
                  {order.status || "Pending"}
                </span>
              </div>

              <div className="admin-customer-details">
                <h3>Customer Details</h3>
                <p>
                  <strong>Name:</strong>{" "}
                  {order.user?.name || "Name unavailable"}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {order.user?.email || "Email unavailable"}
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  {order.user?.phone || "Not provided"}
                </p>
              </div>

              <div className="admin-order-products">
                <h3>Ordered Products</h3>

                {(order.items || []).map((item, index) => (
                  <div
                    className="admin-order-product"
                    key={`${
                      item.product?._id || item.product || item.name
                    }-${index}`}
                  >
                    <div>
                      <strong>{item.name || "Herbal Product"}</strong>
                      <p>Quantity: {item.quantity}</p>
                    </div>

                    <span>
                      {formatPrice(
                        Number(item.price) * Number(item.quantity)
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="admin-order-delivery">
                <h3>Delivery Address</h3>
                <p>{order.deliveryAddress || "Address unavailable"}</p>
              </div>

              {/* Payment details */}
              <section className="admin-payment-details">
                <h3>Payment Details</h3>

                <div className="admin-payment-row">
                  <span>Payment Method</span>
                  <strong>{getPaymentMethod(order)}</strong>
                </div>

                <div className="admin-payment-row">
                  <span>Payment Status</span>
                  <strong
                    className={`admin-payment-status ${
                      getPaymentStatusClass(order)
                    }`}
                  >
                    {getPaymentStatus(order)}
                  </strong>
                </div>

                {order.razorpayPaymentId && (
                  <div className="admin-payment-row">
                    <span>Razorpay Payment ID</span>
                    <code>{order.razorpayPaymentId}</code>
                  </div>
                )}
              </section>

              <div className="admin-order-footer">
                <div>
                  <span>Total Amount</span>
                  <strong>{formatPrice(order.totalAmount)}</strong>
                </div>

                <div className="admin-status-control">
                  <label htmlFor={`status-${order._id}`}>
                    Update Status
                  </label>

                  <select
                    id={`status-${order._id}`}
                    value={order.status || "Pending"}
                    disabled={
                      updatingId === order._id ||
                      order.status === "Cancelled"
                    }
                    onChange={(event) =>
                      updateStatus(order._id, event.target.value)
                    }
                  >
                    {order.status === "Cancelled" && (
                      <option value="Cancelled">Cancelled</option>
                    )}

                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {updatingId === order._id && (
                    <small>Updating status...</small>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
