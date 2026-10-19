import ProductCard from "./CustomerProductCard";
import { useState, useEffect } from "react";
import { API_ORIGIN, API_URL } from "../../api";

export default function CustomerShop({ onAddtoCart }) {

    const [herbs, setHerbs] = useState([]);
    const [loading, setLoading] = useState(true);

    // ================= GET PRODUCTS =================

    useEffect(() => {

        const fetchProducts = async () => {

            try {

                const token = localStorage.getItem("token");

                const response = await fetch(
                    `${API_URL}/products`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to fetch products"
                    );
                }

                setHerbs(data);

            } catch (error) {

                console.error(
                    "Error fetching products:",
                    error
                );

            } finally {

                setLoading(false);

            }
        };

        fetchProducts();

    }, []);


    // ================= UI =================

    return (

        <div className="customer-shop-page">

            {/* HEADER */}

            <div className="customer-shop">

                <div>

                    <h1>🌿 Available Herbal Items</h1>

                    <p>
                        100% Natural • Premium Quality •
                        Handpicked for You
                    </p>

                </div>

            </div>


            {/* PRODUCTS */}

            <div className="products-scroll">

                <div className="products-grid">

                    {loading ? (

                        <p>Loading herbal products...</p>

                    ) : herbs.length === 0 ? (

                        <p>No herbal products are available yet.</p>

                    ) : (

                        herbs.map((herb) => (

                            <ProductCard
                                key={herb._id}
                                herb={{
                                    ...herb,
                                    id: herb._id,
                                    image: herb.image?.startsWith("http")
                                        ? herb.image
                                        : `${API_ORIGIN}${herb.image}`,
                                }}
                                onAddtoCart={onAddtoCart}
                            />

                        ))

                    )}

                </div>

            </div>

        </div>

    );
}