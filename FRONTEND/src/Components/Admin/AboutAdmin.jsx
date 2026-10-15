import AboutImage from "../../images/about_image.png";
import logo_1 from "../../images/logo-1.png"
import logo_2 from "../../images/logo-2.png"
import logo_3 from "../../images/logo-3.png"
import logo_4 from "../../images/logo-4.png"
export default function About(){
    return(
        <div className="about-page">
            <div className="About-info">
                <div className="About-text">
                    <h2>About <span>HerbHaven</span></h2>
                    <p>HerbHaven is an online herbal store that makes it easy to discover and purchase natural herbal products from the 
                        comfort of your home.We bring together a collection of herbs,powders, and wellness poducts in one convinient place
                    </p>
                </div>
                <img src={AboutImage} alt="about"/>
            </div>
            <h2 className="why">Why choose HerbHaven</h2>
            <div className="info-logos">
                <div className="info-1">
                    <img src={logo_1} alt="logo-1"/>
                    <div className="logo-text">
                        <h3>Natural Products</h3>
                        <p>Carefully selected herbal products</p>
                    </div>
                </div>
                <div className="info-2">
                    <img src={logo_2} alt="logo-2"/>
                    <div className="logo-text">
                        <h3>Quality focused</h3>
                        <p>Products selected with quality in mind</p>
                    </div>
                </div>
                <div className="info-3">
                    <img src={logo_3} alt="logo-3"/>
                    <div className="logo-text">
                        <h3>Easy Shipping</h3>
                        <p>Simple and convenient online ordering</p>
                    </div>
                </div>
                <div className="info-4">
                    <img src={logo_4} alt="logo-4"/>
                    <div className="logo-text">
                        <h3>Fast delivery</h3>
                        <p>Get your products delivered to your doorstep</p>
                    </div>
                </div>
            </div>
        </div>
    )
}