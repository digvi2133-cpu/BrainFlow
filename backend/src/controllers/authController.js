import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import Membership from "../models/Membership.js";

import {
    setAuthCookie,
    cookieOptions,
} from "../utils/auth.js";

import { sendOtpEmail } from "../services/mailService.js";

const normalizeEmail = (email) => {
    return email?.trim().toLowerCase();
};

/* =========================
   REGISTER
========================= */

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body || {};

        const normalizedEmail = normalizeEmail(email);

        if (!name?.trim() || !normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters.",
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered.",
            });
        }

        // Hash password before storing it
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        // Create default workspace
        const baseSlug =
            name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "") || "workspace";

        const slug = `${baseSlug}-${crypto
            .randomBytes(3)
            .toString("hex")}`;

        const workspace = await Workspace.create({
            name: `${name.trim()}'s Workspace`,
            slug,
            owner: user._id,
        });

        // Create owner membership
        await Membership.create({
            workspace: workspace._id,
            user: user._id,
            role: "owner",
        });

        // Login user immediately after registration
        setAuthCookie(res, user._id);

        return res.status(201).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            workspace,
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed.",
        });
    }
};

/* =========================
   LOGIN
========================= */

export const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        /*
         * IMPORTANT:
         * +password makes sure the password hash is returned
         * even if User.js has select:false on password.
         */
        const user = await User.findOne({
            email: normalizedEmail,
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // Prevent bcrypt from receiving undefined
        if (!user.password) {
            console.error(
                "LOGIN ERROR: Password hash missing for user:",
                user.email
            );

            return res.status(500).json({
                success: false,
                message: "Account password data is missing.",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // Create authentication cookie
        setAuthCookie(res, user._id);

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed.",
        });
    }
};

/* =========================
   GET CURRENT USER
========================= */

export const me = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select(
            "name email avatar createdAt"
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("ME ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch user.",
        });
    }
};

/* =========================
   LOGOUT
========================= */

export const logout = (req, res) => {
    res.clearCookie(
        process.env.COOKIE_NAME || "brainflow_auth",
        {
            ...cookieOptions(),
            maxAge: undefined,
        }
    );

    return res.status(200).json({
        success: true,
        message: "Logout successful",
    });
};

/* =========================
   FORGOT PASSWORD
   SEND OTP
========================= */

export const forgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body?.email);

        const user = await User.findOne({
            email,
        });

        /*
         * Do not reveal whether an account exists.
         */
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If the account exists, an OTP has been sent.",
            });
        }

        const now = Date.now();

        // Prevent OTP spam
        if (
            user.resetOtpSentAt &&
            now - user.resetOtpSentAt.getTime() < 60000
        ) {
            return res.status(429).json({
                success: false,
                message:
                    "Please wait before requesting another OTP.",
            });
        }

        // Generate 6-digit OTP
        const otp = String(
            crypto.randomInt(100000, 1000000)
        );

        // Store only OTP hash
        user.resetOtpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // OTP valid for 10 minutes
        user.resetOtpExpiresAt = new Date(
            now + 10 * 60 * 1000
        );

        user.resetOtpAttempts = 0;
        user.resetOtpSentAt = new Date();

        await user.save();

        // Send OTP through email
        await sendOtpEmail(user.email, otp);

        return res.status(200).json({
            success: true,
            message: "If the account exists, an OTP has been sent.",
        });
    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to send password reset OTP.",
        });
    }
};

/* =========================
   VERIFY RESET OTP
========================= */

export const verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body || {};

        const normalizedEmail = normalizeEmail(email);

        const user = await User.findOne({
            email: normalizedEmail,
        });

        if (
            !user ||
            !user.resetOtpExpiresAt ||
            user.resetOtpExpiresAt < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP expired or invalid.",
            });
        }

        // Maximum 5 attempts
        if ((user.resetOtpAttempts || 0) >= 5) {
            return res.status(429).json({
                success: false,
                message: "Too many OTP attempts.",
            });
        }

        user.resetOtpAttempts =
            (user.resetOtpAttempts || 0) + 1;

        const hash = crypto
            .createHash("sha256")
            .update(String(otp || ""))
            .digest("hex");

        if (hash !== user.resetOtpHash) {
            await user.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }

        /*
         * OTP has been successfully verified.
         *
         * Keep the reset session alive for 10 minutes.
         */
        user.resetOtpHash = undefined;

        user.resetOtpExpiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Generate secure reset session token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Store only hash of reset token
        user.resetSessionHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        await user.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified.",
            resetToken,
        });
    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify OTP.",
        });
    }
};

/* =========================
   RESET PASSWORD
========================= */

export const resetPassword = async (req, res) => {
    try {
        const {
            email,
            password,
            resetToken,
        } = req.body || {};

        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters.",
            });
        }

        const normalizedEmail = normalizeEmail(email);

        const user = await User.findOne({
            email: normalizedEmail,
        });

        if (
            !user ||
            !user.resetOtpExpiresAt ||
            user.resetOtpExpiresAt < new Date() ||
            !resetToken
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reset session expired. Verify OTP again.",
            });
        }

        const resetTokenHash = crypto
            .createHash("sha256")
            .update(String(resetToken))
            .digest("hex");

        if (resetTokenHash !== user.resetSessionHash) {
            return res.status(400).json({
                success: false,
                message:
                    "Reset session expired. Verify OTP again.",
            });
        }

        // Hash new password
        user.password = await bcrypt.hash(password, 12);

        // Clear reset data
        user.resetOtpExpiresAt = undefined;
        user.resetOtpHash = undefined;
        user.resetOtpAttempts = 0;
        user.resetOtpSentAt = undefined;
        user.resetSessionHash = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful.",
        });
    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to reset password.",
        });
    }
};
