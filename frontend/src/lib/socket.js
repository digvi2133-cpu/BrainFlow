import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    "http://localhost:5000";

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    transports: ["polling"],
    timeout: 10000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

socket.on("connect", () => {
    console.log("SOCKET CONNECTED:", socket.id);
});

socket.on("connect_error", (error) => {
    console.error(
        "SOCKET CONNECT_ERROR:",
        error.message
    );

    console.error(
        "SOCKET CONNECT_ERROR details:",
        error
    );
});

socket.on("disconnect", (reason) => {
    console.warn(
        "SOCKET DISCONNECTED:",
        reason
    );
});

export const connectSocket = () => {
    const token = localStorage.getItem("brainflow_token");

    console.log("Socket URL:", SOCKET_URL);
    console.log(
        "BrainFlow token exists:",
        Boolean(token)
    );

    if (token) {
        socket.auth = {
            token,
        };
    } else {
        socket.auth = {};
    }

    if (!socket.connected) {
        console.log("Attempting Socket.IO connection...");
        socket.connect();
    }
};

export const leaveDocument = (documentId) => {
    if (!socket.connected || !documentId) {
        return;
    }

    socket.emit("leave:document", {
        documentId,
    });
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};