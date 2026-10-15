import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
    return (
        <div className="landing-page">

            {/* Header */}
            <header className="landing-header">

                {/* Logo + Title */}
                <Link to="/" className="brand">
                    <div className="brand-logo">
                        🌿
                    </div>

                    <div>
                        <h2>HerbHaven</h2>
                        <span>PURE NATURAL • BETTER YOU</span>
                    </div>
                </Link>

                {/* Sign Up */}
                <Link to="/register" className="signup-btn">
                    Sign Up
                </Link>

            </header>


            {/* Hero Section */}
            <section className="hero-section">

                <div className="hero-content">

                    <div className="hero-label">
                        <span>NATURE CARES</span>
                        <div className="label-line"></div>
                    </div>

                    <h1>
                        Nature's Goodness,
                        <br />
                        <span>Delivered Naturally</span>
                    </h1>

                    <p>
                        Discover premium herbs and natural products
                        carefully selected to bring health, balance
                        and wellness to your life.
                    </p>

                    {/* Goes to Login inside Auth */}
                    <Link to="/login" className="explore-btn">
                        <span>Explore</span>
                        <span className="arrow">→</span>
                    </Link>

                    <div className="hero-caption">
                        YOUR NATURAL JOURNEY STARTS HERE
                    </div>

                </div>

            </section>

        </div>
    );
};

export default LandingPage;