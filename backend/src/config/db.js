import dns from "node:dns";
import mongoose from "mongoose";

dns.setServers([
    "8.8.8.8",
    "1.1.1.1",
]);
export const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error("MONGO_URI is missing.");
    }

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
        });

        console.log("MongoDB connected successfully.");
        console.log(`MongoDB database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error.message
        );

        throw error;
    }
};