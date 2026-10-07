import { Router } from "express";

import { protect } from "../middleware/auth.js";

import {
    listWorkspaces,
    createWorkspace,
    getWorkspace,
    createDocument,
    inviteMember,
    updateMemberRole,
    removeMember,
} from "../controllers/workspaceController.js";

const router = Router();

router.use(protect);

/* =========================
   WORKSPACES
========================= */

router.get("/", listWorkspaces);

router.post("/", createWorkspace);

router.get("/:workspaceId", getWorkspace);

/* =========================
   DOCUMENTS
========================= */

router.post("/documents", createDocument);

/* =========================
   MEMBERS
========================= */

router.post(
    "/:workspaceId/invite",
    inviteMember
);

router.patch(
    "/:workspaceId/members/:memberId",
    updateMemberRole
);

router.delete(
    "/:workspaceId/members/:memberId",
    removeMember
);

export default router;