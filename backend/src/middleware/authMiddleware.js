import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
    try {
        // 1. Read the Authorization header
        const authHeader = req.headers.authorization;

        // 2. Check whether the token exists and uses Bearer format
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please provide a token.",
            });
        }

        // 3. Extract the token
        const token = authHeader.split(" ")[1];

        // 4. Check whether JWT_SECRET is configured
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Server authentication configuration error.",
            });
        }

        // 5. Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 6. Attach the authenticated user's ID to the request
        req.user = {
            userId: decoded.userId,
        };

        // 7. Continue to the protected route
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please log in again.",
        });
    }
};