import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            default: "Untitled document",
            trim: true,
        },

        /*
         * Slate editor content.
         *
         * Slate stores its document as an array of
         * nested objects, for example:
         *
         * [
         *   {
         *     type: "paragraph",
         *     children: [
         *       { text: "Hello" }
         *     ]
         *   }
         * ]
         */
        content: {
            type: mongoose.Schema.Types.Mixed,
            default: () => [],
        },

        /*
         * Reserved for future Yjs collaboration state.
         */
        yState: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

documentSchema.index({
    workspace: 1,
    updatedAt: -1,
});

const Document =
    mongoose.models.Document ||
    mongoose.model("Document", documentSchema);

export default Document;