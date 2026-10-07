import Workspace from "../models/Workspace.js";
import Membership from "../models/Membership.js";
import Document from "../models/Document.js";
import User from "../models/User.js";

import { getWorkspaceMembership } from "../utils/workspaceAccess.js";

import {
    logActivity,
    notify,
} from "../utils/activity.js";


/* =========================
   LIST WORKSPACES
========================= */

export const listWorkspaces = async (req, res) => {
    try {
        const memberships = await Membership.find({
            user: req.user.userId,
        }).populate("workspace");

        return res.json({
            success: true,
            workspaces: memberships.map((membership) => ({
                ...membership.workspace.toObject(),
                role: membership.role,
            })),
        });
    } catch (error) {
        console.error("LIST WORKSPACES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load workspaces.",
        });
    }
};


/* =========================
   CREATE WORKSPACE
========================= */

export const createWorkspace = async (req, res) => {
    try {
        const { name } = req.body || {};

        if (!name?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Workspace name is required.",
            });
        }

        const slug =
            `${name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;

        const workspace = await Workspace.create({
            name: name.trim(),
            slug,
            owner: req.user.userId,
        });

        await Membership.create({
            workspace: workspace._id,
            user: req.user.userId,
            role: "owner",
        });

        return res.status(201).json({
            success: true,
            workspace,
        });
    } catch (error) {
        console.error("CREATE WORKSPACE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create workspace.",
        });
    }
};


/* =========================
   GET WORKSPACE
========================= */

export const getWorkspace = async (req, res) => {
    try {
        const access = await getWorkspaceMembership(
            req.params.workspaceId,
            req.user.userId
        );

        if (!access) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found.",
            });
        }

        const documents = await Document.find({
            workspace: access.workspace._id,
        })
            .select("title createdBy updatedAt")
            .sort({ updatedAt: -1 });

        const members = await Membership.find({
            workspace: access.workspace._id,
        })
            .populate(
                "user",
                "name email avatar"
            );

        return res.json({
            success: true,
            workspace: access.workspace,
            membership: access.membership,
            documents,
            members,
        });
    } catch (error) {
        console.error("GET WORKSPACE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load workspace.",
        });
    }
};


/* =========================
   CREATE DOCUMENT
========================= */

export const createDocument = async (req, res) => {
    try {
        const access = await getWorkspaceMembership(
            req.body?.workspaceId,
            req.user.userId
        );

        if (!access) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found.",
            });
        }

        const document = await Document.create({
            workspace: access.workspace._id,
            createdBy: req.user.userId,
            title:
                req.body?.title?.trim() ||
                "Untitled document",
            content: [
                {
                    type: "paragraph",
                    children: [
                        {
                            text: "",
                        },
                    ],
                },
            ],
        });

        await logActivity({
            workspace: access.workspace._id,
            user: req.user.userId,
            action: "created",
            entityType: "document",
            entityId: String(document._id),
        });

        return res.status(201).json({
            success: true,
            document,
        });
    } catch (error) {
        console.error("CREATE DOCUMENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create document.",
        });
    }
};


/* =========================
   INVITE MEMBER
========================= */

export const inviteMember = async (req, res) => {
    try {
        const access = await getWorkspaceMembership(
            req.params.workspaceId,
            req.user.userId
        );

        if (
            !access ||
            !["owner", "admin"].includes(
                access.membership.role
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only owners and admins can invite members.",
            });
        }

        const email =
            req.body?.email
                ?.trim()
                .toLowerCase();

        const requestedRole =
            req.body?.role || "editor";

        const allowedRoles = [
            "admin",
            "editor",
            "viewer",
        ];

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        if (!allowedRoles.includes(requestedRole)) {
            return res.status(400).json({
                success: false,
                message: "Invalid member role.",
            });
        }

        /*
         * Admins cannot create another admin.
         * Only the owner can assign admin.
         */
        if (
            requestedRole === "admin" &&
            access.membership.role !== "owner"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only the workspace owner can assign admin role.",
            });
        }

        const user = await User.findOne({
            email,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    "User must register before being added.",
            });
        }

        const existingMembership =
            await Membership.findOne({
                workspace: access.workspace._id,
                user: user._id,
            });

        if (existingMembership) {
            return res.status(409).json({
                success: false,
                message:
                    "User is already a member.",
            });
        }

        const membership =
            await Membership.create({
                workspace: access.workspace._id,
                user: user._id,
                role: requestedRole,
            });

        await notify(
            req.app.get("io"),
            user._id,
            {
                type: "workspace",
                title: "Workspace invitation",
                message:
                    `You were added to ${access.workspace.name}.`,
                metadata: {
                    workspaceId:
                        String(
                            access.workspace._id
                        ),
                },
            }
        );

        return res.status(201).json({
            success: true,
            message: "Member added successfully.",
            membership,
        });
    } catch (error) {
        console.error("INVITE MEMBER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add member.",
        });
    }
};


/* =========================
   UPDATE MEMBER ROLE
========================= */

export const updateMemberRole = async (
    req,
    res
) => {
    try {
        const access =
            await getWorkspaceMembership(
                req.params.workspaceId,
                req.user.userId
            );

        if (!access) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found.",
            });
        }

        /*
         * Only owner/admin can manage members.
         */
        if (
            !["owner", "admin"].includes(
                access.membership.role
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have permission to change member roles.",
            });
        }

        const newRole =
            req.body?.role;

        if (
            !["admin", "editor", "viewer"].includes(
                newRole
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid member role.",
            });
        }

        const targetMembership =
            await Membership.findOne({
                _id: req.params.memberId,
                workspace:
                    access.workspace._id,
            });

        if (!targetMembership) {
            return res.status(404).json({
                success: false,
                message: "Member not found.",
            });
        }

        /*
         * Owner membership can never be changed.
         */
        if (
            targetMembership.role === "owner"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "The workspace owner role cannot be changed.",
            });
        }

        /*
         * Admin cannot promote anyone to admin.
         */
        if (
            newRole === "admin" &&
            access.membership.role !== "owner"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only the owner can assign admin role.",
            });
        }

        /*
         * Admin cannot modify another admin.
         */
        if (
            access.membership.role === "admin" &&
            targetMembership.role === "admin"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Admins cannot modify another admin.",
            });
        }

        targetMembership.role =
            newRole;

        await targetMembership.save();

        return res.json({
            success: true,
            message:
                "Member role updated successfully.",
            membership:
                targetMembership,
        });
    } catch (error) {
        console.error(
            "UPDATE MEMBER ROLE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update member role.",
        });
    }
};


/* =========================
   REMOVE MEMBER
========================= */

export const removeMember = async (
    req,
    res
) => {
    try {
        const access =
            await getWorkspaceMembership(
                req.params.workspaceId,
                req.user.userId
            );

        if (!access) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found.",
            });
        }

        /*
         * Only owner/admin can remove members.
         */
        if (
            !["owner", "admin"].includes(
                access.membership.role
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have permission to remove members.",
            });
        }

        const targetMembership =
            await Membership.findOne({
                _id: req.params.memberId,
                workspace:
                    access.workspace._id,
            });

        if (!targetMembership) {
            return res.status(404).json({
                success: false,
                message: "Member not found.",
            });
        }

        /*
         * Owner cannot be removed.
         */
        if (
            targetMembership.role === "owner"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "The workspace owner cannot be removed.",
            });
        }

        /*
         * Admin cannot remove another admin.
         */
        if (
            access.membership.role === "admin" &&
            targetMembership.role === "admin"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Admins cannot remove another admin.",
            });
        }

        await Membership.deleteOne({
            _id: targetMembership._id,
        });

        /*
         * Notify removed user.
         */
        await notify(
            req.app.get("io"),
            targetMembership.user,
            {
                type: "workspace",
                title: "Removed from workspace",
                message:
                    `You were removed from ${access.workspace.name}.`,
                metadata: {
                    workspaceId:
                        String(
                            access.workspace._id
                        ),
                },
            }
        );

        return res.json({
            success: true,
            message:
                "Member removed successfully.",
        });
    } catch (error) {
        console.error(
            "REMOVE MEMBER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to remove member.",
        });
    }
};