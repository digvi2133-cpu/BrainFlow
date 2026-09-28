import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
    randomInt,
    randomBytes,
    createHmac,
    timingSafeEqual,
} from "crypto";
import { sendEmail } from "../services/emailService.js";

// ================= AUTH COOKIE =================

const setAuthCookie = (res, token) => {
    res.cookie("brainflow_auth", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
    });
};

// ================= REGISTER USER =================

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Validate input types and required fields
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
        }

        // 2. Normalize input
        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        // 3. Validate name
        if (normalizedName.length < 2 || normalizedName.length > 80) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 2 and 80 characters",
            });
        }

        // 4. Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            normalizedEmail.length > 254 ||
            !emailRegex.test(normalizedEmail)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        }

        // 5. Validate password
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
        }

        // 6. Check JWT configuration
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Authentication is not configured",
            });
        }

        // 7. Check for an existing account
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
        }

        // 8. Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // 9. Create user
        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            passwordHash,
        });

        // 10. Generate JWT
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                tokenVersion: user.tokenVersion,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // 11. Store JWT in HttpOnly cookie
        setAuthCookie(res, token);

        // 12. Return safe user data
        return res.status(201).json({
            success: true,
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        // Handle duplicate email conflicts
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred during registration",
        });
    }
};

// ================= LOGIN USER =================

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Check JWT configuration
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Authentication is not configured",
            });
        }

        // 3. Find user and include passwordHash
        const user = await User.findOne({
            email: normalizedEmail,
        }).select("+passwordHash");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // 4. Compare password with stored hash
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // 5. Generate JWT
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                tokenVersion: user.tokenVersion,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // 6. Store JWT in HttpOnly cookie
        setAuthCookie(res, token);

        // 7. Return safe user data
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred during login",
        });
    }
};
// ================= LOGOUT USER =================

export const logout = (req, res) => {
    res.clearCookie("brainflow_auth", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    return res.status(200).json({
        success: true,
        message: "Logout successful",
    });
};
// ================= GET CURRENT USER =================

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Get current user error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve user details.",
        });
    }
};

// ================= PASSWORD RECOVERY OTP =================

// Hash the OTP using a server-side secret before storing it.
const hashOtp = (otp) => {
    const secret = process.env.RESET_OTP_SECRET;

    if (!secret) {
        throw new Error("RESET_OTP_SECRET is not configured.");
    }

    return createHmac("sha256", secret)
        .update(otp)
        .digest("hex");
};

// ================= FORGOT PASSWORD =================

export const forgotPassword = async (req, res) => {
    try {
        const emailInput = req.body?.email;

        if (typeof emailInput !== "string" || !emailInput.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email address.",
            });
        }

        const email = emailInput.trim().toLowerCase();

        const genericMessage =
            "If an account exists for that email, a password recovery OTP will be sent.";

        // Find the account and include the resend timestamp.
        const user = await User.findOne({ email })
            .select("+resetOtpSentAt");

        // Do not reveal whether an account exists.
        if (!user) {
            return res.status(200).json({
                success: true,
                message: genericMessage,
            });
        }

        // Limit OTP resends to once every 60 seconds.
        const now = Date.now();
        const lastSentAt = user.resetOtpSentAt?.getTime();

        if (lastSentAt && now - lastSentAt < 60 * 1000) {
            return res.status(429).json({
                success: false,
                message: "Please wait before requesting another OTP.",
            });
        }

        // Generate a cryptographically secure six-digit OTP.
        const otp = randomInt(100000, 1000000).toString();

        // Store only the OTP hash and its expiry.
        user.resetOtpHash = hashOtp(otp);
        user.resetOtpExpiresAt = new Date(now + 10 * 60 * 1000);
        user.resetOtpAttempts = 0;
        user.resetOtpSentAt = new Date(now);

        await user.save();

        try {
            await sendEmail({
                to: user.email,
                subject: "BrainFlow password recovery OTP",

                text: `Your BrainFlow password recovery OTP is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,

                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
                        <h2>BrainFlow password recovery</h2>

                        <p>
                            Use this one-time password to continue resetting your password:
                        </p>

                        <div style="font-size: 28px; font-weight: bold; letter-spacing: 8px; padding: 16px 0;">
                            ${otp}
                        </div>

                        <p>
                            This OTP expires in <strong>10 minutes</strong>.
                        </p>

                        <p>
                            If you did not request this password reset, you can safely ignore this email.
                        </p>
                    </div>
                `,
            });
        } catch (emailError) {
            // Invalidate the OTP if the email could not be sent.
            user.resetOtpHash = undefined;
            user.resetOtpExpiresAt = undefined;
            user.resetOtpAttempts = 0;
            user.resetOtpSentAt = undefined;

            await user.save();

            console.error(
                "Password recovery email failed:",
                emailError.message
            );

            return res.status(503).json({
                success: false,
                message:
                    "We couldn't send the recovery email. Please try again later.",
            });
        }

        return res.status(200).json({
            success: true,
            message: genericMessage,
        });
    } catch (error) {
        console.error("Forgot password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};

// ================= VERIFY PASSWORD RECOVERY OTP =================

export const verifyResetOtp = async (req, res) => {
    try {
        const { email: emailInput, otp } = req.body ?? {};

        if (
            typeof emailInput !== "string" ||
            typeof otp !== "string" ||
            !emailInput.trim() ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid email address and six-digit OTP.",
            });
        }

        const email = emailInput.trim().toLowerCase();

        // Explicitly select fields that are hidden by the User schema.
        const user = await User.findOne({ email }).select(
            "+resetOtpHash +resetOtpExpiresAt +resetOtpAttempts"
        );

        if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt) {
            return res.status(400).json({
                success: false,
                message:
                    "The OTP is invalid or has expired. Please request a new one.",
            });
        }

        // Reject expired OTPs.
        if (user.resetOtpExpiresAt.getTime() <= Date.now()) {
            user.resetOtpHash = undefined;
            user.resetOtpExpiresAt = undefined;
            user.resetOtpAttempts = 0;
            await user.save();

            return res.status(400).json({
                success: false,
                message:
                    "The OTP is invalid or has expired. Please request a new one.",
            });
        }

        // Allow at most five verification attempts.
        if (user.resetOtpAttempts >= 5) {
            user.resetOtpHash = undefined;
            user.resetOtpExpiresAt = undefined;
            user.resetOtpAttempts = 0;
            await user.save();

            return res.status(429).json({
                success: false,
                message:
                    "Too many incorrect attempts. Please request a new OTP.",
            });
        }

        const submittedHash = Buffer.from(hashOtp(otp), "hex");
        const storedHash = Buffer.from(user.resetOtpHash, "hex");

        const otpMatches =
            submittedHash.length === storedHash.length &&
            timingSafeEqual(submittedHash, storedHash);

        if (!otpMatches) {
            user.resetOtpAttempts += 1;

            // Invalidate the OTP after the fifth incorrect attempt.
            if (user.resetOtpAttempts >= 5) {
                user.resetOtpHash = undefined;
                user.resetOtpExpiresAt = undefined;
                user.resetOtpAttempts = 0;
            }

            await user.save();

            return res.status(400).json({
                success: false,
                message:
                    "The OTP is invalid or has expired. Please check it and try again.",
            });
        }

        // OTP is valid. Invalidate it so it cannot be reused.
        user.resetOtpHash = undefined;
        user.resetOtpExpiresAt = undefined;
        user.resetOtpAttempts = 0;

        // Create a random, short-lived reset token.
        const resetToken = randomBytes(32).toString("hex");

        user.resetTokenHash = createHmac(
            "sha256",
            process.env.RESET_OTP_SECRET
        )
            .update(resetToken)
            .digest("hex");

        // Reset token expires in 10 minutes.
        user.resetTokenExpiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await user.save();

        return res.status(200).json({
            success: true,
            message:
                "OTP verified successfully. You can now reset your password.",
            resetToken,
        });
    } catch (error) {
        console.error("OTP verification error:", error.message);

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong while verifying the OTP.",
        });
    }
};

// ================= RESET PASSWORD =================

export const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body ?? {};

        if (
            typeof resetToken !== "string" ||
            !/^[a-f0-9]{64}$/i.test(resetToken) ||
            typeof newPassword !== "string" ||
            newPassword.length < 8
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid reset token and a password with at least 8 characters.",
            });
        }

        if (!process.env.RESET_OTP_SECRET) {
            console.error("RESET_OTP_SECRET is not configured.");

            return res.status(500).json({
                success: false,
                message: "Password recovery is not configured.",
            });
        }

        const submittedTokenHash = createHmac(
            "sha256",
            process.env.RESET_OTP_SECRET
        )
            .update(resetToken)
            .digest("hex");

        const user = await User.findOne({
            resetTokenHash: submittedTokenHash,
        }).select("+resetTokenHash +resetTokenExpiresAt");

        if (
            !user ||
            !user.resetTokenExpiresAt ||
            user.resetTokenExpiresAt.getTime() <= Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "The reset token is invalid or has expired. Please verify your OTP again.",
            });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 12);

        user.resetTokenHash = undefined;
        user.resetTokenExpiresAt = undefined;
        user.resetOtpHash = undefined;
        user.resetOtpExpiresAt = undefined;
        user.resetOtpAttempts = 0;
        user.resetOtpSentAt = undefined;

        // Invalidate existing authenticated sessions.
        user.tokenVersion += 1;

        await user.save();

        return res.status(200).json({
            success: true,
            message:
                "Your password has been reset successfully. Please log in with your new password.",
        });
    } catch (error) {
        console.error("Password reset error:", error.message);

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong while resetting your password.",
        });
    }
};