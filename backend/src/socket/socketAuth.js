import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getAuthTokenFromCookie = (cookieHeader) => {
    if (!cookieHeader) {
        return null;
    }

    const cookies = cookieHeader.split(";");

    for (const cookie of cookies) {
        const [name, ...valueParts] = cookie.trim().split("=");

        if (name === "brainflow_auth") {
            return decodeURIComponent(valueParts.join("="));
        }
    }

    return null;
};

export const socketAuth = async (socket, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            return next(
                new Error("Server authentication configuration error")
            );
        }

        // Read the HttpOnly authentication cookie.
        const cookieHeader = socket.handshake.headers.cookie;

        const token = getAuthTokenFromCookie(cookieHeader);

        if (!token) {
            return next(new Error("Authentication required"));
        }

        // Verify JWT from the authentication cookie.
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Check that the user's session is still valid.
        const user = await User.findById(decoded.userId).select(
            "tokenVersion"
        );

        if (!user) {
            return next(new Error("User account not found"));
        }

        const currentTokenVersion = user.tokenVersion ?? 0;
        const tokenVersion = decoded.tokenVersion ?? 0;

        if (tokenVersion !== currentTokenVersion) {
            return next(new Error("Session is no longer valid"));
        }

        // Attach authenticated user information to the socket.
        socket.user = {
            userId: decoded.userId,
        };

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return next(new Error("Session expired"));
        }

        console.error(
            "Socket authentication error:",
            error.message
        );

        return next(new Error("Invalid authentication"));
    }
};