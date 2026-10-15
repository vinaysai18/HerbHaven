
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/orders";

export default function AdminReturnRequests() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [comments, setComments] = useState({});
  const [message, setMessage] = useState("");

  async function fetchRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/admin/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load orders.");
      }

      const allOrders = Array.isArray(data)
        ? data
        : data.orders || [];

      setOrders(
        allOrders.filter(
          (order) => order.returnRequest?.status === "Requested"
        )
      );
    } catch (err) {
      setError(err.message || "Unable to load return requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function reviewRequest(orderId, action) {
    const comment = comments[orderId] || "";

    if (
      !window.confirm(
        `Are you sure you want to ${action.toLowerCase()} this return request?`
      )
    ) {
      return;
    }

    try {
      setProcessingId(orderId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/admin/${orderId}/return-review`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            adminComment: comment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to review request.");
      }

      setMessage(`Return request ${action.toLowerCase()} successfully.`);
      await fetchRequests();
    } catch (err) {
      setError(err.message || "Unable to review request.");
    } finally {
      setProcessingId(null);
    }
  }

  function formatPrice(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  }

  function formatDate(date) {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="admin-returns-page">
        <h1>Return Requests</h1>
        <p>Loading return requests...</p>
      </main>
    );
  }

  return (
    <main className="admin-returns-page">
      <header className="admin-returns-heading">
        <div>
          <p className="admin-returns-eyebrow">HERBHAVEN ADMIN</p>
          <h1>Return Requests</h1>
          <p>Review and manage customer return requests.</p>
        </div>

        <button
          type="button"
          className="returns-refresh-button"
          onClick={fetchRequests}
          disabled={loading}
        >
          Refresh
        </button>
      </header>

      {error && (
        <p className="returns-message returns-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="returns-message returns-success" role="status">
          {message}
        </p>
      )}

      {orders.length === 0 ? (
        <section className="returns-empty">
          <h2>No pending return requests</h2>
          <p>New customer requests will appear here.</p>
        </section>
      ) : (
        <section className="admin-returns-list">
          {orders.map((order) => (
            <article className="admin-return-card" key={order._id}>
              <header className="admin-return-card-header">
                <div>
                  <span className="return-field-label">ORDER ID</span>
                  <h2>#{order._id}</h2>
                  <p>Placed: {formatDate(order.createdAt)}</p>
                </div>

                <span className="return-status-badge">
                  {order.returnRequest.status}
                </span>
              </header>

              <div className="return-customer-details">
                <h3>Customer Details</h3>
                <p>
                  <strong>Name:</strong>{" "}
                  {order.user?.name || "Not available"}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {order.user?.email || "Not available"}
                </p>
              </div>

              <div className="return-reason">
                <h3>Customer's Reason</h3>
                <p>{order.returnRequest.reason || "No reason provided."}</p>
              </div>

              <div className="return-order-details">
                <div>
                  <span>Order total</span>
                  <strong>{formatPrice(order.totalAmount)}</strong>
                </div>

                <div>
                  <span>Payment method</span>
                  <strong>
                    {order.paymentMethod === "COD"
                      ? "Cash on Delivery"
                      : order.paymentMethod || "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>Payment status</span>
                  <strong>{order.paymentStatus || "Pending"}</strong>
                </div>

                <div>
                  <span>Refund status</span>
                  <strong>{order.refundStatus || "Not Applicable"}</strong>
                </div>
              </div>

              <label
                className="return-comment-label"
                htmlFor={`return-comment-${order._id}`}
              >
                Admin comment (optional)
              </label>

              <textarea
                id={`return-comment-${order._id}`}
                value={comments[order._id] || ""}
                onChange={(event) =>
                  setComments((previous) => ({
                    ...previous,
                    [order._id]: event.target.value.slice(0, 500),
                  }))
                }
                maxLength={500}
                placeholder="Enter a reason for your decision..."
              />

              <div className="return-review-actions">
                <button
                  type="button"
                  className="return-approve-button"
                  onClick={() => reviewRequest(order._id, "Approved")}
                  disabled={processingId === order._id}
                >
                  {processingId === order._id
                    ? "Processing..."
                    : "Approve Return"}
                </button>

                <button
                  type="button"
                  className="return-reject-button"
                  onClick={() => reviewRequest(order._id, "Rejected")}
                  disabled={processingId === order._id}
                >
                  Reject Return
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
