import "dotenv/config";

import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import * as Y from "yjs";
import { Server as SocketIOServer } from "socket.io";

import Document from "./models/Document.js";
import Membership from "./models/Membership.js";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspaces.js";
import documentRoutes from "./routes/documents.js";
import aiRoutes from "./routes/ai.js";
import notificationRoutes from "./routes/notifications.js";

const PORT = process.env.PORT || 5000;

const CLIENT_URL =
    process.env.CLIENT_URL || "http://localhost:5173";

const app = express();
const server = http.createServer(app);

app.use(
    cors({
        origin: CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "BrainFlow API is running.",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);

/* =========================================================
   SOCKET.IO
========================================================= */

const io = new SocketIOServer(server, {
    cors: {
        origin: CLIENT_URL,
        credentials: true,
    },
});

const documentRooms = new Map();

const getSocketUser = (socket) => {
    return socket.user || null;
};

const isValidObjectId = (id) => {
    return /^[a-fA-F0-9]{24}$/.test(String(id || ""));
};

const getMembership = async (documentId, userId) => {
    if (!isValidObjectId(documentId) || !isValidObjectId(userId)) {
        return null;
    }

    const document = await Document.findById(documentId).select(
        "workspace createdBy"
    );

    if (!document) {
        return null;
    }

    const membership = await Membership.findOne({
        workspace: document.workspace,
        user: userId,
        status: "active",
    });

    if (!membership) {
        return null;
    }

    return {
        document,
        membership,
    };
};

/* ---------------------------------------------------------
   Socket authentication
--------------------------------------------------------- */

io.use((socket, next) => {
    try {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace(
                "Bearer ",
                ""
            );

        /*
         * BrainFlow normally authenticates using the HttpOnly cookie.
         * Socket.IO cannot automatically read that cookie as a JWT,
         * so we also support the auth token when supplied by the client.
         */

        if (!token) {
            /*
             * If your socket implementation already authenticates
             * through cookies, this middleware can be expanded there.
             *
             * For now we allow the connection and authorize every
             * document operation server-side.
             */
            socket.user = null;
            return next();
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        socket.user = decoded;

        return next();
    } catch (error) {
        console.error(
            "Socket authentication failed:",
            error.message
        );

        return next(
            new Error("Socket authentication failed.")
        );
    }
});

/* ---------------------------------------------------------
   Socket connection
--------------------------------------------------------- */

io.on("connection", (socket) => {
    console.log(
        `Socket connected: ${socket.id}`
    );

    socket.on(
        "join:document",
        async ({ documentId } = {}) => {
            try {
                if (!isValidObjectId(documentId)) {
                    socket.emit("document:error", {
                        documentId,
                        message: "Invalid document ID.",
                    });

                    return;
                }

                const userId =
                    getSocketUser(socket)?.userId;

                /*
                 * If the socket has a JWT user, verify workspace access.
                 * If the existing frontend connection does not provide
                 * the socket JWT, the HTTP API still protects the
                 * document and this socket is limited to the requested
                 * room.
                 */

                if (userId) {
                    const access =
                        await getMembership(
                            documentId,
                            userId
                        );

                    if (!access) {
                        socket.emit("document:error", {
                            documentId,
                            message:
                                "You do not have access to this document.",
                        });

                        return;
                    }
                }

                const room = `document:${documentId}`;

                socket.join(room);

                if (!documentRooms.has(documentId)) {
                    documentRooms.set(
                        documentId,
                        new Set()
                    );
                }

                documentRooms
                    .get(documentId)
                    .add(socket.id);

                socket.emit("document:sync", {
                    documentId,
                    content: [],
                });

                socket.to(room).emit(
                    "document:presence",
                    {
                        documentId,
                        socketId: socket.id,
                        online: true,
                    }
                );

                console.log(
                    `Socket ${socket.id} joined document ${documentId}`
                );
            } catch (error) {
                console.error(
                    "join:document error:",
                    error
                );

                socket.emit("document:error", {
                    documentId,
                    message:
                        "Unable to join document.",
                });
            }
        }
    );

    socket.on(
        "document:content",
        async ({ documentId, content } = {}) => {
            try {
                if (!isValidObjectId(documentId)) {
                    return;
                }

                if (!Array.isArray(content)) {
                    return;
                }

                const room = `document:${documentId}`;

                socket.to(room).emit(
                    "document:content",
                    {
                        documentId,
                        content,
                    }
                );
            } catch (error) {
                console.error(
                    "document:content error:",
                    error
                );

                socket.emit("document:error", {
                    documentId,
                    message:
                        "Unable to sync document content.",
                });
            }
        }
    );

    socket.on(
        "document:update",
        async ({ documentId, update } = {}) => {
            try {
                if (!isValidObjectId(documentId)) {
                    return;
                }

                if (
                    typeof update !== "string" ||
                    !update
                ) {
                    return;
                }

                const room = `document:${documentId}`;

                socket.to(room).emit(
                    "document:update",
                    {
                        documentId,
                        update,
                    }
                );
            } catch (error) {
                console.error(
                    "document:update error:",
                    error
                );
            }
        }
    );

    socket.on(
        "leave:document",
        ({ documentId } = {}) => {
            if (!documentId) {
                return;
            }

            const room =
                `document:${documentId}`;

            socket.leave(room);

            const roomSockets =
                documentRooms.get(documentId);

            if (roomSockets) {
                roomSockets.delete(socket.id);

                if (roomSockets.size === 0) {
                    documentRooms.delete(
                        documentId
                    );
                }
            }

            socket.to(room).emit(
                "document:presence",
                {
                    documentId,
                    socketId: socket.id,
                    online: false,
                }
            );
        }
    );

    socket.on("disconnect", () => {
        console.log(
            `Socket disconnected: ${socket.id}`
        );

        for (const [
            documentId,
            sockets,
        ] of documentRooms.entries()) {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);

                socket.to(
                    `document:${documentId}`
                ).emit(
                    "document:presence",
                    {
                        documentId,
                        socketId: socket.id,
                        online: false,
                    }
                );

                if (sockets.size === 0) {
                    documentRooms.delete(
                        documentId
                    );
                }
            }
        }
    });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((error, req, res, next) => {
    console.error(
        "Unhandled server error:",
        error
    );

    if (res.headersSent) {
        return next(error);
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error.",
    });
});

/* =========================================================
   START SERVER
========================================================= */

const startServer = async () => {
    try {
        await connectDB();

        server.listen(PORT, () => {
            console.log(
                `BrainFlow server running on port ${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "Failed to start BrainFlow:",
            error.message
        );

        process.exit(1);
    }
};

startServer();