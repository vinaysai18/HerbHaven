import { Routes, Route } from "react-router-dom";
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

        const existingProduct = cart.find(
            item => (item._id || item.id) === productId
        );

        if (existingProduct) {

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
                    ? {
                        ...item,
                        quantity: item.quantity + 1
                    }
                    : item
            )
        );
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
        <>
            <Header
                cart={cart}
                increaseQuantity={increaseQuantity}
                decreaseQuantity={decreaseQuantity}
            />

            <Routes>
                <Route
                    path=""
                    element={<Home />}
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
        </>
    );
}   