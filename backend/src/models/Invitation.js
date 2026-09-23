import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    inviteeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    // Store only a hash of the secret invitation token
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired","cancelled"],
      default: "pending",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple pending invitations for the same email in one workspace
invitationSchema.index(
  { workspace: 1, inviteeEmail: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "pending",
    },
  }
);

// Useful for querying invitations by workspace and status
invitationSchema.index({ workspace: 1, status: 1 });

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;