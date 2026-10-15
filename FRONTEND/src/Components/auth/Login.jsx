import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../images/logo.png";
import "./Auth.css";

export default function Login() {

    const [role, setRole] = useState("customer");

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            alert("Please enter email and password");
            return;
        }

        if (formData.password.length < 6) {
            alert("Password must be at least 6 characters long!");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: formData.email.trim(),
                        password: formData.password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Login failed!");
                return;
            }

            // Verify the selected role against the database role
            if (data.user.role !== role) {
                alert(
                    `This account is registered as ${data.user.role}. Please select the correct role.`
                );
                return;
            }

            // Save login details only after role validation
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("email", data.user.email);
            localStorage.setItem("address", data.user.address || "");

            alert("Login successful!");

            // Navigate according to the verified role
            if (data.user.role === "admin") {
                navigate("/admin");
            } else if (data.user.role === "customer") {
                navigate("/customer");
            } else {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                alert("Invalid user role!");
            }

        } catch (error) {
            console.error("Login error:", error);
            alert("Unable to connect to the server!");
        }
    };


    return (

        <div className="auth-page">

            {/* ================= LEFT SIDE ================= */}

            <div className="auth-left">

                <div className="brand-section">
                    <img src={logo} alt="logo" />

                    <h1>HerbHaven</h1>

                    <p>
                        NATURAL CARE • BRIGHTER TOMORROWS
                    </p>

                </div>


                <div className="welcome-section">

                    <h2>
                        Nature's Goodness
                        <br />
                        for a Better You
                    </h2>

                    <p> 100% Natural Products</p>

                    <p> Trusted by Thousands</p>

                    <p> A Healthier & Happier Tomorrow</p>

                </div>

            </div>


            {/* ================= RIGHT SIDE ================= */}

            <div className="auth-right">

                <div className="auth-card">


                    {/* HEADER */}

                    <div className="auth-header">

                        <h1>Welcome Back</h1>

                        <p>
                            Login to continue with HerbHaven
                        </p>

                    </div>


                    {/* ================= ROLE DROPDOWN ================= */}

                    <div className="role-section">

                        <label>Select Role</label>

                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >

                            <option value="customer">
                                Customer
                            </option>

                            <option value="admin">
                                Admin
                            </option>

                        </select>

                    </div>


                    {/* ================= LOGIN / REGISTER ================= */}

                    <div className="auth-tabs">

                        <button
                            className="active-tab"
                            type="button"
                        >
                            Login
                        </button>

                        <Link
                            to="/register"
                            className="tab-link"
                        >
                            Register
                        </Link>

                    </div>


                    {/* ================= LOGIN FORM ================= */}

                    <form onSubmit={handleSubmit}>

                        {/* EMAIL */}

                        <div className="input-group">

                            <label>Email Address</label>

                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />

                        </div>


                        {/* PASSWORD */}

                        <div className="input-group">

                            <label>Password</label>

                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                minLength={6}
                                required
                            />

                        </div>


                        {/* FORGOT PASSWORD */}

                        <div className="forgot-password">

                            <a href="#">
                                Forgot Password?
                            </a>

                        </div>


                        {/* LOGIN BUTTON */}

                        <button
                            type="submit"
                            className="submit-btn"
                        >

                            Login as{" "}
                            {role === "customer"
                                ? "Customer"
                                : "Admin"}

                        </button>

                    </form>


                    {/* FOOTER */}

                    <div className="auth-footer">

                        <p>
                            Don't have an account?
                            {" "}

                            <Link to="/register">
                                Register
                            </Link>

                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}