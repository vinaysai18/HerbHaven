import React from "react";
import { Routes, Route } from "react-router-dom";

import LandingPage from "./LandingPage";
import Auth from "./Auth";

function App() {
    return (
        <Routes>

            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Authentication */}
            <Route path="/*" element={<Auth />} />

        </Routes>
    );
}

export default App;