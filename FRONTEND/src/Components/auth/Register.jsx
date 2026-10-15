import { useState } from "react";
import "./Auth.css";
import logo from "../../images/logo.png";
import { useNavigate } from "react-router-dom";

export default function Register() {

    const [role, setRole] = useState("customer");
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        adminId: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        address: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check password
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (formData.password.length < 6) {
            alert("password must be atleast 6 character long!");
            return;
        }

        // Customer registration
        if (role === "customer") {

            try {
                const response = await fetch(
                    "http://localhost:5000/api/auth/register",
                    {
                        method: "POST",
                        headers: {
                            "Content-type": "application/json"
                        },
                        body: JSON.stringify({
                            name: formData.name,
                            email: formData.email,
                            password: formData.password,
                            phone: formData.phone,
                            address: formData.address
                        })
                    }
                );
                const data = await response.json();
                if (!response.ok) {
                    alert(data.message || "Registration failed!");
                    return;
                }
                localStorage.setItem("address", formData.address);
                console.log("Customer Registered:", data.user);
                alert("Customer registered successfully!");
                navigate("/login");
            } catch (error) {
                console.log("registration erroe", error);
                alert("Cannot connect to the server. Please try again.");
            }




        }

        // Admin registration
        else {

            const admin = {
                name: formData.name,
                adminId: formData.adminId,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            };

            console.log("Admin Registered:", admin);

            alert("Admin registered successfully!");
            navigate("/login");
        }
    };


    return (

        <div className="auth-page">

            {/* LEFT SIDE */}

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

                    <p>100% Natural Products</p>

                    <p>Trusted by Thousands</p>

                    <p>A Healthier & Happier Tomorrow</p>

                </div>

            </div>


            {/* RIGHT SIDE */}

            <div className="auth-right">

                <div className="auth-card">

                    {/* HEADER */}

                    <div className="auth-header">

                        <h1>Create Account</h1>

                        <p>
                            Register to continue with HerbHaven
                        </p>

                    </div>


                    {/* ROLE */}

                    <div className="role-section">

                        <label>Select Role</label>

                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >

                            <option value="customer">
                                Customer
                            </option>

                        </select>

                    </div>


                    {/* REGISTER FORM */}

                    <form onSubmit={handleSubmit}>

                        {/* NAME */}

                        <div className="input-group">

                            <label>
                                {role === "customer"
                                    ? "Full Name"
                                    : "Admin Name"}
                            </label>

                            <input
                                type="text"
                                name="name"
                                placeholder={
                                    role === "customer"
                                        ? "Enter your full name"
                                        : "Enter admin name"
                                }
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />

                        </div>


                        {/* ADMIN ID */}

                        {role === "admin" && (

                            <div className="input-group">

                                <label>Admin ID</label>

                                <input
                                    type="text"
                                    name="adminId"
                                    placeholder="Enter admin ID"
                                    value={formData.adminId}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                        )}


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


                        {/* PHONE */}

                        <div className="input-group">

                            <label>Phone Number</label>

                            <input
                                type="tel"
                                name="phone"
                                placeholder="Enter your phone number"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />

                        </div>


                        {/* ADDRESS - CUSTOMER ONLY */}

                        {role === "customer" && (

                            <div className="input-group">

                                <label>Address</label>

                                <textarea
                                    name="address"
                                    placeholder="Enter your address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                        )}


                        {/* PASSWORD */}

                        <div className="input-group">

                            <label>Password</label>

                            <input
                                type="password"
                                name="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                minLength={6}
                                required
                            />

                        </div>


                        {/* CONFIRM PASSWORD */}

                        <div className="input-group">

                            <label>Confirm Password</label>

                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />

                        </div>


                        {/* REGISTER BUTTON */}

                        <button
                            type="submit"
                            className="submit-btn"
                        >

                            Register as{" "}
                            {role === "customer"
                                ? "Customer"
                                : "Admin"}

                        </button>

                    </form>


                    {/* LOGIN LINK */}

                    <div className="auth-footer">

                        <p>
                            Already have an account?
                            {" "}
                            <a href="/login">
                                Login
                            </a>
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}