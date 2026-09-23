import mongoose from "mongoose";
import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import crypto from "node:crypto";
import Invitation from "../models/Invitation.js";
import { sendEmail } from "../services/emailService.js";
// Create a new workspace
export const createWorkspace = async (req, res) => {
  try {
    const { name, description = "" } = req.body;
    const userId = req.user.userId;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Workspace name is required",
      });
    }

    if (name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Workspace name must be between 2 and 100 characters",
      });
    }

    if (
      typeof description !== "string" ||
      description.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be a string with at most 500 characters",
      });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      description: description.trim(),
      owner: userId,
      members: [
        {
          user: userId,
          role: "owner",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    console.error("Create workspace error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating workspace",
    });
  }
};

// Get all workspaces belonging to the logged-in user
export const getMyWorkspaces = async (req, res) => {
  try {
    const userId = req.user.userId;

    const workspaces = await Workspace.find({
      "members.user": userId,
    })
      .select("name description owner members createdAt updatedAt")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: workspaces.length,
      workspaces,
    });
  } catch (error) {
    console.error("Get my workspaces error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching workspaces",
    });
  }
};

// Get a single workspace by ID
export const getWorkspaceById = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": userId,
    }).populate("members.user", "name email");

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    return res.status(200).json({
      success: true,
      workspace,
    });
  } catch (error) {
    console.error("Get workspace error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching workspace",
    });
  }
};

// Update workspace details
export const updateWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": userId,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const requesterMembership = workspace.members.find(
      (member) => member.user.toString() === userId
    );

    if (
      !requesterMembership ||
      !["owner", "admin"].includes(requesterMembership.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this workspace",
      });
    }

    if (name === undefined && description === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide a name or description to update",
      });
    }

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Workspace name must be between 2 and 100 characters",
        });
      }

      workspace.name = name.trim();
    }

    if (description !== undefined) {
      if (
        typeof description !== "string" ||
        description.length > 500
      ) {
        return res.status(400).json({
          success: false,
          message: "Description must be a string with at most 500 characters",
        });
      }

      workspace.description = description.trim();
    }

    await workspace.save();

    return res.status(200).json({
      success: true,
      message: "Workspace updated successfully",
      workspace,
    });
  } catch (error) {
    console.error("Update workspace error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating workspace",
    });
  }
};

// Delete a workspace (owner only)
export const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      owner: userId,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found or you are not the owner",
      });
    }

    await Workspace.deleteOne({
      _id: workspaceId,
      owner: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    console.error("Delete workspace error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting workspace",
    });
  }
};

// Add a member to a workspace (owner/admin only)
export const addWorkspaceMember = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email } = req.body;
    const requesterId = req.user.userId;

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": requesterId,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const requesterMembership = workspace.members.find(
      (member) => member.user.toString() === requesterId
    );

    if (
      !requesterMembership ||
      !["owner", "admin"].includes(requesterMembership.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to add members",
      });
    }

    const userToAdd = await User.findOne({
      email: normalizedEmail,
    });

    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "No registered user found with this email",
      });
    }

    const alreadyMember = workspace.members.some(
      (member) => member.user.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: "User is already a member of this workspace",
      });
    }

    workspace.members.push({
      user: userToAdd._id,
      role: "member",
    });

    await workspace.save();

    return res.status(200).json({
      success: true,
      message: "Member added successfully",
      member: {
        userId: userToAdd._id,
        name: userToAdd.name,
        email: userToAdd.email,
        role: "member",
      },
    });
  } catch (error) {
    console.error("Add workspace member error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while adding workspace member",
    });
  }
};

// Get workspace members
export const getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": userId,
    })
      .select("name members")
      .populate("members.user", "name email");

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const members = workspace.members.map((member) => ({
      userId: member.user._id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      joinedAt: member.joinedAt,
    }));

    return res.status(200).json({
      success: true,
      workspace: {
        id: workspace._id,
        name: workspace.name,
      },
      count: members.length,
      members,
    });
  } catch (error) {
    console.error("Get workspace members error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching workspace members",
    });
  }
};

// Remove a workspace member (owner/admin only)
export const removeWorkspaceMember = async (req, res) => {
  try {
    const { workspaceId, memberId } = req.params;
    const requesterId = req.user.userId;

    if (
      !mongoose.isValidObjectId(workspaceId) ||
      !mongoose.isValidObjectId(memberId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace or member ID",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": requesterId,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const requesterMembership = workspace.members.find(
      (member) => member.user.toString() === requesterId
    );

    if (
      !requesterMembership ||
      !["owner", "admin"].includes(requesterMembership.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to remove members",
      });
    }

    if (memberId === requesterId) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove yourself using this endpoint",
      });
    }

    const targetMembership = workspace.members.find(
      (member) => member.user.toString() === memberId
    );

    if (!targetMembership) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this workspace",
      });
    }

    if (targetMembership.role === "owner") {
      return res.status(403).json({
        success: false,
        message: "The workspace owner cannot be removed",
      });
    }

    if (
      requesterMembership.role === "admin" &&
      targetMembership.role === "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the workspace owner can remove an admin",
      });
    }

    workspace.members = workspace.members.filter(
      (member) => member.user.toString() !== memberId
    );

    await workspace.save();

    return res.status(200).json({
      success: true,
      message: "Workspace member removed successfully",
      removedMemberId: memberId,
    });
  } catch (error) {
    console.error("Remove workspace member error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while removing workspace member",
    });
  }
};

// Update a workspace member's role (owner only)
export const updateWorkspaceMemberRole = async (req, res) => {
  try {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;
    const requesterId = req.user.userId;

    if (
      !mongoose.isValidObjectId(workspaceId) ||
      !mongoose.isValidObjectId(memberId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace or member ID",
      });
    }

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either 'admin' or 'member'",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": requesterId,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const requesterMembership = workspace.members.find(
      (member) => member.user.toString() === requesterId
    );

    if (!requesterMembership || requesterMembership.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only the workspace owner can change member roles",
      });
    }

    const targetMembership = workspace.members.find(
      (member) => member.user.toString() === memberId
    );

    if (!targetMembership) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this workspace",
      });
    }

    if (targetMembership.role === "owner") {
      return res.status(403).json({
        success: false,
        message: "The workspace owner's role cannot be changed here",
      });
    }

    targetMembership.role = role;

    await workspace.save();

    return res.status(200).json({
      success: true,
      message: "Workspace member role updated successfully",
      member: {
        userId: memberId,
        role: targetMembership.role,
      },
    });
  } catch (error) {
    console.error("Update workspace member role error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating workspace member role",
    });
  }
};
// Send a workspace invitation (owner/admin only)
export const sendWorkspaceInvitation = async (req, res) => {
  let invitation;

  try {
    const { workspaceId } = req.params;
    const { email } = req.body;
    const userId = req.user.userId;

    // Validate workspace ID
    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    // Validate and normalize email
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invitee email is required",
      });
    }

    const inviteeEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(inviteeEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Find workspace and verify requester membership
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": userId,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found or access denied",
      });
    }

    // Only owners and admins can invite users
    const requester = workspace.members.find(
      (member) => member.user.toString() === userId
    );

    if (!requester || !["owner", "admin"].includes(requester.role)) {
      return res.status(403).json({
        success: false,
        message: "Only workspace owners and admins can invite members",
      });
    }

    // Prevent inviting an existing member
    const existingUser = await User.findOne({ email: inviteeEmail });

    if (
      existingUser &&
      workspace.members.some(
        (member) => member.user.toString() === existingUser._id.toString()
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "This user is already a workspace member",
      });
    }

    // Check for an existing pending invitation
    const existingInvitation = await Invitation.findOne({
      workspace: workspaceId,
      inviteeEmail,
      status: "pending",
    });

    if (existingInvitation) {
      if (existingInvitation.expiresAt <= new Date()) {
        existingInvitation.status = "expired";
        await existingInvitation.save();
      } else {
        return res.status(409).json({
          success: false,
          message: "A pending invitation already exists for this email",
        });
      }
    }

    // Generate a secure token and store only its hash
    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    invitation = await Invitation.create({
      workspace: workspaceId,
      invitedBy: userId,
      inviteeEmail,
      tokenHash,
      expiresAt,
    });

    // Build the invitation link
    if (!process.env.CLIENT_URL) {
      throw new Error("CLIENT_URL is not configured");
    }

    const invitationUrl =
      `${process.env.CLIENT_URL.replace(/\/$/, "")}` +
      `/accept-invitation?token=${encodeURIComponent(rawToken)}` +
      `&workspaceId=${encodeURIComponent(workspaceId)}`;

    // Send the invitation email
    await sendEmail({
      to: inviteeEmail,
      subject: "You're invited to join a BrainFlow workspace",
      text: [
        "Hello,",
        "",
        `You have been invited to join the workspace "${workspace.name}" on BrainFlow.`,
        "",
        `Accept the invitation using this link: ${invitationUrl}`,
        "",
        "This invitation expires in 7 days.",
        "If you weren't expecting this invitation, you can ignore this email.",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>You're invited to BrainFlow</h2>
          <p>
            You have been invited to join the workspace
            <strong>${workspace.name}</strong>.
          </p>
          <p>
            <a href="${invitationUrl}"
               style="display:inline-block;padding:12px 20px;
                      background:#2563eb;color:#ffffff;
                      text-decoration:none;border-radius:6px;">
              Accept invitation
            </a>
          </p>
          <p>This invitation expires in 7 days.</p>
          <p>
            If you weren't expecting this invitation, you can ignore this email.
          </p>
        </div>
      `,
    });

    return res.status(201).json({
      success: true,
      message: "Invitation created and email sent successfully",
      invitation: {
        id: invitation._id,
        workspace: invitation.workspace,
        inviteeEmail: invitation.inviteeEmail,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Send workspace invitation error:", error.message);

    // Avoid leaving an unusable pending invitation if sending fails
    if (invitation) {
      try {
        await Invitation.deleteOne({ _id: invitation._id });
      } catch (cleanupError) {
        console.error(
          "Invitation cleanup error:",
          cleanupError.message
        );
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A pending invitation already exists for this email",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to send workspace invitation email",
    });
  }
};
export const updateWorkspaceInvitation = async (req, res) => {
  try {
    const { workspaceId, invitationId } = req.params;
    const userId = req.user.userId;

    // Validate IDs
    if (
      !mongoose.isValidObjectId(workspaceId) ||
      !mongoose.isValidObjectId(invitationId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace or invitation ID",
      });
    }

    // Find workspace and verify membership
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": userId,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found or access denied",
      });
    }

    // Check the requester's role
    const requester = workspace.members.find(
      (member) => member.user.toString() === userId
    );

    if (!requester || !["owner", "admin"].includes(requester.role)) {
      return res.status(403).json({
        success: false,
        message: "Only workspace owners and admins can cancel invitations",
      });
    }

    // Find invitation belonging to this workspace
    const invitation = await Invitation.findOne({
      _id: invitationId,
      workspace: workspaceId,
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    // Only pending invitations can be cancelled
    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This invitation cannot be cancelled because its status is ${invitation.status}`,
      });
    }

    invitation.status = "cancelled";
    invitation.respondedAt = new Date();

    await invitation.save();

    return res.status(200).json({
      success: true,
      message: "Invitation cancelled successfully",
      invitation: {
        id: invitation._id,
        workspace: invitation.workspace,
        inviteeEmail: invitation.inviteeEmail,
        status: invitation.status,
        respondedAt: invitation.respondedAt,
      },
    });
  } catch (error) {
    console.error("Cancel invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while cancelling invitation",
    });
  }
};
// Accept a workspace invitation (authenticated invitee only)
export const acceptWorkspaceInvitation = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { token } = req.body;
    const userId = req.user.userId;

    // Validate workspace ID
    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    // Validate token
    if (typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invitation token is required",
      });
    }

    // Hash the provided token before querying the database
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const invitation = await Invitation.findOne({
      workspace: workspaceId,
      tokenHash,
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invalid invitation token",
      });
    }

    // Check invitation status
    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This invitation is ${invitation.status}`,
      });
    }

    // Check expiry
    if (invitation.expiresAt <= new Date()) {
      invitation.status = "expired";
      await invitation.save();

      return res.status(400).json({
        success: false,
        message: "This invitation has expired",
      });
    }

    // Confirm the authenticated user's email
    const user = await User.findById(userId).select("name email");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    if (user.email.toLowerCase() !== invitation.inviteeEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "This invitation was sent to a different email address",
      });
    }

    // Find the workspace
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace no longer exists",
      });
    }

    // Prevent duplicate membership
    const alreadyMember = workspace.members.some(
      (member) => member.user.toString() === userId
    );

    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: "You are already a member of this workspace",
      });
    }

    // Add invitee with the default member role
    workspace.members.push({
      user: userId,
      role: "member",
    });

    await workspace.save();

    // Mark the invitation as accepted
    invitation.status = "accepted";
    invitation.respondedAt = new Date();

    await invitation.save();

    return res.status(200).json({
      success: true,
      message: "Invitation accepted successfully",
      workspace: {
        id: workspace._id,
        name: workspace.name,
      },
      membership: {
        userId,
        role: "member",
      },
    });
  } catch (error) {
    console.error("Accept workspace invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while accepting invitation",
    });
  }
};
// Decline a workspace invitation (authenticated invitee only)
export const declineWorkspaceInvitation = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { token } = req.body;
    const userId = req.user.userId;

    // Validate workspace ID
    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    // Validate token
    if (typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invitation token is required",
      });
    }

    // Hash the token before querying the database
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const invitation = await Invitation.findOne({
      workspace: workspaceId,
      tokenHash,
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invalid invitation token",
      });
    }

    // Only pending invitations can be declined
    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This invitation is ${invitation.status}`,
      });
    }

    // Mark an expired invitation as expired
    if (invitation.expiresAt <= new Date()) {
      invitation.status = "expired";
      await invitation.save();

      return res.status(400).json({
        success: false,
        message: "This invitation has expired",
      });
    }

    // Confirm the authenticated user exists
    const user = await User.findById(userId).select("email");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    // Only the intended recipient can decline
    if (
      user.email.toLowerCase() !==
      invitation.inviteeEmail.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "This invitation was sent to a different email address",
      });
    }

    invitation.status = "declined";
    invitation.respondedAt = new Date();

    await invitation.save();

    return res.status(200).json({
      success: true,
      message: "Invitation declined successfully",
    });
  } catch (error) {
    console.error("Decline workspace invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while declining invitation",
    });
  }
};