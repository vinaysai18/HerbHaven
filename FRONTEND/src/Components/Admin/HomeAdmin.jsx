import {Link} from "react-router-dom";
import heroImage from "../../images/hero-image.png";
export default function Home() {
    return (
        <div className="Home">
            <div className="intro" style={{ backgroundImage: `url(${heroImage})` }}>
                <div className="intro-text">
                    <p className="p-text">🌿 100% Natural Products</p>
                    <h1 className="main-text1">Nature's Goodness,</h1>
                    <h1 className="main-text2">Delivered to You</h1>
                    <p className="main-para">Discover natural herbal products carefully selected
                        to support a healthier and and more balanced lifestyle</p>
                    <Link to="/admin/shop" className="explore-btn">
                        Explore Our Products →
                    </Link>
                </div>

            </div>

        </div>
    )
}