import express from "express";
import http from "http";
import connectDB from "./config/db.js";
import cors from "cors";
import {Server} from "socket.io";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const httpServer = http.createServer(app);
app.use(
    cors({
        origin:process.env.CLIENT_URL || "http://localhost:5173",
        credentials:true,
    })
);
app.use(express.json({limit:"1mb"}));
const io = new Server(httpServer,{
    cors:{
        origin:process.env.CLIENT_URL || "http://localhost:5173",
        methods:["GET","POST"],
        credentials:true,
    },
});
app.get("/api/health",(req,res)=>{
    res.status(200).json({
        success:true,
        message:"BrainFlow API is running",
    });
});
app.use((req,res)=>{
    res.status(404).json({
        success:false,
        message:`Route not found: ${req.originalUrl}`,
    });
});
io.on("connection",(socket)=>{
    console.log(`Socket connected:${socket.id}`);
    socket.on("disconnect",()=>{
        console.log(`Socket disconnected: ${socket.id}`);
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