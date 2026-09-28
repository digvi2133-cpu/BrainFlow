import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api.js";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [resendCountdown, setResendCountdown] = useState(0);

  // ================= RESEND COUNTDOWN =================

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCountdown((current) => current - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  // ================= SEND OTP =================

  async function handleSendOtp(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: {
          email: normalizedEmail,
        },
      });

      setEmail(normalizedEmail);
      setMessage(
        data.message ||
          "If an account exists for this email, a recovery OTP has been sent."
      );

      setStep(2);
      setOtp("");
      setResendCountdown(60);
    } catch (err) {
      setError(
        err.message || "Unable to send the recovery OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ================= VERIFY OTP =================

  async function handleVerifyOtp(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/verify-reset-otp", {
        method: "POST",
        body: {
          email,
          otp,
        },
      });

      if (!data.resetToken) {
        throw new Error("Reset authorization was not received.");
      }

      setResetToken(data.resetToken);
      setMessage(
        data.message || "OTP verified. You can now create a new password."
      );

      setStep(3);
    } catch (err) {
      setError(
        err.message || "Unable to verify the OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ================= RESEND OTP =================

  async function handleResendOtp() {
    if (resendCountdown > 0 || loading) {
      return;
    }

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: {
          email,
        },
      });

      setMessage(
        data.message ||
          "If an account exists for this email, a new recovery OTP has been sent."
      );

      setOtp("");
      setResendCountdown(60);
    } catch (err) {
      setError(
        err.message || "Unable to resend the OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ================= RESET PASSWORD =================

  async function handleResetPassword(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      setError("Your password reset session is invalid. Please start again.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: {
          resetToken,
          newPassword,
        },
      });

      setMessage(
        data.message ||
          "Your password has been reset successfully."
      );

      setNewPassword("");
      setConfirmPassword("");
      setResetToken("");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(
        err.message || "Unable to reset your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ================= UI =================

  return (
    <main className="flex items-center justify-center min-h-screen px-4 py-12 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md">
        {/* Logo */}

        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center text-xl font-bold text-white shadow-lg h-11 w-11 rounded-xl bg-violet-500 shadow-violet-500/20">
            B
          </div>

          <span className="text-2xl font-semibold tracking-tight">
            BrainFlow
          </span>
        </Link>

        <div className="border shadow-2xl rounded-2xl border-white/10 bg-slate-900/80 p-7 shadow-violet-950/20 sm:p-9">
          {/* Header */}

          <div className="mb-8 text-center">
            <p className="text-sm font-semibold tracking-widest uppercase text-violet-300">
              Account recovery
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
              {step === 1 && "Forgot your password?"}
              {step === 2 && "Verify your OTP"}
              {step === 3 && "Create new password"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {step === 1 &&
                "Enter the email address associated with your BrainFlow account."}

              {step === 2 &&
                `Enter the 6-digit OTP sent to ${email}. The OTP expires in 10 minutes.`}

              {step === 3 &&
                "Create a strong new password for your BrainFlow account."}
            </p>
          </div>

          {/* ================= STEP 1 ================= */}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
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
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-xl border-white/10 bg-slate-950 placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                />
              </div>

              <MessageBox message={message} error={error} />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-violet-500 px-4 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending OTP..." : "Send recovery OTP"}
              </button>
            </form>
          )}

          {/* ================= STEP 2 ================= */}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label
                  htmlFor="otp"
                  className="block mb-2 text-sm font-medium text-slate-300"
                >
                  6-digit OTP
                </label>

                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, ""))
                  }
                  required
                  className="w-full px-4 py-3 text-center text-xl font-semibold tracking-[0.5em] text-white transition border outline-none rounded-xl border-white/10 bg-slate-950 placeholder:text-slate-600 placeholder:tracking-[0.5em] focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                />
              </div>

              <MessageBox message={message} error={error} />

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full rounded-xl bg-violet-500 px-4 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <div className="text-sm text-center text-slate-400">
                Didn't receive the OTP?
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || loading}
                  className="ml-1 font-semibold transition text-violet-300 hover:text-violet-200 disabled:cursor-not-allowed disabled:text-slate-600"
                >
                  {resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : "Resend OTP"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setMessage("");
                  setError("");
                  setOtp("");
                }}
                className="w-full text-sm font-medium transition text-slate-400 hover:text-slate-200"
              >
                Use a different email
              </button>
            </form>
          )}

          {/* ================= STEP 3 ================= */}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block mb-2 text-sm font-medium text-slate-300"
                >
                  New password
                </label>

                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-xl border-white/10 bg-slate-950 placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block mb-2 text-sm font-medium text-slate-300"
                >
                  Confirm new password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                  minLength={8}
                  className="w-full px-4 py-3 text-sm text-white transition border outline-none rounded-xl border-white/10 bg-slate-950 placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                />
              </div>

              <MessageBox message={message} error={error} />

              <button
                type="submit"
                disabled={
                  loading ||
                  newPassword.length < 8 ||
                  confirmPassword.length < 8
                }
                className="w-full rounded-xl bg-violet-500 px-4 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Resetting password..." : "Reset password"}
              </button>
            </form>
          )}

          {/* Login link */}

          <p className="text-sm text-center mt-7 text-slate-400">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-semibold transition text-violet-300 hover:text-violet-200"
            >
              Back to log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

// ================= MESSAGE COMPONENT =================

function MessageBox({ message, error }) {
  return (
    <>
      {message && (
        <div
          role="status"
          className="px-4 py-3 text-sm border rounded-lg border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="px-4 py-3 text-sm text-red-300 border rounded-lg border-red-400/20 bg-red-400/10"
        >
          {error}
        </div>
      )}
    </>
  );
}

export default ForgotPassword;