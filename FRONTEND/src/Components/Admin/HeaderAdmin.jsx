import {Link,useNavigate} from "react-router-dom";
import logo from "../../images/logo.png";
export default function Header() {
    const navigate=useNavigate();
    const email=localStorage.getItem("email");
    function handleLogout(){
        localStorage.removeItem("email");
        navigate("/login",{replace:true});
    }

    return (
        <aside className="admin-sidebar" aria-label="Admin workspace">
            <Link to="/admin" className="admin-sidebar-brand">
                <img src={logo} alt="" />
                <span>
                    <strong>HerbHaven</strong>
                    <small>ADMIN WORKSPACE</small>
                </span>
            </Link>

            <nav className="admin-sidebar-nav" aria-label="Admin navigation">
                <Link to="/admin">Dashboard</Link>
                <Link to="/admin/shop">Products</Link>
                <Link to="/admin/orders">Orders</Link>
                <Link to="/admin/return">Returns</Link>
                <Link to="/admin/inventory">Inventory</Link>
                <Link to="/admin/about">About HerbHaven</Link>
            </nav>

            <div className="admin-sidebar-footer">
                <div className="admin-sidebar-user">
                    <span className="admin-sidebar-avatar">
                        {email ? email.charAt(0).toUpperCase() : "U"}
                    </span>
                    <span className="admin-sidebar-user-details">
                        <strong>{email || "User"}</strong>
                        <small>Administrator</small>
                    </span>
                </div>
                <button className="logout" onClick={handleLogout}>Log out</button>
            </div>
        </aside>
    );
}