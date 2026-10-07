import {
    useEffect,
    useState,
} from "react";

import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import { apiRequest } from "./lib/api.js";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Document from "./pages/Document.jsx";
import Notifications from "./pages/Notifications.jsx";

export default function App() {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        apiRequest("/auth/me")
            .then((response) => {
                setUser(response.user);
            })
            .catch(() => {
                setUser(null);
            })
            .finally(() => {
                setChecking(false);
            });
    }, []);

    if (checking) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#050509] text-slate-400">
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full animate-pulse bg-violet-400" />

                    Loading BrainFlow...
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* PUBLIC LANDING */}
                <Route
                    path="/"
                    element={<Landing />}
                />

                {/* AUTH */}
                <Route
                    path="/login"
                    element={
                        user ? (
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        ) : (
                            <Login
                                onLogin={setUser}
                            />
                        )
                    }
                />

                <Route
                    path="/register"
                    element={
                        user ? (
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        ) : (
                            <Register
                                onLogin={setUser}
                            />
                        )
                    }
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                {/* PROTECTED APP */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute user={user}>
                            <Dashboard user={user} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/documents/:documentId"
                    element={
                        <ProtectedRoute user={user}>
                            <Document user={user} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute user={user}>
                            <Notifications user={user} />
                        </ProtectedRoute>
                    }
                />

                {/* FALLBACK */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}