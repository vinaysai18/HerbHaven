
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import logo from "../../images/logo.png";
import cart_logo from "../../images/cart.png";
import ProductImage from "../ProductImage";

export default function Header({
    cart,
    increaseQuantity,
    decreaseQuantity,
}) {
    const [showCart, setShowCart] = useState(false);

    const navigate = useNavigate();

    const email = localStorage.getItem("email");

    const totalAmount = cart.reduce(
        (total, item) =>
            total + Number(item.price) * item.quantity,
        0
    );

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("email");
        localStorage.removeItem("address");

        navigate("/login", { replace: true });
    }

    function handleBuyItems() {
        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        setShowCart(false);
        navigate("/customer/checkout");
    }

    return (
        <header>
            {/* LOGO SECTION */}
            <div className="logo-section">
                <img src={logo} alt="HerbHaven logo" />

                <h3 className="logo">
                    <span className="text">H</span>erb
                    <span className="text">H</span>aven
                </h3>

                <span className="Customer">Customer Page</span>
            </div>

            {/* NAVIGATION */}
            <div className="nav-links">
                <Link to="/customer">Home</Link>
                <Link to="/customer/shop">Shop</Link>
                <Link to="/customer/about">About</Link>
                <Link to="/customer/orders" onClick={() => setShowCart(false)}>
                    My Orders
                </Link>
            </div>

            {/* CART */}
            <div className="cart-container">
                <button
                    type="button"
                    className="cart"
                    onClick={() => setShowCart(!showCart)}
                    aria-label="Toggle shopping cart"
                >
                    <img src={cart_logo} alt="" />

                    {cart.length > 0 && (
                        <span className="cart-count">
                            {cart.reduce(
                                (total, item) => total + item.quantity,
                                0
                            )}
                        </span>
                    )}
                </button>

                {/* CART DROPDOWN */}
                {showCart && (
                    <div className="cart-dropdown">
                        <h2>Your Cart</h2>

                        {cart.length === 0 ? (
                            <p>Your cart is empty 🌿</p>
                        ) : (
                            <>
                                {cart.map((item) => {
                                    const productId = item._id || item.id;

                                    return (
                                        <div
                                            className="cart-item"
                                            key={productId}
                                        >
                                            <ProductImage
                                                image={item.image}
                                                alt={item.name}
                                            />

                                            <div className="cart-item-info">
                                                <h3>{item.name}</h3>

                                                <p>
                                                    ₹
                                                    {(
                                                        Number(item.price) * item.quantity
                                                    ).toFixed(2)}
                                                </p>

                                                <div className="quantity-controls">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            decreaseQuantity(productId)
                                                        }
                                                        aria-label={`Decrease ${item.name} quantity`}
                                                    >
                                                        −
                                                    </button>

                                                    <span>{item.quantity}</span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            increaseQuantity(productId)
                                                        }
                                                        aria-label={`Increase ${item.name} quantity`}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* CART TOTAL */}
                                <div className="cart-total">
                                    <h3>
                                        Total Amount: ₹
                                        {totalAmount.toFixed(2)}
                                    </h3>

                                    <button
                                        type="button"
                                        className="buy-items"
                                        onClick={handleBuyItems}
                                    >
                                        Buy Items
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* USER SECTION */}
            <div className="header-right">
                <div className="user-section">
                    <div className="user-avatar">
                        {email ? email.charAt(0).toUpperCase() : "U"}
                    </div>

                    <div className="user-details">
                        <span className="user-email">
                            {email || "User"}
                        </span>

                        <span className="user-role">Customer</span>
                    </div>
                </div>

                <button
                    type="button"
                    className="logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </header>
    );
}
