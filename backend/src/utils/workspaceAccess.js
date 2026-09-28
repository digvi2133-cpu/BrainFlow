import mongoose from "mongoose";
import Workspace from "../models/Workspace.js";
import Document from "../models/Document.js";

export const getWorkspaceMembership = async (workspaceId, userId) => {
    if (
        !mongoose.isValidObjectId(workspaceId) ||
        !mongoose.isValidObjectId(userId)
    ) {
        return null;
    }

    const workspace = await Workspace.findOne({
        _id: workspaceId,
        "members.user": userId,
    }).select("name owner members");

    if (!workspace) {
        return null;
    }

    const membership = workspace.members.find(
        (member) => member.user.toString() === userId.toString()
    );

    if (!membership) {
        return null;
    }

    return {
        workspace,
        membership,
    };
};

export const getDocumentAccess = async (documentId, userId) => {
    if (
        !mongoose.isValidObjectId(documentId) ||
        !mongoose.isValidObjectId(userId)
    ) {
        return null;
    }

    const document = await Document.findById(documentId).select(
        "workspace createdBy title"
    );

    if (!document) {
        return null;
    }

    const workspaceResult = await getWorkspaceMembership(
        document.workspace,
        userId
    );

    if (!workspaceResult) {
        return null;
    }

    return {
        document,
        workspace: workspaceResult.workspace,
        membership: workspaceResult.membership,
    };
};