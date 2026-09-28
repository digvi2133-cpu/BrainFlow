import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api.js";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.message;

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

async function handleSubmit(event) {
  event.preventDefault();

  setError("");
  setLoading(true);

  try {
    await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      },
    });

    // The backend sets the HttpOnly authentication cookie.
    // JavaScript does not need access to the JWT.

    navigate("/dashboard", { replace: true });
  } catch (err) {
    setError(err.message || "Login failed. Please try again.");
  } finally {
    setLoading(false);
  }
}


  return (
    <main className="flex items-center justify-center min-h-screen px-4 py-12 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center text-xl font-bold text-white shadow-lg h-11 w-11 rounded-xl bg-violet-500 shadow-violet-500/20">
            B
          </div>

          <span className="text-2xl font-semibold tracking-tight">
            BrainFlow
          </span>
        </Link>

        <div className="border shadow-2xl rounded-2xl border-white/10 bg-slate-900/80 p-7 shadow-violet-950/20 sm:p-9">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold tracking-widest uppercase text-violet-300">
              Welcome back
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
              Log in to BrainFlow
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Continue working on your ideas and documents.
            </p>
          </div>

          {successMessage && (
            <div
              role="status"
              className="px-4 py-3 mb-5 text-sm border rounded-lg border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
            >
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-xl border-white/10 bg-slate-950 placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-xl border-white/10 bg-slate-950 placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
              />
            </div>
            <div className="mt-2 text-right">
  <Link
    to="/forgot-password"
    className="text-sm font-medium transition text-violet-300 hover:text-violet-200"
  >
    Forgot password?
  </Link>
</div>
            {error && (
              <div
                role="alert"
                className="px-4 py-3 text-sm text-red-300 border rounded-lg border-red-400/20 bg-red-400/10"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-500 px-4 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="text-sm text-center mt-7 text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold transition text-violet-300 hover:text-violet-200"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default Login;