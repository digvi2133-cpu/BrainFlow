import express from "express";

import {
    registerUser,
    loginUser,
    logout,
    getMe,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authRateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post("/register", authRateLimiter, registerUser);

router.post("/login", authRateLimiter, loginUser);

router.post("/logout", logout);

router.get("/me", protect, getMe);

// Password recovery
router.post("/forgot-password", authRateLimiter, forgotPassword);

router.post("/verify-reset-otp", authRateLimiter, verifyResetOtp);

router.post("/reset-password", authRateLimiter, resetPassword);

export default router;