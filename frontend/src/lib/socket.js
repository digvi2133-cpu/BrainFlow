import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    "http://localhost:5000";

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket", "polling"],
});


export const connectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }

    return socket;
};


export const leaveDocument = (documentId) => {
    if (!documentId) {
        return;
    }

    if (!socket.connected) {
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