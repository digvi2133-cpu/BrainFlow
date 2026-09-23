import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // 11. Return safe user data
        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
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
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // 6. Return safe user data
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
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