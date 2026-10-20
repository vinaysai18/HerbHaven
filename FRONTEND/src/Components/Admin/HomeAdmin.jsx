import { Link } from "react-router-dom";
import heroImage from "../../images/hero-image.png";
export default function Home() {
    return (
        <main className="Home admin-home">
            <div className="intro admin-intro" style={{ backgroundImage: `url(${heroImage})` }}>
                <div className="intro-text">
                    <p className="p-text">HERBHAVEN ADMIN WORKSPACE</p>
                    <h1 className="main-text1">A considered way</h1>
                    <h1 className="main-text2">to manage your shop</h1>
                    <p className="main-para">
                        Keep products, inventory, customer orders, and returns in
                        view from one place.
                    </p>
                    <div className="admin-home-actions">
                        <Link to="/admin/shop" className="explore-btn">Manage products</Link>
                        <Link to="/admin/inventory" className="admin-home-secondary">Review inventory <span aria-hidden="true">→</span></Link>
                    </div>
                </div>
            </div>

            <section className="admin-home-links" aria-label="Admin workspace shortcuts">
                <Link to="/admin/shop">
                    <span className="admin-link-icon" aria-hidden="true">✳</span>
                    <span><strong>Products</strong><small>Add, edit, and review your catalog</small></span>
                    <span className="admin-link-arrow" aria-hidden="true">→</span>
                </Link>
                <Link to="/admin/orders">
                    <span className="admin-link-icon" aria-hidden="true">↗</span>
                    <span><strong>Orders</strong><small>Review purchases and update order status</small></span>
                    <span className="admin-link-arrow" aria-hidden="true">→</span>
                </Link>
                <Link to="/admin/inventory">
                    <span className="admin-link-icon" aria-hidden="true">⌂</span>
                    <span><strong>Inventory</strong><small>Track stock and movement history</small></span>
                    <span className="admin-link-arrow" aria-hidden="true">→</span>
                </Link>
                <Link to="/admin/return">
                    <span className="admin-link-icon" aria-hidden="true">⟲</span>
                    <span><strong>Returns</strong><small>Review customer return requests</small></span>
                    <span className="admin-link-arrow" aria-hidden="true">→</span>
                </Link>
            </section>
        </main>
    )
}