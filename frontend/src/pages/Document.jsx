import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Check,
    ChevronDown,
    Copy,
    FileText,
    Loader2,
    Maximize2,
    Minimize2,
    MoreHorizontal,
    MousePointer2,
    PanelRight,
    Redo2,
    Save,
    Send,
    Sparkles,
    Undo2,
    Wifi,
    WifiOff,
    X,
    Zap,
} from "lucide-react";

import {
    createEditor,
    Editor,
    Range,
    Transforms,
} from "slate";

import {
    Editable,
    Slate,
    withReact,
} from "slate-react";

import { withHistory } from "slate-history";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import Layout from "../components/Layout";
import DocumentHero3D from "../components/DocumentHero3D";
import { apiRequest } from "../lib/api";
import {
    connectSocket,
    leaveDocument,
    socket,
} from "../lib/socket";


const EMPTY_CONTENT = [
    {
        type: "paragraph",
        children: [{ text: "" }],
    },
];


const AI_ACTIONS = [
    {
        id: "summarize",
        label: "Summarize",
        description: "Turn the selected text into a concise summary.",
    },
    {
        id: "expand",
        label: "Expand",
        description: "Add useful detail and context.",
    },
    {
        id: "rewrite",
        label: "Rewrite",
        description: "Rewrite the text while keeping the meaning.",
    },
    {
        id: "shorten",
        label: "Shorten",
        description: "Make the selected text more concise.",
    },
    {
        id: "professional",
        label: "Professional",
        description: "Give the writing a polished professional tone.",
    },
    {
        id: "casual",
        label: "Casual",
        description: "Make the writing natural and conversational.",
    },
    {
        id: "explain",
        label: "Explain",
        description: "Explain the selected content more clearly.",
    },
    {
        id: "improve",
        label: "Improve",
        description: "Improve clarity, grammar and flow.",
    },
    {
        id: "brainstorm",
        label: "Brainstorm",
        description: "Generate useful ideas around the selected text.",
    },
];


function renderElement(props) {
    const { attributes, children, element } = props;

    switch (element.type) {
        case "heading-one":
            return (
                <h1
                    {...attributes}
                    className="mt-8 mb-5 text-3xl font-bold tracking-tight text-slate-950"
                >
                    {children}
                </h1>
            );

        case "heading-two":
            return (
                <h2
                    {...attributes}
                    className="mb-4 text-2xl font-bold tracking-tight mt-7 text-slate-950"
                >
                    {children}
                </h2>
            );

        case "blockquote":
            return (
                <blockquote
                    {...attributes}
                    className="px-5 py-3 my-5 border-l-4 border-violet-300 bg-violet-50/70 text-slate-600"
                >
                    {children}
                </blockquote>
            );

        case "bulleted-list":
            return (
                <ul
                    {...attributes}
                    className="mb-4 ml-6 space-y-2 list-disc text-slate-700"
                >
                    {children}
                </ul>
            );

        case "numbered-list":
            return (
                <ol
                    {...attributes}
                    className="mb-4 ml-6 space-y-2 list-decimal text-slate-700"
                >
                    {children}
                </ol>
            );

        case "list-item":
            return (
                <li
                    {...attributes}
                    className="pl-1"
                >
                    {children}
                </li>
            );

        default:
            return (
                <p
                    {...attributes}
                    className="mb-3 min-h-[1.6rem] text-[16px] leading-8 text-slate-700"
                >
                    {children}
                </p>
            );
    }
}


function renderLeaf({ attributes, children, leaf }) {
    if (leaf.bold) {
        children = <strong>{children}</strong>;
    }

    if (leaf.italic) {
        children = <em>{children}</em>;
    }

    if (leaf.underline) {
        children = <u>{children}</u>;
    }

    if (leaf.code) {
        children = (
            <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-violet-700">
                {children}
            </code>
        );
    }

    return (
        <span {...attributes}>
            {children}
        </span>
    );
}


function getTextFromNodes(nodes) {
    return nodes
        .map((node) => {
            if (node.text !== undefined) {
                return node.text;
            }

            if (node.children) {
                return getTextFromNodes(node.children);
            }

            return "";
        })
        .join("");
}


function getWordCount(text) {
    const value = text.trim();

    if (!value) {
        return 0;
    }

    return value.split(/\s+/).length;
}


function getCharacterCount(text) {
    return text.length;
}


function getAIText(response) {
    return (
        response?.text ||
        response?.response ||
        response?.message ||
        response?.result ||
        response?.data?.text ||
        response?.data?.response ||
        ""
    );
}


function ToolbarButton({
    label,
    onClick,
    active = false,
    disabled = false,
    children,
}) {
    return (
        <motion.button
            type="button"
            title={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            disabled={disabled}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.94 }}
            className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-semibold transition ${
                active
                    ? "bg-violet-100 text-violet-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            } disabled:cursor-not-allowed disabled:opacity-40`}
        >
            {children}
        </motion.button>
    );
}


function FloatingStatus({
    connected,
    saving,
    saved,
}) {
    return (
        <motion.div
            layout
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur"
        >
            {saving ? (
                <>
                    <Loader2
                        size={13}
                        className="animate-spin text-violet-600"
                    />
                    <span className="text-slate-500">
                        Saving
                    </span>
                </>
            ) : saved ? (
                <>
                    <Check
                        size={13}
                        className="text-emerald-500"
                    />
                    <span className="text-slate-500">
                        Saved
                    </span>
                </>
            ) : connected ? (
                <>
                    <span className="relative flex w-2 h-2">
                        <span className="absolute inline-flex w-full h-full rounded-full opacity-50 animate-ping bg-emerald-400" />
                        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-slate-500">
                        Live
                    </span>
                </>
            ) : (
                <>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-slate-500">
                        Offline
                    </span>
                </>
            )}
        </motion.div>
    );
}


function AIOrb() {
    return (
        <div className="relative grid w-10 h-10 place-items-center">
            <motion.div
                animate={{
                    scale: [1, 1.18, 1],
                    opacity: [0.25, 0.5, 0.25],
                }}
                transition={{
                    duration: 2.2,
                    repeat: Infinity,
                }}
                className="absolute inset-0 rounded-full bg-violet-400/30 blur-md"
            />

            <motion.div
                animate={{
                    rotate: 360,
                }}
                transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute border rounded-full inset-1 border-violet-300 border-t-violet-600"
            />

            <div className="relative grid text-white rounded-full shadow-lg h-7 w-7 place-items-center bg-gradient-to-br from-violet-500 to-indigo-600 shadow-violet-200">
                <Sparkles size={13} />
            </div>
        </div>
    );
}


function AIPanel({
    open,
    onClose,
    selectedText,
    aiText,
    aiError,
    aiLoading,
    aiInput,
    setAiInput,
    onAction,
    onChat,
    onApply,
}) {
    return (
        <AnimatePresence>
            {open && (
                <motion.aside
                    initial={{
                        opacity: 0,
                        x: 35,
                        scale: 0.98,
                    }}
                    animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                    }}
                    exit={{
                        opacity: 0,
                        x: 35,
                        scale: 0.98,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 28,
                    }}
                    className="fixed right-4 top-[88px] z-50 flex w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-[0_25px_80px_rgba(15,23,42,0.15)] backdrop-blur-xl"
                >
                    <div className="p-5 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AIOrb />

                                <div>
                                    <h2 className="font-bold text-slate-950">
                                        BrainFlow AI
                                    </h2>

                                    <p className="text-xs text-slate-400">
                                        Contextual writing assistant
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="grid transition h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={17} />
                            </button>
                        </div>
                    </div>


                    <div className="max-h-[calc(100vh-160px)] overflow-y-auto p-5">
                        {selectedText ? (
                            <div className="p-4 mb-5 border rounded-2xl border-violet-100 bg-violet-50/60">
                                <div className="flex items-center gap-2 mb-2 text-xs font-bold tracking-wider uppercase text-violet-600">
                                    <MousePointer2 size={12} />
                                    Selected text
                                </div>

                                <p className="text-sm leading-6 line-clamp-5 text-slate-600">
                                    {selectedText}
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 mb-5 border rounded-2xl border-slate-200 bg-slate-50">
                                <p className="text-sm leading-6 text-slate-500">
                                    Select text in your document and use
                                    an AI action, or ask BrainFlow anything
                                    about your writing.
                                </p>
                            </div>
                        )}


                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                                    Quick actions
                                </span>

                                <Zap
                                    size={14}
                                    className="text-violet-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {AI_ACTIONS.map((action) => (
                                    <motion.button
                                        key={action.id}
                                        type="button"
                                        whileHover={{
                                            y: -2,
                                        }}
                                        whileTap={{
                                            scale: 0.97,
                                        }}
                                        onClick={() =>
                                            onAction(action.id)
                                        }
                                        disabled={
                                            aiLoading
                                        }
                                        className="p-3 text-left transition bg-white border rounded-xl border-slate-200 hover:border-violet-200 hover:bg-violet-50/50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <p className="text-sm font-semibold text-slate-800">
                                            {action.label}
                                        </p>

                                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">
                                            {action.description}
                                        </p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>


                        <div className="h-px my-6 bg-slate-100" />


                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                                    Ask BrainFlow
                                </span>

                                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                                    AI
                                </span>
                            </div>

                            <div className="p-2 transition border rounded-2xl border-slate-200 bg-slate-50 focus-within:border-violet-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
                                <textarea
                                    value={aiInput}
                                    onChange={(event) =>
                                        setAiInput(
                                            event.target.value
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter" &&
                                            (event.metaKey ||
                                                event.ctrlKey)
                                        ) {
                                            event.preventDefault();
                                            onChat();
                                        }
                                    }}
                                    rows={3}
                                    placeholder="Ask something about this document..."
                                    className="w-full px-2 py-1 text-sm leading-6 bg-transparent outline-none resize-none text-slate-800 placeholder:text-slate-400"
                                />

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={onChat}
                                        disabled={
                                            aiLoading ||
                                            !aiInput.trim()
                                        }
                                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-slate-950 hover:bg-violet-700 disabled:opacity-40"
                                    >
                                        {aiLoading ? (
                                            <Loader2
                                                size={13}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Send size={13} />
                                        )}

                                        Ask
                                    </button>
                                </div>
                            </div>
                        </div>


                        {aiLoading && (
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: 8,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                className="p-4 mt-5 border rounded-2xl border-violet-100 bg-violet-50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(
                                            (item) => (
                                                <motion.span
                                                    key={item}
                                                    animate={{
                                                        y: [
                                                            0,
                                                            -5,
                                                            0,
                                                        ],
                                                    }}
                                                    transition={{
                                                        duration: 0.7,
                                                        repeat: Infinity,
                                                        delay:
                                                            item *
                                                            0.12,
                                                    }}
                                                    className="h-1.5 w-1.5 rounded-full bg-violet-500"
                                                />
                                            )
                                        )}
                                    </div>

                                    <span className="text-xs font-medium text-violet-700">
                                        BrainFlow is thinking...
                                    </span>
                                </div>
                            </motion.div>
                        )}


                        {aiError && (
                            <div className="p-4 mt-5 text-sm text-red-600 border border-red-200 rounded-2xl bg-red-50">
                                {aiError}
                            </div>
                        )}


                        {aiText && !aiLoading && (
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: 10,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                className="mt-5 overflow-hidden bg-white border rounded-2xl border-slate-200"
                            >
                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Sparkles
                                            size={14}
                                            className="text-violet-500"
                                        />

                                        <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
                                            AI result
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigator.clipboard?.writeText(
                                                aiText
                                            )
                                        }
                                        className="grid w-8 h-8 rounded-lg place-items-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                        title="Copy"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>

                                <div className="p-4 overflow-y-auto max-h-72">
                                    <p className="text-sm leading-7 whitespace-pre-wrap text-slate-700">
                                        {aiText}
                                    </p>
                                </div>

                                <div className="p-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={onApply}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                                    >
                                        <Sparkles size={15} />
                                        Apply to document
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}


export default function Document({ user }) {
    const navigate = useNavigate();
    const { documentId } = useParams();

    const editor = useMemo(
        () =>
            withHistory(
                withReact(
                    createEditor()
                )
            ),
        []
    );

    const [documentData, setDocumentData] = useState(null);
    const [title, setTitle] = useState("");

    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    const [aiText, setAiText] = useState("");
    const [aiError, setAiError] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiInput, setAiInput] = useState("");
    const [aiOpen, setAiOpen] = useState(false);

    const [message, setMessage] = useState("");

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [connected, setConnected] = useState(
        socket.connected
    );

    const [fullscreen, setFullscreen] = useState(false);

    const [wordCount, setWordCount] = useState(0);
    const [characterCount, setCharacterCount] =
        useState(0);

    const selectionRef = useRef(null);
    const mountedRef = useRef(true);
    const collaborationStartedRef = useRef(false);
    const applyingRemoteRef = useRef(false);
    const titleTimerRef = useRef(null);
    const savedTimerRef = useRef(null);


    const updateCounts = useCallback((value) => {
        const text = getTextFromNodes(value || []);

        setWordCount(getWordCount(text));
        setCharacterCount(
            getCharacterCount(text)
        );
    }, []);


    /*
     * Load document.
     *
     * Existing backend:
     *
     * GET /api/documents/:documentId
     */
    const loadDocument = useCallback(async () => {
        if (!documentId) return;

        setStatus("loading");
        setError("");

        try {
            const response = await apiRequest(
                `/documents/${documentId}`
            );

            const data =
                response?.document ||
                response;

            if (!data) {
                throw new Error(
                    "Document was not found."
                );
            }

            const content =
                Array.isArray(data.content) &&
                data.content.length
                    ? data.content
                    : EMPTY_CONTENT;

            editor.children = content;

            setDocumentData(data);
            setTitle(data.title || "Untitled document");

            updateCounts(content);

            setStatus("ready");
        } catch (requestError) {
            console.error(
                "LOAD DOCUMENT ERROR:",
                requestError
            );

            if (mountedRef.current) {
                setStatus("error");
                setError(
                    requestError.message ||
                        "Unable to load document."
                );
            }
        }
    }, [
        documentId,
        editor,
        updateCounts,
    ]);


    useEffect(() => {
        mountedRef.current = true;

        loadDocument();

        return () => {
            mountedRef.current = false;
        };
    }, [loadDocument]);


    /*
     * Socket realtime collaboration.
     *
     * IMPORTANT:
     * Existing socket events are preserved.
     */
    useEffect(() => {
        if (!documentId) return;

        const handleConnect = () => {
            setConnected(true);

            socket.emit(
                "join:document",
                {
                    documentId,
                }
            );

            collaborationStartedRef.current =
                true;
        };


        const handleDisconnect = () => {
            setConnected(false);
            collaborationStartedRef.current =
                false;
        };


        const handleConnectError = (
            socketError
        ) => {
            console.error(
                "SOCKET CONNECT ERROR:",
                socketError
            );

            setConnected(false);
        };


        const handleSync = (data) => {
            if (
                !data ||
                String(data.documentId) !==
                    String(documentId)
            ) {
                return;
            }

            if (!Array.isArray(data.content)) {
                return;
            }

            applyingRemoteRef.current = true;

            editor.children = data.content;

            updateCounts(data.content);

            requestAnimationFrame(() => {
                applyingRemoteRef.current = false;
            });
        };


        const handleRemoteContent = (data) => {
            if (
                !data ||
                String(data.documentId) !==
                    String(documentId)
            ) {
                return;
            }

            if (!Array.isArray(data.content)) {
                return;
            }

            applyingRemoteRef.current = true;

            editor.children = data.content;

            updateCounts(data.content);

            requestAnimationFrame(() => {
                applyingRemoteRef.current = false;
            });
        };


        const handleDocumentError = (data) => {
            console.error(
                "DOCUMENT SOCKET ERROR:",
                data
            );

            if (data?.message) {
                setError(data.message);
            }
        };


        socket.on(
            "connect",
            handleConnect
        );

        socket.on(
            "disconnect",
            handleDisconnect
        );

        socket.on(
            "connect_error",
            handleConnectError
        );

        socket.on(
            "document:sync",
            handleSync
        );

        socket.on(
            "document:content",
            handleRemoteContent
        );

        socket.on(
            "document:error",
            handleDocumentError
        );


        if (socket.connected) {
            handleConnect();
        } else {
            connectSocket();
        }


        return () => {
            socket.off(
                "connect",
                handleConnect
            );

            socket.off(
                "disconnect",
                handleDisconnect
            );

            socket.off(
                "connect_error",
                handleConnectError
            );

            socket.off(
                "document:sync",
                handleSync
            );

            socket.off(
                "document:content",
                handleRemoteContent
            );

            socket.off(
                "document:error",
                handleDocumentError
            );

            if (collaborationStartedRef.current) {
                leaveDocument(documentId);
            }

            collaborationStartedRef.current =
                false;
        };
    }, [
        documentId,
        editor,
        updateCounts,
    ]);


    /*
     * Title autosave.
     *
     * Existing backend:
     *
     * PATCH /api/documents/:documentId
     */
    const saveTitle = useCallback(
        async (nextTitle) => {
            if (!documentId) return;

            setSaving(true);
            setSaved(false);

            try {
                await apiRequest(
                    `/documents/${documentId}`,
                    {
                        method: "PATCH",
                        body: {
                            title:
                                nextTitle.trim() ||
                                "Untitled document",
                        },
                    }
                );

                if (mountedRef.current) {
                    setSaved(true);

                    clearTimeout(
                        savedTimerRef.current
                    );

                    savedTimerRef.current =
                        setTimeout(() => {
                            if (
                                mountedRef.current
                            ) {
                                setSaved(false);
                            }
                        }, 1800);
                }
            } catch (requestError) {
                console.error(
                    "SAVE TITLE ERROR:",
                    requestError
                );

                if (mountedRef.current) {
                    setError(
                        requestError.message ||
                            "Unable to save title."
                    );
                }
            } finally {
                if (mountedRef.current) {
                    setSaving(false);
                }
            }
        },
        [documentId]
    );


    const handleTitleChange = (event) => {
        const nextTitle =
            event.target.value;

        setTitle(nextTitle);
        setSaved(false);

        clearTimeout(titleTimerRef.current);

        titleTimerRef.current =
            setTimeout(() => {
                saveTitle(nextTitle);
            }, 700);
    };


    /*
     * Editor changes.
     *
     * Existing realtime event:
     *
     * document:content
     */
    const handleEditorChange = (value) => {
        updateCounts(value);

        const selection =
            editor.selection;

        if (selection) {
            selectionRef.current =
                selection;
        }


        if (
            applyingRemoteRef.current
        ) {
            return;
        }


        socket.emit(
            "document:content",
            {
                documentId,
                content: value,
            }
        );


        setSaved(false);
    };


    const captureSelection = () => {
        if (editor.selection) {
            selectionRef.current =
                editor.selection;
        }
    };


    const toggleMark = (format) => {
        if (!editor.selection) return;

        const marks =
            Editor.marks(editor);

        const active =
            marks?.[format] === true;

        if (active) {
            Editor.removeMark(
                editor,
                format
            );
        } else {
            Editor.addMark(
                editor,
                format,
                true
            );
        }
    };


    const isMarkActive = (format) => {
        const marks =
            Editor.marks(editor);

        return marks?.[format] === true;
    };


    const setBlock = (type) => {
        Transforms.setNodes(
            editor,
            {
                type,
            },
            {
                match: (node) =>
                    Editor.isBlock(
                        editor,
                        node
                    ),
            }
        );
    };


    const handleKeyDown = (event) => {
        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() === "b"
        ) {
            event.preventDefault();
            toggleMark("bold");
            return;
        }

        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() === "i"
        ) {
            event.preventDefault();
            toggleMark("italic");
            return;
        }

        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() === "u"
        ) {
            event.preventDefault();
            toggleMark("underline");
            return;
        }
    };


    const selectedText = useMemo(() => {
        const range =
            selectionRef.current;

        if (!range || Range.isCollapsed(range)) {
            return "";
        }

        try {
            return Editor.string(
                editor,
                range
            );
        } catch {
            return "";
        }
    }, [
        editor,
        wordCount,
        characterCount,
    ]);


    /*
     * AI request.
     *
     * Existing backend contract:
     *
     * POST /api/ai/chat
     */
   const requestAI = async ({ action, message: requestMessage = "" }) => {
    setAiLoading(true);
    setAiError("");
    setAiText("");

    try {
        // Quick actions need a message because the backend
        // requires message.trim() to be present.
        const actionPrompt =
            requestMessage?.trim() ||
            {
                summarize:
                    "Summarize the selected text clearly and concisely.",
                rewrite:
                    "Rewrite the selected text while preserving its original meaning.",
                expand:
                    "Expand the selected text with useful detail and context.",
                shorten:
                    "Make the selected text shorter and more concise.",
                professional:
                    "Rewrite the selected text in a polished professional tone.",
                casual:
                    "Rewrite the selected text in a natural and conversational tone.",
                explain:
                    "Explain the selected text clearly and simply.",
                improve:
                    "Improve the clarity, grammar, structure, and flow of the selected text.",
                brainstorm:
                    "Generate useful ideas and possibilities related to the selected text.",
                chat:
                    "Help me with this document.",
            }[action] || "Help me with this document.";

        const response = await apiRequest("/ai/chat", {
            method: "POST",
            body: {
                documentId,
                action,
                selectedText,
                message: actionPrompt,
            },
        });

        console.log("AI RESPONSE:", response);

        const result =
            response?.response?.text ||
            response?.text ||
            response?.message ||
            response?.result ||
            response?.data?.text ||
            response?.data?.response?.text ||
            "";

        if (!result) {
            throw new Error("BrainFlow AI returned an empty response.");
        }

        setAiText(result);

        return result;
    } catch (requestError) {
        console.error("AI REQUEST ERROR:", requestError);

        setAiError(
            requestError.message || "AI request failed."
        );

        return "";
    } finally {
        setAiLoading(false);
    }
};


    const handleAIAction = async (
        action
    ) => {
        if (!selectedText) {
            setAiError(
                "Select some text first."
            );
            return;
        }

        await requestAI({
            action,
            message: "",
        });
    };


    const handleAIChat = async () => {
        const prompt =
            aiInput.trim();

        if (!prompt) return;

        const result =
            await requestAI({
                action: "chat",
                message: prompt,
            });

        if (result) {
            setAiInput("");
        }
    };


    /*
     * Apply AI result to the selected
     * editor range.
     */
    const applyAIResult = () => {
        if (!aiText.trim()) {
            return;
        }

        const range =
            selectionRef.current;

        if (
            range &&
            !Range.isCollapsed(range)
        ) {
            Transforms.select(
                editor,
                range
            );

            Transforms.insertText(
                editor,
                aiText.trim()
            );

            return;
        }


        Transforms.insertNodes(
            editor,
            {
                type: "paragraph",
                children: [
                    {
                        text: aiText.trim(),
                    },
                ],
            }
        );
    };


    const retryConnection = () => {
        try {
            connectSocket();
        } catch (connectionError) {
            console.error(
                "SOCKET RETRY ERROR:",
                connectionError
            );
        }
    };


    useEffect(() => {
        return () => {
            clearTimeout(
                titleTimerRef.current
            );

            clearTimeout(
                savedTimerRef.current
            );
        };
    }, []);


    if (status === "loading") {
        return (
            <Layout>
                <div className="grid min-h-[80vh] place-items-center bg-[#F6F7FB]">
                    <motion.div
                        animate={{
                            rotate: 360,
                        }}
                        transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        className="border-2 rounded-full h-9 w-9 border-violet-100 border-t-violet-600"
                    />
                </div>
            </Layout>
        );
    }


    if (status === "error") {
        return (
            <Layout>
                <div className="grid min-h-[80vh] place-items-center bg-[#F6F7FB] p-6">
                    <div className="max-w-md p-8 text-center bg-white border border-red-200 shadow-xl rounded-3xl">
                        <div className="grid mx-auto text-red-500 h-14 w-14 place-items-center rounded-2xl bg-red-50">
                            <X size={24} />
                        </div>

                        <h1 className="mt-5 text-xl font-bold text-slate-950">
                            Unable to open document
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            {error ||
                                "Something went wrong while loading this document."}
                        </p>

                        <div className="flex justify-center gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/dashboard"
                                    )
                                }
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                            >
                                Dashboard
                            </button>

                            <button
                                type="button"
                                onClick={
                                    loadDocument
                                }
                                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }


    return (
        <Layout>
            <div
                className={`min-h-screen bg-[#F6F7FB] text-slate-900 ${
                    fullscreen
                        ? "fixed inset-0 z-[80] overflow-auto"
                        : ""
                }`}
            >
                {/* Decorative background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{
                            x: [0, 30, 0],
                            y: [0, -20, 0],
                        }}
                        transition={{
                            duration: 12,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute rounded-full -left-40 top-20 h-96 w-96 bg-violet-200/30 blur-3xl"
                    />

                    <motion.div
                        animate={{
                            x: [0, -25, 0],
                            y: [0, 25, 0],
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute right-0 top-1/3 h-[420px] w-[420px] rounded-full bg-indigo-100/40 blur-3xl"
                    />
                </div>


                {/* Top editor header */}
                <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#F6F7FB]/90 backdrop-blur-xl">
                    <div className="flex min-h-[76px] items-center gap-3 px-4 sm:px-6">
                        <motion.button
                            type="button"
                            whileHover={{
                                x: -2,
                            }}
                            whileTap={{
                                scale: 0.94,
                            }}
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                            className="grid w-10 h-10 transition bg-white border shadow-sm shrink-0 place-items-center rounded-xl border-slate-200 text-slate-500 hover:text-slate-900"
                            title="Back to dashboard"
                        >
                            <ArrowLeft size={18} />
                        </motion.button>


                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <FileText
                                    size={14}
                                    className="shrink-0 text-violet-500"
                                />

                                <span className="hidden text-xs font-medium text-slate-400 sm:block">
                                    BrainFlow document
                                </span>
                            </div>

                            <input
                                value={title}
                                onChange={
                                    handleTitleChange
                                }
                                className="mt-0.5 w-full max-w-xl truncate border-none bg-transparent text-lg font-bold tracking-tight text-slate-950 outline-none placeholder:text-slate-300"
                                placeholder="Untitled document"
                            />
                        </div>


                        <FloatingStatus
                            connected={connected}
                            saving={saving}
                            saved={saved}
                        />


                        <button
                            type="button"
                            onClick={() =>
                                setAiOpen(
                                    (value) =>
                                        !value
                                )
                            }
                            className={`hidden h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition sm:flex ${
                                aiOpen
                                    ? "bg-violet-100 text-violet-700"
                                    : "border border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:text-violet-700"
                            }`}
                        >
                            <Sparkles size={16} />
                            AI
                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                setFullscreen(
                                    (value) =>
                                        !value
                                )
                            }
                            className="grid w-10 h-10 transition bg-white border place-items-center rounded-xl border-slate-200 text-slate-500 hover:text-slate-900"
                            title="Toggle fullscreen"
                        >
                            {fullscreen ? (
                                <Minimize2 size={17} />
                            ) : (
                                <Maximize2 size={17} />
                            )}
                        </button>


                        <button
                            type="button"
                            className="grid w-10 h-10 transition bg-white border place-items-center rounded-xl border-slate-200 text-slate-500 hover:text-slate-900"
                        >
                            <MoreHorizontal
                                size={18}
                            />
                        </button>
                    </div>
                </header>


                {/* Toolbar */}
                <div className="sticky top-[76px] z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
                        <ToolbarButton
                            label="Undo"
                            onClick={() =>
                                editor.undo()
                            }
                            disabled={
                                editor.history.undos
                                    .length === 0
                            }
                        >
                            <Undo2 size={16} />
                        </ToolbarButton>

                        <ToolbarButton
                            label="Redo"
                            onClick={() =>
                                editor.redo()
                            }
                            disabled={
                                editor.history.redos
                                    .length === 0
                            }
                        >
                            <Redo2 size={16} />
                        </ToolbarButton>


                        <div className="w-px h-6 mx-2 bg-slate-200" />


                        <ToolbarButton
                            label="Bold"
                            active={isMarkActive(
                                "bold"
                            )}
                            onClick={() =>
                                toggleMark(
                                    "bold"
                                )
                            }
                        >
                            <span className="font-black">
                                B
                            </span>
                        </ToolbarButton>

                        <ToolbarButton
                            label="Italic"
                            active={isMarkActive(
                                "italic"
                            )}
                            onClick={() =>
                                toggleMark(
                                    "italic"
                                )
                            }
                        >
                            <span className="font-serif italic">
                                I
                            </span>
                        </ToolbarButton>

                        <ToolbarButton
                            label="Underline"
                            active={isMarkActive(
                                "underline"
                            )}
                            onClick={() =>
                                toggleMark(
                                    "underline"
                                )
                            }
                        >
                            <span className="underline">
                                U
                            </span>
                        </ToolbarButton>


                        <div className="w-px h-6 mx-2 bg-slate-200" />


                        <button
                            type="button"
                            onMouseDown={(event) =>
                                event.preventDefault()
                            }
                            onClick={() =>
                                setBlock(
                                    "paragraph"
                                )
                            }
                            className="flex items-center gap-2 px-3 text-xs font-semibold transition rounded-lg h-9 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                            Paragraph
                            <ChevronDown
                                size={13}
                            />
                        </button>


                        <ToolbarButton
                            label="Heading 1"
                            onClick={() =>
                                setBlock(
                                    "heading-one"
                                )
                            }
                        >
                            H1
                        </ToolbarButton>

                        <ToolbarButton
                            label="Heading 2"
                            onClick={() =>
                                setBlock(
                                    "heading-two"
                                )
                            }
                        >
                            H2
                        </ToolbarButton>

                        <ToolbarButton
                            label="Quote"
                            onClick={() =>
                                setBlock(
                                    "blockquote"
                                )
                            }
                        >
                            “
                        </ToolbarButton>


                        <div className="flex-1" />


                        <div className="items-center hidden gap-3 text-xs text-slate-400 md:flex">
                            <span>
                                {wordCount} words
                            </span>

                            <span className="w-px h-3 bg-slate-200" />

                            <span>
                                {characterCount} characters
                            </span>
                        </div>


                        <button
                            type="button"
                            onClick={() =>
                                setAiOpen(
                                    (value) =>
                                        !value
                                )
                            }
                            className="flex items-center gap-2 px-3 ml-2 text-xs font-bold transition rounded-lg h-9 bg-violet-50 text-violet-700 hover:bg-violet-100 sm:hidden"
                        >
                            <Sparkles
                                size={14}
                            />
                            AI
                        </button>
                    </div>
                </div>


                {/* Main workspace */}
                <main className="relative mx-auto max-w-[1500px] px-4 pb-20 pt-5 sm:px-6">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
                        {/* Editor area */}
                        <section className="min-w-0">
                            {/* 3D document visual */}
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: 20,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    duration: 0.6,
                                }}
                                className="relative mb-5 overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-br from-white via-white to-violet-50/50 shadow-[0_20px_70px_rgba(15,23,42,0.06)]"
                            >
                                <div className="absolute z-10 left-6 top-5">
                                    <div className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 shadow-sm backdrop-blur">
                                        Intelligent document
                                    </div>
                                </div>

                                <div className="absolute z-10 max-w-xs bottom-5 left-6">
                                    <p className="text-sm font-semibold text-slate-800">
                                        Write naturally.
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-400">
                                        BrainFlow keeps your document,
                                        realtime workspace and AI
                                        assistance connected.
                                    </p>
                                </div>

                                <div className="h-[260px] overflow-hidden sm:h-[320px]">
                                    <DocumentHero3D />
                                </div>
                            </motion.div>


                            {/* Paper */}
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: 25,
                                    rotateX: 1,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    rotateX: 0,
                                }}
                                transition={{
                                    duration: 0.7,
                                    delay: 0.08,
                                }}
                                className="relative mx-auto max-w-[950px]"
                            >
                                {/* Fake paper layers */}
                                <div className="absolute inset-x-3 bottom-[-10px] top-3 rounded-[24px] border border-slate-200 bg-white/80 shadow-sm" />

                                <div className="absolute inset-x-1 bottom-[-5px] top-1 rounded-[24px] border border-slate-200 bg-white shadow-md" />

                                <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
                                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none bg-violet-100/40 blur-3xl" />

                                    <div className="relative px-6 py-8 sm:px-12 sm:py-12 lg:px-20 lg:py-16">
                                        <Slate
                                            editor={editor}
                                            initialValue={
                                                editor.children?.length
                                                    ? editor.children
                                                    : EMPTY_CONTENT
                                            }
                                            onChange={
                                                handleEditorChange
                                            }
                                        >
                                            <Editable
                                                renderElement={
                                                    renderElement
                                                }
                                                renderLeaf={
                                                    renderLeaf
                                                }
                                                placeholder="Start writing your next idea..."
                                                spellCheck
                                                autoFocus
                                                onSelect={
                                                    captureSelection
                                                }
                                                onKeyDown={
                                                    handleKeyDown
                                                }
                                                className="min-h-[620px] outline-none"
                                            />
                                        </Slate>
                                    </div>
                                </div>
                            </motion.div>
                        </section>


                        {/* Desktop AI rail */}
                        <aside className="hidden xl:block">
                            <div className="sticky top-[145px]">
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        x: 20,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        delay: 0.2,
                                    }}
                                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
                                >
                                    <div className="p-5 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <AIOrb />

                                            <div>
                                                <h3 className="font-bold text-slate-950">
                                                    BrainFlow AI
                                                </h3>

                                                <p className="text-xs text-slate-400">
                                                    Writing intelligence
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAiOpen(
                                                    true
                                                )
                                            }
                                            className="flex items-center w-full gap-3 p-4 text-left transition border rounded-2xl border-violet-100 bg-violet-50/70 hover:border-violet-200 hover:bg-violet-50"
                                        >
                                            <Sparkles
                                                size={17}
                                                className="text-violet-600"
                                            />

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-800">
                                                    Open AI workspace
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Select text to transform
                                                    it instantly.
                                                </p>
                                            </div>

                                            <ArrowLeft
                                                size={15}
                                                className="rotate-180 text-violet-400"
                                            />
                                        </button>


                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            {AI_ACTIONS.slice(
                                                0,
                                                6
                                            ).map(
                                                (action) => (
                                                    <button
                                                        key={
                                                            action.id
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            handleAIAction(
                                                                action.id
                                                            )
                                                        }
                                                        disabled={
                                                            aiLoading ||
                                                            !selectedText
                                                        }
                                                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
                                                    >
                                                        {
                                                            action.label
                                                        }
                                                    </button>
                                                )
                                            )}
                                        </div>


                                        {!connected && (
                                            <button
                                                type="button"
                                                onClick={
                                                    retryConnection
                                                }
                                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700"
                                            >
                                                <WifiOff
                                                    size={14}
                                                />
                                                Reconnect realtime
                                            </button>
                                        )}
                                    </div>
                                </motion.div>


                                {/* Stats */}
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        y: 15,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    transition={{
                                        delay: 0.35,
                                    }}
                                    className="grid grid-cols-2 gap-3 mt-4"
                                >
                                    <div className="p-4 bg-white border rounded-2xl border-slate-200">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Words
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-slate-950">
                                            {wordCount}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-white border rounded-2xl border-slate-200">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Characters
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-slate-950">
                                            {characterCount}
                                        </p>
                                    </div>
                                </motion.div>


                                {/* Realtime card */}
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        y: 15,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    transition={{
                                        delay: 0.45,
                                    }}
                                    className="p-4 mt-4 bg-white border rounded-2xl border-slate-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`grid h-9 w-9 place-items-center rounded-xl ${
                                                connected
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : "bg-amber-50 text-amber-600"
                                            }`}
                                        >
                                            {connected ? (
                                                <Wifi
                                                    size={16}
                                                />
                                            ) : (
                                                <WifiOff
                                                    size={16}
                                                />
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {connected
                                                    ? "Realtime active"
                                                    : "Connection lost"}
                                            </p>

                                            <p className="mt-0.5 text-xs text-slate-400">
                                                {connected
                                                    ? "Document changes sync automatically."
                                                    : "Reconnect to continue realtime editing."}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </aside>
                    </div>
                </main>


                {/* Bottom floating editor status */}
                <motion.div
                    initial={{
                        opacity: 0,
                        y: 20,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-[0_15px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl"
                >
                    <div className="items-center hidden gap-2 px-3 text-xs text-slate-400 sm:flex">
                        <Save size={13} />
                        {saving
                            ? "Saving..."
                            : saved
                            ? "All changes saved"
                            : connected
                            ? "Realtime editing"
                            : "Offline"}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setAiOpen(
                                (value) =>
                                    !value
                            )
                        }
                        className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
                    >
                        <Sparkles size={14} />
                        AI Assist
                    </button>
                </motion.div>


                {/* Mobile / overlay AI */}
                <AIPanel
                    open={aiOpen}
                    onClose={() =>
                        setAiOpen(false)
                    }
                    selectedText={
                        selectedText
                    }
                    aiText={aiText}
                    aiError={aiError}
                    aiLoading={aiLoading}
                    aiInput={aiInput}
                    setAiInput={setAiInput}
                    onAction={
                        handleAIAction
                    }
                    onChat={
                        handleAIChat
                    }
                    onApply={
                        applyAIResult
                    }
                />


                {/* Toast */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{
                                opacity: 0,
                                y: 15,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                y: 15,
                            }}
                            className="fixed bottom-20 left-1/2 z-[70] -translate-x-1/2 rounded-xl border border-slate-200 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-xl"
                        >
                            {message}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
}