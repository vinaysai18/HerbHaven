import { Routes, Route, Link } from "react-router-dom";
import { useState } from "react";

import Header from "./Components/Customer/Header";
import Home from "./Components/Customer/CustomerHome";
import CustomerShop from "./Components/Customer/CustomerShop";
import Cart from "./Components/Customer/Cart";
import AboutCustomer from "./Components/Customer/AboutCustomer";
import Checkout from "./Components/Customer/Checkout";
import MyOrders from "./Components/Customer/MyOrders";

import "./Customer.css";

export default function Customer() {

    const [cart, setCart] = useState([]);

    // Add product to cart
    function onAddtoCart(product) {

        const productId = product._id || product.id;
        const available = Number(product.stockQuantity) || 0;
        if (available < 1) {
            window.alert("This item is currently out of stock.");
            return;
        }

        const existingProduct = cart.find(
            item => (item._id || item.id) === productId
        );

        if (existingProduct) {
            if (existingProduct.quantity >= available) {
                window.alert(`Only ${available} unit(s) are currently available.`);
                return;
            }

            setCart(previousCart =>
                previousCart.map(item =>
                    (item._id || item.id) === productId
                        ? {
                            ...item,
                            quantity: item.quantity + 1
                        }
                        : item
                )
            );

        } else {

            setCart(previousCart => [
                ...previousCart,
                {
                    ...product,
                    quantity: 1
                }
            ]);

        }
    }

    // Increase quantity
    function increaseQuantity(id) {

        setCart(previousCart =>
            previousCart.map(item =>
                (item._id || item.id) === id
                    && item.quantity < (Number(item.stockQuantity) || 0)
                    ? {
                        ...item,
                        quantity: item.quantity + 1
                    }
                    : item
            )
        );

        const item = cart.find((product) => (product._id || product.id) === id);
        if (item && item.quantity >= (Number(item.stockQuantity) || 0)) {
            window.alert(`Only ${item.stockQuantity || 0} unit(s) are currently available.`);
        }
    }

    // Decrease quantity
    function decreaseQuantity(id) {

        setCart(previousCart =>
            previousCart
                .map(item =>
                    (item._id || item.id) === id
                        ? {
                            ...item,
                            quantity: item.quantity - 1
                        }
                        : item
                )
                .filter(item => item.quantity > 0)
        );
    }

    return (
        <div className="customer-shell">
            <Header
                cart={cart}
                increaseQuantity={increaseQuantity}
                decreaseQuantity={decreaseQuantity}
            />

            <Routes>
                <Route
                    path=""
                    element={<Home onAddtoCart={onAddtoCart} />}
                />

                <Route
                    path="shop"
                    element={
                        <CustomerShop
                            onAddtoCart={onAddtoCart}
                        />
                    }
                />

                <Route
                    path="cart"
                    element={
                        <Cart
                            cart={cart}
                            increaseQuantity={increaseQuantity}
                            decreaseQuantity={decreaseQuantity}
                        />
                    }
                />

                <Route
                    path="about"
                    element={<AboutCustomer />}
                />

                <Route
                    path="checkout"
                    element={
                        <Checkout
                            cart={cart}
                            clearCart={() => setCart([])}
                        />
                    }
                />


                <Route path="orders" element={<MyOrders />} />
            </Routes>
            <footer className="storefront-footer">
                <Link to="/customer" className="footer-brand">HerbHaven</Link>
                <p>Thoughtful herbal essentials for everyday wellbeing.</p>
                <nav aria-label="Footer navigation">
                    <Link to="/customer/shop">Shop</Link>
                    <Link to="/customer/about">Our story</Link>
                    <Link to="/customer/orders">My orders</Link>
                </nav>
            </footer>
        </div>
    );
}