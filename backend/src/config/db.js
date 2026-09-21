import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing from environment variables");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        // Ping MongoDB to verify the connection
        await mongoose.connection.db.admin().command({ ping: 1 });

        console.log("Pinged your deployment. Successfully connected to MongoDB!");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};

export default connectDB;