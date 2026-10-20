import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImage from "../../images/hero-image.png";
import ProductCard from "./CustomerProductCard";
import { API_URL } from "../../api";

export default function Home({ onAddtoCart }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadFeaturedProducts() {
            try {
                const response = await fetch(`${API_URL}/products`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to load featured products.");
                }

                if (!Array.isArray(data)) {
                    throw new Error("The products response was not a list.");
                }

                if (!cancelled) setProducts(data);
            } catch (error) {
                if (!cancelled) {
                    setLoadError(error.message || "Unable to load featured products.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadFeaturedProducts();
        return () => {
            cancelled = true;
        };
    }, []);

    const featuredProducts = products.slice(0, 4);
    const categories = [...new Set(
        products
            .map((product) => product.category?.trim())
            .filter(Boolean)
    )].slice(0, 4);

    return (
        <main className="Home">
            <div className="intro" style={{ backgroundImage: `url(${heroImage})` }}>
                <div className="intro-text">
                    <p className="p-text">A more natural daily ritual</p>
                    <h1 className="main-text1">Pure Herbs for</h1>
                    <h1 className="main-text2">a Healthier Tomorrow</h1>
                    <p className="main-para">
                        Discover herbal essentials selected to bring more balance,
                        comfort, and nature into your everyday routine.
                    </p>
                    <Link to="/customer/shop" className="explore-btn">
                        Shop the collection
                    </Link>
                    <Link to="/customer/about" className="hero-secondary-link">
                        Get to know HerbHaven <span aria-hidden="true">→</span>
                    </Link>
                </div>
            </div>

            <section className="home-trust-strip" aria-label="Shopping benefits">
                <div><span aria-hidden="true">✳</span><strong>Herbal essentials</strong><small>Thoughtfully selected</small></div>
                <div><span aria-hidden="true">⌂</span><strong>Easy ordering</strong><small>A simple online experience</small></div>
                <div><span aria-hidden="true">✓</span><strong>Secure checkout</strong><small>Razorpay and cash on delivery</small></div>
                <div><span aria-hidden="true">↗</span><strong>Order updates</strong><small>Track purchases in your account</small></div>
            </section>

            <section className="home-section featured-section">
                <div className="home-section-heading">
                    <div>
                        <p className="section-eyebrow">THE HERBHAVEN EDIT</p>
                        <h2>Explore the collection</h2>
                        <p>Find a new favorite from the products currently available in our shop.</p>
                    </div>
                    <Link to="/customer/shop" className="text-link">View all products <span aria-hidden="true">→</span></Link>
                </div>

                {loading ? (
                    <p className="home-products-message" role="status">Loading the collection…</p>
                ) : loadError ? (
                    <p className="home-products-message home-products-error" role="alert">{loadError}</p>
                ) : featuredProducts.length ? (
                    <div className="home-featured-grid">
                        {featuredProducts.map((product) => (
                            <ProductCard
                                key={product._id}
                                herb={{ ...product, id: product._id }}
                                onAddtoCart={onAddtoCart}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="home-products-message">
                        <p>Our collection is being prepared. Check back soon.</p>
                        <Link to="/customer/shop" className="text-link">Visit the shop <span aria-hidden="true">→</span></Link>
                    </div>
                )}
            </section>

            {categories.length > 0 && (
                <section className="home-section category-section">
                    <div className="home-section-heading">
                        <div>
                            <p className="section-eyebrow">SHOP BY CATEGORY</p>
                            <h2>Made for your rituals</h2>
                            <p>Browse the categories in our current collection.</p>
                        </div>
                    </div>
                    <div className="home-category-grid">
                        {categories.map((category, index) => (
                            <Link
                                to={`/customer/shop?category=${encodeURIComponent(category)}`}
                                className={`home-category-card category-tone-${index + 1}`}
                                key={category}
                            >
                                <span className="category-mark" aria-hidden="true">✳</span>
                                <span>{category}</span>
                                <span className="category-arrow" aria-hidden="true">↗</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}