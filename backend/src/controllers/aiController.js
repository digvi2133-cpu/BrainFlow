import mongoose from "mongoose";
import Document from "../models/Document.js";
import AiUsage from "../models/AiUsage.js";
import { getDocumentAccess } from "../utils/workspaceAccess.js";
import { generateAI } from "../services/openaiService.js";

const actions = new Set([
    "chat",
    "summarize",
    "rewrite",
    "expand",
    "shorten",
    "professional",
    "casual",
    "explain",
    "improve",
    "brainstorm",
]);

const flatten = (nodes = []) =>
    nodes
        .map((n) =>
            typeof n?.text === "string"
                ? n.text
                : Array.isArray(n?.children)
                    ? flatten(n.children)
                    : ""
        )
        .join("\n");

export const chatWithDocumentAI = async (req, res) => {
    try {
        const userId = req.user.userId;

        const {
            documentId,
            message,
            selectedText = "",
            action = "chat",
        } = req.body || {};

        // --------------------------------------------------
        // BASIC VALIDATION
        // --------------------------------------------------

        if (!message?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required.",
            });
        }

        const a = String(action).toLowerCase();

        if (!actions.has(a)) {
            return res.status(400).json({
                success: false,
                message: "Unsupported AI action.",
            });
        }

        // --------------------------------------------------
        // DASHBOARD / WORKSPACE CHAT
        // No documentId required
        // --------------------------------------------------

        if (!documentId) {
            const started = Date.now();

            const result = await generateAI({
                message: message.trim(),
                action: a,
                documentTitle: "",
                documentText: "",
                selectedText: "",
            });

            const durationMs = Date.now() - started;

            return res.json({
                success: true,
                response: {
                    text: result.text,
                    action: a,
                },
                usage: {
                    ...result.usage,
                    model: result.model,
                    durationMs,
                },
            });
        }

        // --------------------------------------------------
        // EXISTING DOCUMENT AI
        // DO NOT CHANGE THIS FLOW
        // --------------------------------------------------

        if (!mongoose.isValidObjectId(documentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID.",
            });
        }

        const access = await getDocumentAccess(
            documentId,
            userId
        );

        if (!access) {
            return res.status(404).json({
                success: false,
                message: "Document not found.",
            });
        }

        const started = Date.now();

        const result = await generateAI({
            message: message.trim(),
            action: a,
            documentTitle: access.document.title,
            documentText: flatten(
                access.document.content
            ).slice(0, 50000),
            selectedText: String(
                selectedText || ""
            ).slice(0, 12000),
        });

        const durationMs = Date.now() - started;

        await AiUsage.create({
            user: userId,
            workspace: access.workspace._id,
            document: access.document._id,
            action: a,
            model: result.model,
            ...result.usage,
            durationMs,
        });

        return res.json({
            success: true,
            response: {
                text: result.text,
                action: a,
            },
            usage: {
                ...result.usage,
                model: result.model,
                durationMs,
            },
        });
    } catch (e) {
        console.error("AI:", e);

        const missing =
            e.message === "OPENAI_API_KEY is missing.";

        return res.status(
            missing ? 503 : 500
        ).json({
            success: false,
            message: missing
                ? "BrainFlow AI is not configured on the server."
                : "Unable to generate an AI response right now.",
        });
    }
};