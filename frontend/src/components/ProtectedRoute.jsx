import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { apiRequest } from "../lib/api.js";

function ProtectedRoute() {
    const location = useLocation();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function verifySession() {
            try {
                await apiRequest("/auth/me");

                if (mounted) {
                    setAuthenticated(true);
                }
            } catch {
                if (mounted) {
                    setAuthenticated(false);
                }
            } finally {
                if (mounted) {
                    setCheckingAuth(false);
                }
            }
        }

        verifySession();

        return () => {
            mounted = false;
        };
    }, []);

    if (checkingAuth) {
        return (
            <main className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
                <p className="text-sm text-slate-400">
                    Checking your session...
                </p>
            </main>
        );
    }

    if (!authenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;