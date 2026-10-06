import { Router } from "express";

import {
    register,
    login,
    me,
    logout,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", protect, me);
router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

export default router;