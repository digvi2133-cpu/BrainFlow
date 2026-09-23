import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const corsOptions = {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

// Socket.IO setup
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Health-check route
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "BrainFlow API is running",
    });
});

// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.originalUrl}`,
    });
});

// Socket connection events
io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

// Server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        httpServer.listen(PORT, () => {
            console.log(`BrainFlow server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();