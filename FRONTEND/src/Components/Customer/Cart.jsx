import { useNavigate } from "react-router-dom";
import ProductImage from "../ProductImage";

export default function Cart({
    cart,
    increaseQuantity,
    decreaseQuantity
}) {

    const navigate = useNavigate();

    // Calculate total amount
    const totalAmount = cart.reduce(
        (total, item) =>
            total + Number(item.price) * item.quantity,
        0
    );

    // Navigate to checkout
    const handleCheckout = () => {
        navigate("/customer/checkout");
    };

    return (

        <div className="cart-page">

            <h1 className="cart-title">
                🛒 Your Cart
            </h1>

            {cart.length === 0 ? (

                <div className="empty-cart">

                    <h2>
                        Your cart is empty 🌿
                    </h2>

                    <p>
                        Add some herbs to your cart!
                    </p>

                    <button
                        className="buy-items"
                        onClick={() => navigate("/customer/shop")}
                    >
                        Continue Shopping
                    </button>

                </div>

            ) : (

                <>

                    {/* CART ITEMS */}

                    <div className="cart-items">

                        {cart.map((item) => {

                            const productId = item._id || item.id;

                            return (

                                <div
                                    className="cart-item"
                                    key={productId}
                                >

                                    <ProductImage
                                        className="cart-item-image"
                                        image={item.image}
                                        alt={item.name}
                                    />

                                    <div className="cart-item-info">

                                        <h2>
                                            {item.name}
                                        </h2>

                                        <p>
                                            {item.description}
                                        </p>

                                        <p>
                                            Price: ₹
                                            {Number(item.price).toFixed(2)}
                                        </p>
                                        <p>
                                            {item.quantity > (Number(item.stockQuantity) || 0)
                                                ? "Requested quantity exceeds the available stock."
                                                : `${Number(item.stockQuantity) || 0} currently available`}
                                        </p>

                                        {/* QUANTITY CONTROLS */}

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

                                            <span>
                                                {item.quantity}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    increaseQuantity(productId)
                                                }
                                                aria-label={`Increase ${item.name} quantity`}
                                                disabled={
                                                    item.quantity >=
                                                    (Number(item.stockQuantity) || 0)
                                                }
                                            >
                                                +
                                            </button>

                                        </div>

                                        <h3>
                                            Subtotal: ₹
                                            {(
                                                Number(item.price) *
                                                item.quantity
                                            ).toFixed(2)}
                                        </h3>

                                    </div>

                                </div>

                            );

                        })}

                    </div>


                    {/* CART TOTAL */}

                    <div className="cart-page-total">

                        <h2>
                            Total Amount: ₹
                            {totalAmount.toFixed(2)}
                        </h2>

                        <button
                            className="buy-items"
                            onClick={handleCheckout}
                            disabled={cart.some(
                                (item) =>
                                    item.quantity > (Number(item.stockQuantity) || 0)
                            )}
                        >
                            Proceed to Checkout
                        </button>

                    </div>

                </>

            )}

        </div>

    );
}
