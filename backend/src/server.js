import "dotenv/config";

import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import * as Y from "yjs";

import Document from "./models/Document.js";
import Membership from "./models/Membership.js";

import {connectDB} from "./config/db.js";

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

/* -------------------------------------------------------
   DATABASE
------------------------------------------------------- */

await connectDB();

/* -------------------------------------------------------
   MIDDLEWARE
------------------------------------------------------- */

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

/* -------------------------------------------------------
   HEALTH CHECK
------------------------------------------------------- */

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "BrainFlow backend is running.",
        environment: process.env.NODE_ENV || "development",
        socket: true,
    });
});

/* -------------------------------------------------------
   ROOT
------------------------------------------------------- */

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "BrainFlow API",
    });
});

/* -------------------------------------------------------
   API ROUTES
------------------------------------------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);

/* -------------------------------------------------------
   SOCKET.IO
------------------------------------------------------- */

const io = new SocketIOServer(server, {
    path: "/socket.io/",

    cors: {
        origin: CLIENT_URL,
        credentials: true,
    },

    transports: ["polling", "websocket"],

    allowEIO3: false,

    pingInterval: 25000,
    pingTimeout: 20000,
});

/* -------------------------------------------------------
   SOCKET AUTHENTICATION
------------------------------------------------------- */

io.use((socket, next) => {
    try {
        const cookieHeader =
            socket.handshake.headers.cookie || "";

        const cookieName =
            process.env.COOKIE_NAME || "brainflow_auth";

        let cookieToken = null;

        if (cookieHeader) {
            const cookies = cookieHeader
                .split(";")
                .map((cookie) => cookie.trim());

            const authCookie = cookies.find((cookie) =>
                cookie.startsWith(`${cookieName}=`)
            );

            if (authCookie) {
                cookieToken = authCookie.slice(
                    cookieName.length + 1
                );
            }
        }

        const authToken =
            socket.handshake.auth?.token ||
            cookieToken;

        if (!authToken) {
            console.error(
                "Socket authentication failed: no token."
            );

            return next(
                new Error("Authentication required.")
            );
        }

        const decoded = jwt.verify(
            authToken,
            process.env.JWT_SECRET
        );

        if (!decoded?.userId) {
            console.error(
                "Socket authentication failed: invalid user."
            );

            return next(
                new Error("Authentication failed.")
            );
        }

        socket.user = {
            userId: decoded.userId,
        };

        console.log(
            "Socket authenticated:",
            decoded.userId
        );

        next();
    } catch (error) {
        console.error(
            "Socket authentication failed:",
            error.message
        );

        next(
            new Error("Authentication failed.")
        );
    }
});

/* -------------------------------------------------------
   SOCKET STATE
------------------------------------------------------- */

/*
   documentRooms structure:

   Map<
       documentId,
       Set<socketId>
   >
*/

const documentRooms = new Map();

/*
   socketDocuments structure:

   Map<
       socketId,
       Set<documentId>
   >
*/

const socketDocuments = new Map();

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

const getDocumentRoom = (documentId) =>
    `document:${documentId}`;

const addSocketToDocument = (
    socketId,
    documentId
) => {
    if (!documentRooms.has(documentId)) {
        documentRooms.set(
            documentId,
            new Set()
        );
    }

    documentRooms
        .get(documentId)
        .add(socketId);

    if (!socketDocuments.has(socketId)) {
        socketDocuments.set(
            socketId,
            new Set()
        );
    }

    socketDocuments
        .get(socketId)
        .add(documentId);
};

const removeSocketFromDocument = (
    socketId,
    documentId
) => {
    const roomSockets =
        documentRooms.get(documentId);

    if (roomSockets) {
        roomSockets.delete(socketId);

        if (roomSockets.size === 0) {
            documentRooms.delete(documentId);
        }
    }

    const documents =
        socketDocuments.get(socketId);

    if (documents) {
        documents.delete(documentId);

        if (documents.size === 0) {
            socketDocuments.delete(socketId);
        }
    }
};

const isSocketInDocument = (
    socketId,
    documentId
) => {
    const sockets =
        documentRooms.get(documentId);

    return sockets?.has(socketId) || false;
};

/* -------------------------------------------------------
   SOCKET CONNECTION
------------------------------------------------------- */

io.on("connection", (socket) => {
    console.log(
        `Socket connected: ${socket.id}`
    );

    console.log(
        `Socket user: ${socket.user.userId}`
    );

    /* ---------------------------------------------------
       JOIN DOCUMENT
    --------------------------------------------------- */

    socket.on(
        "join:document",
        async ({ documentId }) => {
            try {
                if (!documentId) {
                    socket.emit(
                        "document:error",
                        {
                            message:
                                "Document ID is required.",
                        }
                    );

                    return;
                }

                const userId =
                    socket.user?.userId;

                if (!userId) {
                    socket.emit(
                        "document:error",
                        {
                            message:
                                "Authentication required.",
                        }
                    );

                    return;
                }

                const document =
                    await Document.findById(
                        documentId
                    );

                if (!document) {
                    socket.emit(
                        "document:error",
                        {
                            message:
                                "Document not found.",
                        }
                    );

                    return;
                }

                /*
                   Check whether the user has
                   access to this document's workspace.
                */

                const membership =
                    await Membership.findOne({
                        workspace:
                            document.workspace,
                        user: userId,
                    });

                if (!membership) {
                    socket.emit(
                        "document:error",
                        {
                            message:
                                "You do not have access to this document.",
                        }
                    );

                    return;
                }

                const room =
                    getDocumentRoom(
                        documentId
                    );

                socket.join(room);

                addSocketToDocument(
                    socket.id,
                    documentId
                );

                console.log(
                    `Socket ${socket.id} joined ${room}`
                );

                /*
                   Convert stored Slate/Yjs-compatible
                   document content into a string if needed.

                   For now the frontend receives the
                   existing document content.
                */

                socket.emit(
                    "document:sync",
                    {
                        documentId,
                        content:
                            document.content || [],
                    }
                );

                /*
                   Notify other users that someone
                   joined the document.
                */

                socket.to(room).emit(
                    "presence:update",
                    {
                        type: "join",
                        userId,
                        socketId: socket.id,
                    }
                );

                console.log(
                    `User ${userId} joined document ${documentId}`
                );
            } catch (error) {
                console.error(
                    "join:document error:",
                    error
                );

                socket.emit(
                    "document:error",
                    {
                        message:
                            "Unable to join document.",
                    }
                );
            }
        }
    );

socket.on(
    "document:content",
    async ({ documentId, content }) => {
        try {
            console.log("\n========== DOCUMENT CONTENT ==========");
            console.log("Document ID:", documentId);
            console.log("Socket ID:", socket.id);
            console.log("User ID:", socket.user?.userId);

            if (!documentId) {
                console.error("Missing documentId");
                return;
            }

            const userId = socket.user?.userId;

            if (!userId) {
                console.error(
                    "Missing authenticated user"
                );
                return;
            }

            /*
             * SECURITY:
             * The socket must have successfully joined
             * this document before it can modify it.
             */
            if (
                !isSocketInDocument(
                    socket.id,
                    documentId
                )
            ) {
                socket.emit("document:error", {
                    message:
                        "You are not connected to this document.",
                });

                return;
            }

            /*
             * Validate Slate content.
             */
            if (!Array.isArray(content)) {
                socket.emit("document:error", {
                    message:
                        "Invalid document content.",
                });

                return;
            }

            /*
             * Find the document only for authorization.
             */
            const document =
                await Document.findById(documentId)
                    .select("workspace");

            if (!document) {
                socket.emit("document:error", {
                    message:
                        "Document not found.",
                });

                return;
            }

            /*
             * SECURITY:
             * Verify workspace membership.
             */
            const membership =
                await Membership.findOne({
                    workspace:
                        document.workspace,
                    user: userId,
                }).select("_id");

            if (!membership) {
                socket.emit("document:error", {
                    message:
                        "You do not have access to this document.",
                });

                return;
            }

            /*
             * ATOMIC UPDATE
             *
             * Do NOT use:
             *
             * document.content = content;
             * await document.save();
             *
             * because multiple keystrokes can arrive
             * concurrently and cause Mongoose VersionErrors.
             */
            await Document.findByIdAndUpdate(
                documentId,
                {
                    $set: {
                        content,
                    },
                },
                {
                    new: false,
                    runValidators: true,
                }
            );

            console.log(
                `Document ${documentId} updated by user ${userId}`
            );

            /*
             * Broadcast the latest content
             * to everyone else in the room.
             */
            const room =
                getDocumentRoom(documentId);

            socket.to(room).emit(
                "document:content",
                {
                    documentId,
                    content,
                    userId,
                }
            );

            console.log(
                "Document update broadcasted"
            );

            console.log(
                "====================================\n"
            );
        } catch (error) {
            console.error(
                "document:content error:",
                error
            );

            socket.emit("document:error", {
                message:
                    "Unable to update document.",
            });
        }
    }
);
    /* ---------------------------------------------------
       DOCUMENT UPDATE
    --------------------------------------------------- */

    socket.on(
        "document:update",
        async ({
            documentId,
            update,
        }) => {
            try {
                if (!documentId) {
                    return;
                }

                const userId =
                    socket.user?.userId;

                if (!userId) {
                    return;
                }

                if (
                    !isSocketInDocument(
                        socket.id,
                        documentId
                    )
                ) {
                    socket.emit(
                        "document:error",
                        {
                            message:
                                "You are not connected to this document.",
                        }
                    );

                    return;
                }

                const room =
                    getDocumentRoom(
                        documentId
                    );

                socket.to(room).emit(
                    "document:update",
                    {
                        documentId,
                        update,
                        userId,
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

    /* ---------------------------------------------------
       LEAVE DOCUMENT
    --------------------------------------------------- */

    socket.on(
        "leave:document",
        ({ documentId }) => {
            try {
                if (!documentId) {
                    return;
                }

                const room =
                    getDocumentRoom(
                        documentId
                    );

                socket.leave(room);

                removeSocketFromDocument(
                    socket.id,
                    documentId
                );

                socket.to(room).emit(
                    "presence:update",
                    {
                        type: "leave",
                        userId:
                            socket.user?.userId,
                        socketId: socket.id,
                    }
                );

                console.log(
                    `Socket ${socket.id} left ${room}`
                );
            } catch (error) {
                console.error(
                    "leave:document error:",
                    error
                );
            }
        }
    );

    /* ---------------------------------------------------
       DISCONNECT
    --------------------------------------------------- */

    socket.on(
        "disconnect",
        (reason) => {
            console.log(
                `Socket disconnected: ${socket.id}`
            );

            console.log(
                `Disconnect reason: ${reason}`
            );

            const documents =
                socketDocuments.get(
                    socket.id
                );

            if (documents) {
                for (const documentId of documents) {
                    const room =
                        getDocumentRoom(
                            documentId
                        );

                    socket.to(room).emit(
                        "presence:update",
                        {
                            type: "leave",
                            userId:
                                socket.user?.userId,
                            socketId:
                                socket.id,
                        }
                    );

                    removeSocketFromDocument(
                        socket.id,
                        documentId
                    );
                }
            }

            socketDocuments.delete(
                socket.id
            );
        }
    );
});

/* -------------------------------------------------------
   SOCKET ERROR LOGGING
------------------------------------------------------- */

io.engine.on(
    "connection_error",
    (error) => {
        console.error(
            "Socket.IO connection error:",
            error.message
        );

        console.error(
            "Socket.IO error context:",
            error.context
        );
    }
);

/* -------------------------------------------------------
   START SERVER
------------------------------------------------------- */

server.listen(
    PORT,
    () => {
        console.log(
            `BrainFlow server running on port ${PORT}`
        );

        console.log(
            `BrainFlow client URL: ${CLIENT_URL}`
        );

        console.log(
            "Socket.IO path: /socket.io/"
        );
    }
);