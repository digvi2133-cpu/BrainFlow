import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";

import { socketAuth } from "./socket/socketAuth.js";
import { getWorkspaceMembership } from "./utils/workspaceAccess.js";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const corsOptions = {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

io.use(socketAuth);

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "BrainFlow API is running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.originalUrl}`,
    });
});

io.on("connection", (socket) => {
    const userId = socket.user.userId;

    socket.join(`user:${userId}`);

    console.log(
        `Authenticated socket connected: ${socket.id} | User: ${userId}`
    );

    socket.on("workspace:join", async (workspaceId, callback) => {
        try {
            const result = await getWorkspaceMembership(
                workspaceId,
                userId
            );

            if (!result) {
                const response = {
                    success: false,
                    message: "Workspace not found or access denied",
                };

                if (typeof callback === "function") {
                    callback(response);
                }

                return;
            }

            const room = `workspace:${workspaceId}`;

            await socket.join(room);

            const response = {
                success: true,
                workspaceId: workspaceId.toString(),
                role: result.membership.role,
            };

            if (typeof callback === "function") {
                callback(response);
            }

            console.log(
                `User ${userId} joined workspace ${workspaceId}`
            );
        } catch (error) {
            console.error("Workspace join error:", error);

            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: "Unable to join workspace",
                });
            }
        }
    });

    socket.on("workspace:leave", async (workspaceId, callback) => {
        try {
            const room = `workspace:${workspaceId}`;

            await socket.leave(room);

            if (typeof callback === "function") {
                callback({
                    success: true,
                    workspaceId: workspaceId.toString(),
                });
            }

            console.log(
                `User ${userId} left workspace ${workspaceId}`
            );
        } catch (error) {
            console.error("Workspace leave error:", error);

            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: "Unable to leave workspace",
                });
            }
        }
    });

    socket.on("disconnect", (reason) => {
        console.log(
            `Socket disconnected: ${socket.id} | User: ${userId} | Reason: ${reason}`
        );
    });
});

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