const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export async function apiRequest(
    path,
    { method = "GET", body } = {}
) {
    const headers = {
        "Content-Type": "application/json",
    };

    const publicPaths = [
        "/auth/login",
        "/auth/register",
        "/auth/forgot-password",
        "/auth/verify-reset-otp",
        "/auth/reset-password",
    ];

    const requiresAuth = !publicPaths.includes(path);

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        credentials: "include",
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401 && requiresAuth) {
            window.location.href = "/login";
            return;
        }

        throw new Error(
            data.message || `Request failed (${response.status})`
        );
    }

    return data;
}
