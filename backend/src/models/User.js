import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxLength: 80,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            select: false,
        },

        avatar: {
            type: String,
            default: "",
        },

        resetOtpHash: String,

        resetOtpExpiresAt: Date,

        resetOtpAttempts: {
            type: Number,
            default: 0,
        },

        resetOtpSentAt: Date,

        resetSessionHash: String,
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("User", userSchema);