import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

export default function ForgotPassword() {
    const [step, setStep] = useState(1);
    const [resetToken, setResetToken] = useState("");

    const [form, setForm] = useState({
        email: "",
        otp: "",
        password: "",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");
        setLoading(true);

        try {
            // STEP 1: Send OTP
            if (step === 1) {
                await apiRequest("/auth/forgot-password", {
                    method: "POST",
                    body: {
                        email: form.email,
                    },
                });

                setMessage(
                    "OTP sent. Check your email."
                );

                setStep(2);
            }

            // STEP 2: Verify OTP
            else if (step === 2) {
                const response = await apiRequest(
                    "/auth/verify-reset-otp",
                    {
                        method: "POST",
                        body: {
                            email: form.email,
                            otp: form.otp,
                        },
                    }
                );

                setResetToken(
                    response.resetToken
                );

                setMessage(
                    "OTP verified successfully."
                );

                setStep(3);
            }

            // STEP 3: Reset password
            else if (step === 3) {
                await apiRequest(
                    "/auth/reset-password",
                    {
                        method: "POST",
                        body: {
                            email: form.email,
                            password: form.password,
                            resetToken,
                        },
                    }
                );

                setMessage(
                    "Password reset successfully. You can sign in now."
                );

                setStep(4);
            }
        } catch (error) {
            setError(
                error.message ||
                    "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="grid min-h-screen p-5 place-items-center">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md p-8 glass rounded-3xl"
            >
                <h1 className="text-2xl font-bold">
                    Reset password
                </h1>

                <p className="mt-2 mb-6 text-sm text-slate-400">
                    {step === 1 &&
                        "We'll send a one-time code."}

                    {step === 2 &&
                        "Enter the six-digit code sent to your email."}

                    {step === 3 &&
                        "Choose a new password."}

                    {step === 4 &&
                        "Your password has been reset."}
                </p>

                {message && (
                    <div className="p-3 mb-4 text-sm rounded-xl bg-emerald-500/10 text-emerald-300">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="p-3 mb-4 text-sm text-red-300 rounded-xl bg-red-500/10">
                        {error}
                    </div>
                )}

                {step < 4 && (
                    <>
                        {/* STEP 1 */}
                        {step === 1 && (
                            <input
                                className="w-full px-4 py-3 mb-3 outline-none rounded-xl bg-white/5"
                                type="email"
                                name="email"
                                required
                                placeholder="Email"
                                value={form.email}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        )}

                        {/* STEP 2 */}
                        {step === 2 && (
                            <input
                                className="mb-3 w-full rounded-xl bg-white/5 px-4 py-3 text-center tracking-[0.4em] outline-none"
                                type="text"
                                name="otp"
                                inputMode="numeric"
                                maxLength={6}
                                pattern="[0-9]{6}"
                                required
                                placeholder="OTP"
                                value={form.otp}
                                onChange={(e) => {
                                    const value =
                                        e.target.value.replace(
                                            /\D/g,
                                            ""
                                        );

                                    setForm((prev) => ({
                                        ...prev,
                                        otp: value,
                                    }));
                                }}
                                disabled={loading}
                            />
                        )}

                        {/* STEP 3 */}
                        {step === 3 && (
                            <input
                                className="w-full px-4 py-3 mb-3 outline-none rounded-xl bg-white/5"
                                type="password"
                                name="password"
                                minLength={8}
                                required
                                placeholder="New password"
                                value={form.password}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-3 font-semibold transition bg-indigo-500 rounded-xl hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Please wait..."
                                : step === 1
                                ? "Send OTP"
                                : step === 2
                                ? "Verify OTP"
                                : "Reset password"}
                        </button>
                    </>
                )}

                {step === 4 && (
                    <Link
                        to="/login"
                        className="block px-4 py-3 font-semibold text-center bg-indigo-500 rounded-xl"
                    >
                        Go to login
                    </Link>
                )}

                <Link
                    to="/login"
                    className="block mt-5 text-sm text-center text-slate-400"
                >
                    Back to login
                </Link>
            </form>
        </main>
    );
}