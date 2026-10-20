
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";
import { API_URL } from "../../api";
import ProductImage from "../ProductImage";

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout({ cart, clearCart }) {
  const navigate = useNavigate();

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const [address, setAddress] = useState(
    user.address || localStorage.getItem("address") || ""
  );

  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const totalAmount = cart.reduce(
    (total, item) =>
      total + Number(item.price) * Number(item.quantity),
    0
  );
  const hasUnavailableItems = cart.some(
    (item) => Number(item.quantity) > (Number(item.stockQuantity) || 0)
  );

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (loading) return;

    setErrorMessage("");

    if (!cart.length) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    if (!address.trim()) {
      setErrorMessage("Please enter your delivery address.");
      return;
    }

    if (hasUnavailableItems) {
      setErrorMessage(
        "One or more cart quantities exceed the last known stock. Update your cart before checkout."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in to place your order.");
      navigate("/login");
      return;
    }

    const items = cart.map((item) => ({
      productId: item._id || item.id,
      quantity: Number(item.quantity),
    }));

    if (
      items.some(
        (item) =>
          !item.productId ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      setErrorMessage("Your cart contains an invalid product.");
      return;
    }

    setLoading(true);

    try {
      // CASH ON DELIVERY
      if (paymentMethod === "COD") {
        const response = await fetch(
          `${API_URL}/orders`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              items,
              deliveryAddress: address.trim(),
              paymentMethod: "COD",
            }),
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Your session has expired. Please log in again."
            );
          }

          throw new Error(
            data.message || "Could not place COD order."
          );
        }

        if (typeof clearCart === "function") {
          clearCart();
        }

        alert(
          "Cash on Delivery order placed successfully! 🌿 Pay when your order arrives."
        );

        navigate("/customer");
        return;
      }

      // RAZORPAY ONLINE PAYMENT
      const razorpayLoaded = await loadRazorpay();

      if (!razorpayLoaded) {
        throw new Error(
          "Unable to load Razorpay. Check your internet connection."
        );
      }

      const response = await fetch(
        `${API_URL}/payments/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items,
            deliveryAddress: address.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        throw new Error(
          data.message || "Unable to create payment order."
        );
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "HerbHaven",
        description: "Herbal products purchase",
        order_id: data.razorpayOrderId,

        prefill: {
          name: user.name || user.username || "",
          email: user.email || "",
          contact: user.phone || "",
        },

        theme: {
          color: "#2e7d32",
        },

        handler: async (paymentResponse) => {
          try {
            setErrorMessage("");

            const verifyResponse = await fetch(
              `${API_URL}/payments/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  orderId: data.orderId,
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,
                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,
                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse
              .json()
              .catch(() => ({}));

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed."
              );
            }

            if (typeof clearCart === "function") {
              clearCart();
            }

            alert(
              "Payment successful! Your HerbHaven order is saved. 🌿"
            );

            navigate("/customer");
          } catch (error) {
            console.error("Payment verification error:", error);

            setErrorMessage(
              `${error.message} If money was deducted, keep your payment ID: ${paymentResponse.razorpay_payment_id}`
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            setErrorMessage(
              "Payment window closed. Check your order status before trying again."
            );
          },
        },
      };

      const razorpayCheckout = new window.Razorpay(options);

      razorpayCheckout.on("payment.failed", (paymentResponse) => {
        setErrorMessage(
          paymentResponse.error?.description ||
            "Payment failed. Please try again."
        );
        setLoading(false);
      });

      razorpayCheckout.open();
    } catch (error) {
      console.error("Checkout error:", error);

      setErrorMessage(
        error.message || "Unable to place your order."
      );

      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <h1>Your cart is empty 🌿</h1>

        <button
          type="button"
          className="buy-items"
          onClick={() => navigate("/customer/shop")}
        >
          Shop Now
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="cart-title">📦 Checkout</h1>

      <form onSubmit={handlePlaceOrder}>
        <div className="cart-item-info">
          <h2>Delivery Details</h2>

          <label htmlFor="delivery-address">
            Delivery Address
          </label>

          <textarea
            id="delivery-address"
            name="deliveryAddress"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your delivery address"
            required
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="cart-item-info">
          <h2>Payment Method</h2>

          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="Razorpay"
              checked={paymentMethod === "Razorpay"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={loading}
            />
            Online Payment (Razorpay)
          </label>

          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={paymentMethod === "COD"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={loading}
            />
            Cash on Delivery
          </label>
        </div>

        <div className="cart-items">
          <h2>Order Summary</h2>

          {cart.map((item) => (
            <div
              className="cart-item"
              key={item._id || item.id}
            >
              <ProductImage
                className="cart-item-image"
                image={item.image}
                alt={item.name}
              />

              <div className="cart-item-info">
                <h3>{item.name}</h3>

                <p>
                  Price: ₹{Number(item.price).toFixed(2)}
                </p>

                <p>Quantity: {item.quantity}</p>
                <p>Available: {Number(item.stockQuantity) || 0}</p>

                <p>
                  Subtotal: ₹
                  {(
                    Number(item.price) * Number(item.quantity)
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-page-total">
          <h2>Total: ₹{totalAmount.toFixed(2)}</h2>

          {errorMessage && (
            <p
              role="alert"
              style={{ color: "red", marginBottom: "12px" }}
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="buy-items"
            disabled={loading || hasUnavailableItems}
          >
            {loading
              ? "Processing..."
              : paymentMethod === "COD"
              ? "Place COD Order"
              : "Pay Now"}
          </button>
        </div>
      </form>
    </div>
  );
}
