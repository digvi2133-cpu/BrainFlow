import mongoose from "mongoose";

const workspaceMemberSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        role: {
            type: String,
            enum: ["owner", "admin", "member"],
            default: "member",
        },

        joinedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const workspaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Workspace name is required"],
            trim: true,
            minlength: 2,
            maxlength: 100,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        members: {
            type: [workspaceMemberSchema],
            validate: {
                validator: function (members) {
                    const userIds = members.map((member) =>
                        member.user.toString()
                    );
``
                    return userIds.length === new Set(userIds).size;
                },
                message: "A user cannot be added to the same workspace twice.",
            },
        },
    },
    {
        timestamps: true,
    }
);

// Efficiently find workspaces owned by a user
workspaceSchema.index({ owner: 1 });

// Efficiently find workspaces that include a user
workspaceSchema.index({ "members.user": 1 });

const Workspace = mongoose.model("Workspace", workspaceSchema);

export default Workspace;