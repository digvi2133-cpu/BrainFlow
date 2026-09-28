import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies?.brainflow_auth;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Server authentication configuration error",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select(
            "tokenVersion"
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found",
            });
        }

        const currentTokenVersion = user.tokenVersion ?? 0;
        const tokenVersion = decoded.tokenVersion ?? 0;

        if (tokenVersion !== currentTokenVersion) {
            return res.status(401).json({
                success: false,
                message: "Session is no longer valid",
            });
        }

        req.user = {
            userId: decoded.userId,
        };

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Session expired",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid authentication",
        });
    }
};