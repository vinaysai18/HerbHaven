import {Link,useNavigate} from "react-router-dom";
import logo from "../../images/logo.png";
import cart from "../../images/cart.png";
import {FaUser} from "react-icons/fa";
export default function Header() {
    const navigate=useNavigate();
    const email=localStorage.getItem("email");
    function handleLogout(){
        localStorage.removeItem("email");
        navigate("/login",{replace:true});
    }

    return (
        <header>
            <div className="logo-section">
                <img src={logo} alt="logo" />

                <h3 className="logo">
                    <span className="text">H</span>erb
                    <span className="text">H</span>aven
                </h3>
                <span className="Admin">Admin Page</span>
            </div>

            {/* <input
                type="text"
                className="search-bar"
                placeholder="Search for products"
            /> */}

            <div className="nav-links">
                <Link to="/admin">Home</Link>
                <Link to="/admin/shop">Items</Link>
                <Link to="/admin/about">About</Link>
                <Link to="/admin/orders">View Orders</Link>
                <Link to="/admin/return">View Returns</Link>
            </div>

            {/* <a className="cart" href="#">
                <img src={cart} alt="cart" />
            </a> */}
            <div className="header-right">

                <div className="user-section">
                    <div className="user-avatar">
                        {email ? email.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="user-details">
                        <span className="user-email">
                            {email || "User"}
                        </span>
                        <span className="user-role">
                            Admin
                        </span>
                    </div>
                </div>
                <button className="logout" onClick={handleLogout}>Logout</button>
                
            </div>
        </header>
    );
}