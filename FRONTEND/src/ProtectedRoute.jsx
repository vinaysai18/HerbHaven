import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRole }) {
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");

    // Not logged in
    if (!token || !userString) {
        return <Navigate to="/login" replace />;
    }

    let user;

    try {
        user = JSON.parse(userString);
    } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return <Navigate to="/login" replace />;
    }

    // Check the role stored for the logged-in user
    if (user.role !== allowedRole) {
        if (user.role === "admin") {
            return <Navigate to="/admin" replace />;
        }

        if (user.role === "customer") {
            return <Navigate to="/customer" replace />;
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}