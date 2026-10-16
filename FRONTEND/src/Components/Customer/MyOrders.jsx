
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://herbhaven.onrender.com";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [cancelError, setCancelError] = useState("");

  const navigate = useNavigate();

  async function refreshOrders() {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/api/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load orders.");
    }

    const orderList = Array.isArray(data) ? data : data.orders;
    setOrders(Array.isArray(orderList) ? orderList : []);
  }

  useEffect(() => {
    async function fetchOrders() {
      try {
        if (!localStorage.getItem("token")) {
          setError("Please log in to view your orders.");
          return;
        }

        await refreshOrders();
      } catch (err) {
        setError(err.message || "Unable to load orders.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatDate(date) {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price) || 0);
  }

  function statusClass(status) {
    return String(status || "Pending")
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  // Supports common image fields and absolute or relative image paths.
  function getProductImage(item) {
    const product = item.product;

    const image =
      item.image ||
      product?.image ||
      product?.imageUrl ||
      product?.thumbnail ||
      product?.images?.[0] ||
      item.imageUrl ||
      item.thumbnail ||
      item.images?.[0];

    if (typeof image !== "string" || !image.trim()) {
      return "";
    }

    const value = image.trim();

    if (/^https?:\/\//i.test(value) || value.startsWith("data:image/")) {
      return value;
    }

    // Relative paths such as /uploads/herb.jpg
    const path = value.replace(/^\/+/, "");

    return `${API_URL}/${path}`;
  }

  function getProductName(item) {
    return (
      item.name ||
      item.product?.name ||
      item.product?.title ||
      "Herbal Product"
    );
  }

  function getPaymentMethod(order) {
    if (order.paymentMethod === "COD") return "Cash on Delivery";
    if (order.paymentMethod === "Razorpay") return "Razorpay";
    return order.paymentMethod || "Not specified";
  }

  function getPaymentStatus(order) {
    if (order.paymentStatus === "Paid") return "Paid";
    if (order.paymentStatus === "Refunded") return "Refunded";
    if (order.paymentStatus === "Failed") return "Failed";

    if (order.paymentMethod === "COD") {
      return "Pending (Pay on Delivery)";
    }

    return order.paymentStatus || "Pending";
  }

  function paymentStatusClass(order) {
    const status = getPaymentStatus(order);

    if (status === "Paid") return "paid";
    if (status === "Failed") return "failed";
    if (status === "Refunded") return "refunded";

    return "payment-pending";
  }

  async function handleCancelOrder(orderId) {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      setCancellingId(orderId);
      setCancelError("");

      const response = await fetch(
        `${API_URL}/api/orders/${orderId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to cancel order.");
      }

      if (data.order) {
        setOrders((previous) =>
          previous.map((order) =>
            order._id === orderId
              ? { ...order, ...data.order }
              : order
          )
        );
      } else {
        await refreshOrders();
      }
    } catch (err) {
      setCancelError(err.message || "Unable to cancel order.");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleReturnOrder(orderId) {
    const reason = window.prompt(
      "Please enter the reason for returning this order (maximum 500 characters):"
    );

    if (reason === null) return;

    if (!reason.trim()) {
      setCancelError("Please provide a reason for the return.");
      return;
    }

    if (reason.trim().length > 500) {
      setCancelError("Return reason cannot exceed 500 characters.");
      return;
    }

    try {
      setCancellingId(orderId);
      setCancelError("");

      const response = await fetch(
        `${API_URL}/api/orders/${orderId}/return`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: reason.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to submit return request."
        );
      }

      if (data.order) {
        setOrders((previous) =>
          previous.map((order) =>
            order._id === orderId
              ? { ...order, ...data.order }
              : order
          )
        );
      } else {
        await refreshOrders();
      }
    } catch (err) {
      setCancelError(
        err.message || "Unable to submit return request."
      );
    } finally {
      setCancellingId(null);
    }
  }

  async function handlePayNow(order) {
    try {
      setPayingId(order._id);
      setCancelError("");

      const token = localStorage.getItem("token");

      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");

          script.src =
            "https://checkout.razorpay.com/v1/checkout.js";

          script.onload = resolve;
          script.onerror = () =>
            reject(new Error("Unable to load Razorpay."));

          document.body.appendChild(script);
        });
      }

      const response = await fetch(
        `${API_URL}/api/payments/retry/${order._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to start payment."
        );
      }

      const options = {
        key: data.key || data.keyId,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "HerbHaven",
        description: "Complete your order payment",
        order_id: data.razorpayOrderId,

        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await fetch(
              `${API_URL}/api/payments/verify`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,
                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,
                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed."
              );
            }

            await refreshOrders();
            window.alert("Payment verified successfully!");
          } catch (err) {
            setCancelError(
              err.message || "Unable to verify payment."
            );
          } finally {
            setPayingId(null);
          }
        },

        modal: {
          ondismiss: () => setPayingId(null),
        },

        theme: { color: "#294b2d" },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (event) => {
        setCancelError(
          event.error?.description ||
            "Payment failed. Please try again."
        );

        setPayingId(null);
      });

      checkout.open();
    } catch (err) {
      setCancelError(
        err.message || "Unable to start payment."
      );
      setPayingId(null);
    }
  }

  if (loading) {
    return (
      <main className="my-orders-page">
        <h1>My Orders</h1>
        <p className="orders-message">Loading your orders...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="my-orders-page">
        <h1>My Orders</h1>
        <p className="orders-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="my-orders-page">
      <div className="orders-heading">
        <div>
          <p className="orders-eyebrow">
            HERBHAVEN CUSTOMER ACCOUNT
          </p>
          <h1>My Orders</h1>
          <p className="orders-subtitle">
            View your purchases and track your orders.
          </p>
        </div>

        <span className="orders-count">
          {orders.length}{" "}
          {orders.length === 1 ? "Order" : "Orders"}
        </span>
      </div>

      {cancelError && (
        <p className="orders-error" role="alert">
          {cancelError}
        </p>
      )}

      {orders.length === 0 ? (
        <section className="orders-empty">
          <div className="orders-empty-icon">🌿</div>
          <h2>No orders yet</h2>
          <p>
            Your purchases will appear here after you place
            your first order.
          </p>
          <button
            className="orders-shop-button"
            onClick={() => navigate("/customer")}
          >
            Explore Herbs
          </button>
        </section>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order._id}>
              <div className="order-card-header">
                <div>
                  <p className="order-label">ORDER ID</p>
                  <h2>#{order._id}</h2>
                  <p className="order-date">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>

                <div
                  className={`order-status-large ${statusClass(
                    order.status
                  )}`}
                >
                  <span className="status-label">
                    DELIVERY STATUS
                  </span>
                  <span className="status-value">
                    {order.status || "Pending"}
                  </span>
                </div>
              </div>

              <div className="order-products">
                {(order.items || []).map((item, index) => {
                  const imageUrl = getProductImage(item);
                  const productName = getProductName(item);

                  return (
                    <div
                      className="order-product"
                      key={`${item.product?._id || item.product || item.name || "item"}-${index}`}
                    >
                      <div className="order-product-icon">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={productName}
                            loading="lazy"
                            onError={(event) => {
                              // Hide broken images instead of repeatedly
                              // attempting to load the same URL.
                              event.currentTarget.onerror = null;
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span>No image</span>
                        )}
                      </div>

                      <div className="order-product-details">
                        <h3>{productName}</h3>
                        <p>Quantity: {item.quantity}</p>
                        <p>
                          Price: {formatPrice(item.price)} each
                        </p>
                      </div>

                      <strong className="order-item-total">
                        {formatPrice(
                          Number(item.price) *
                            Number(item.quantity)
                        )}
                      </strong>
                    </div>
                  );
                })}
              </div>

              <section
                className="order-payment"
                aria-label="Payment details"
              >
                <h3>Payment Details</h3>

                <div className="payment-detail-row">
                  <span>Payment Method</span>
                  <strong>{getPaymentMethod(order)}</strong>
                </div>

                <div className="payment-detail-row">
                  <span>Payment Status</span>
                  <strong
                    className={`payment-status ${paymentStatusClass(
                      order
                    )}`}
                  >
                    {getPaymentStatus(order)}
                  </strong>
                </div>
              </section>

              {order.returnRequest?.status &&
                order.returnRequest.status !== "None" && (
                  <section
                    className="return-request-status"
                    aria-label="Return request details"
                  >
                    <h3>Return Request</h3>

                    <div className="payment-detail-row">
                      <span>Request Status</span>
                      <strong
                        className={`return-status ${statusClass(
                          order.returnRequest.status
                        )}`}
                      >
                        {order.returnRequest.status}
                      </strong>
                    </div>

                    {order.returnRequest.reason && (
                      <div className="payment-detail-row">
                        <span>Reason</span>
                        <strong>
                          {order.returnRequest.reason}
                        </strong>
                      </div>
                    )}

                    {order.returnRequest.adminComment && (
                      <div className="payment-detail-row">
                        <span>Admin Comment</span>
                        <strong>
                          {order.returnRequest.adminComment}
                        </strong>
                      </div>
                    )}

                    {order.refundStatus &&
                      order.refundStatus !== "Not Applicable" && (
                        <div className="payment-detail-row">
                          <span>Refund Status</span>
                          <strong>{order.refundStatus}</strong>
                        </div>
                      )}
                  </section>
                )}

              {!["Cancelled", "Returned"].includes(
                order.status
              ) && (
                <div className="order-actions">
                  {order.status === "Delivered" ? (
                    ![
                      "Requested",
                      "Approved",
                      "Completed",
                    ].includes(
                      order.returnRequest?.status || "None"
                    ) && (
                      <button
                        className="return-order-button"
                        onClick={() =>
                          handleReturnOrder(order._id)
                        }
                        disabled={
                          cancellingId === order._id ||
                          payingId === order._id
                        }
                      >
                        {cancellingId === order._id
                          ? "Submitting Request..."
                          : "Request Return"}
                      </button>
                    )
                  ) : (
                    <>
                      {order.paymentMethod === "Razorpay" &&
                        !["Paid", "Refunded"].includes(
                          order.paymentStatus
                        ) && (
                          <button
                            className="pay-order-button"
                            onClick={() => handlePayNow(order)}
                            disabled={
                              payingId === order._id ||
                              cancellingId === order._id
                            }
                          >
                            {payingId === order._id
                              ? "Opening Payment..."
                              : "Pay Now"}
                          </button>
                        )}

                      <button
                        className="cancel-order-button"
                        onClick={() =>
                          handleCancelOrder(order._id)
                        }
                        disabled={
                          cancellingId === order._id ||
                          payingId === order._id
                        }
                      >
                        {cancellingId === order._id
                          ? "Processing..."
                          : "Cancel Order"}
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="order-delivery">
                <h3>Delivery Address</h3>
                <p>
                  {order.deliveryAddress ||
                    "Address unavailable"}
                </p>
              </div>

              <div className="order-card-footer">
                <span>Total Amount</span>
                <strong>
                  {formatPrice(order.totalAmount)}
                </strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
