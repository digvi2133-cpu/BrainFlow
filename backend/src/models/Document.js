import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: [true, "Document title is required"],
            trim: true,
            minlength: 1,
            maxlength: 200,
            default: "Untitled Document",
        },

        content: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Efficiently find documents inside a workspace.
documentSchema.index({ workspace: 1, updatedAt: -1 });

// Efficiently find documents created by a user.
documentSchema.index({ createdBy: 1 });

// Useful when listing a workspace's documents chronologically.
documentSchema.index({ workspace: 1, updatedAt: -1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;