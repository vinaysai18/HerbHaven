import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Components/auth/Login";
import Register from "./Components/auth/Register";
import Admin from "./Admin";
import Customer from "./Customer";
import ProtectedRoute from "./ProtectedRoute";

export default function Auth() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute allowedRole="admin" />}>
                <Route path="/admin/*" element={<Admin />} />
            </Route>

            {/* Customer-only routes */}
            <Route element={<ProtectedRoute allowedRole="customer" />}>
                <Route path="/customer/*" element={<Customer />} />
            </Route>

            {/* Default routes */}
            <Route
                path="/"
                element={<Navigate to="/login" replace />}
            />

            <Route
                path="*"
                element={<Navigate to="/login" replace />}
            />
        </Routes>
    );
}