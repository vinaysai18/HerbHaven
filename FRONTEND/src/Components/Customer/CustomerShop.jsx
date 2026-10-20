import ProductCard from "./CustomerProductCard";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../../api";

export default function CustomerShop({ onAddtoCart }) {

    const [herbs, setHerbs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

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

                setLoadError(error.message || "Unable to load products.");
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

    const categories = [...new Set(
        herbs.map((herb) => herb.category?.trim()).filter(Boolean)
    )].sort((left, right) => left.localeCompare(right));
    const visibleHerbs = herbs.filter((herb) => {
        const matchesSearch = `${herb.name} ${herb.description} ${herb.sku || ""}`
            .toLowerCase()
            .includes(search.trim().toLowerCase());
        return matchesSearch && (!category || herb.category === category);
    });

    function updateFilter(key, value) {
        const nextParams = new URLSearchParams(searchParams);
        if (value) nextParams.set(key, value);
        else nextParams.delete(key);
        setSearchParams(nextParams, { replace: true });
    }

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
                <div className="shop-toolbar">
                    <label className="shop-search">
                        <span>Search the collection</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => updateFilter("search", event.target.value)}
                            placeholder="Search by name, description, or SKU"
                        />
                    </label>
                    <label className="shop-category-filter">
                        <span>Category</span>
                        <select
                            value={category}
                            onChange={(event) => updateFilter("category", event.target.value)}
                        >
                            <option value="">All categories</option>
                            {categories.map((value) => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="products-grid">

                    {loading ? (

                        <p>Loading herbal products...</p>

                    ) : loadError ? (
                        <p className="shop-message shop-error" role="alert">{loadError}</p>
                    ) : herbs.length === 0 ? (

                        <p>No herbal products are available yet.</p>

                    ) : visibleHerbs.length === 0 ? (
                        <p className="shop-message">No products match these filters. Try a different search or category.</p>

                    ) : (

                        visibleHerbs.map((herb) => (

                            <ProductCard
                                key={herb._id}
                                herb={{
                                    ...herb,
                                    id: herb._id,
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