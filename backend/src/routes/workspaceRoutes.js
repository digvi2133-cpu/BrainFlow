import express from "express";

import {
createWorkspace,
getMyWorkspaces,
getWorkspaceById,
updateWorkspace,
deleteWorkspace,
addWorkspaceMember,
getWorkspaceMembers,
removeWorkspaceMember,
updateWorkspaceMemberRole,
sendWorkspaceInvitation,
updateWorkspaceInvitation,
acceptWorkspaceInvitation,
declineWorkspaceInvitation,
} from "../controllers/workspaceController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Workspace routes
router.post("/", protect, createWorkspace);
router.get("/", protect, getMyWorkspaces);
router.get("/:workspaceId", protect, getWorkspaceById);
router.patch("/:workspaceId", protect, updateWorkspace);
router.delete("/:workspaceId", protect, deleteWorkspace);

// Workspace member routes
router.post("/:workspaceId/members", protect, addWorkspaceMember);
router.get("/:workspaceId/members", protect, getWorkspaceMembers);

router.delete(
"/:workspaceId/members/:memberId",
protect,
removeWorkspaceMember
);

router.patch(
"/:workspaceId/members/:memberId/role",
protect,
updateWorkspaceMemberRole
);

// Workspace invitation routes
router.post(
"/:workspaceId/invitations",
protect,
sendWorkspaceInvitation
);

router.patch(
"/:workspaceId/invitations/:invitationId",
protect,
updateWorkspaceInvitation
);
router.post(
  "/:workspaceId/invitations/accept",
  protect,
  acceptWorkspaceInvitation
);
router.post(
  "/:workspaceId/invitations/decline",
  protect,
  declineWorkspaceInvitation
);
export default router;
