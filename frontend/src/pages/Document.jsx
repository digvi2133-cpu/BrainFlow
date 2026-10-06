import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

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

import {
    ArrowLeft,
    RotateCcw,
    Save,
    Send,
    Sparkles,
    Wifi,
    WifiOff,
} from "lucide-react";

import Layout from "../components/Layout";

import { apiRequest } from "../lib/api";

import {
    connectSocket,
    leaveDocument,
    socket,
} from "../lib/socket";


const EMPTY_CONTENT = [
    {
        type: "paragraph",
        children: [
            {
                text: "Start writing your document...",
            },
        ],
    },
];


const AI_ACTIONS = [
    "summarize",
    "rewrite",
    "expand",
    "shorten",
    "professional",
    "casual",
    "explain",
    "improve",
    "brainstorm",
];


const renderElement = (props) => {
    return (
        <p
            {...props.attributes}
            className="mb-3 leading-7 text-slate-200"
        >
            {props.children}
        </p>
    );
};


const renderLeaf = (props) => {
    let children = props.children;

    if (props.leaf.bold) {
        children = <strong>{children}</strong>;
    }

    if (props.leaf.italic) {
        children = <em>{children}</em>;
    }

    if (props.leaf.underline) {
        children = <u>{children}</u>;
    }

    return (
        <span {...props.attributes}>
            {children}
        </span>
    );
};


export default function Document({ user }) {
    const { documentId } = useParams();
    const navigate = useNavigate();

    const editor = useMemo(
        () =>
            withReact(
                withHistory(
                    createEditor()
                )
            ),
        []
    );

    const [documentData, setDocumentData] =
        useState(null);

    const [title, setTitle] =
        useState("");

    const [status, setStatus] =
        useState("loading");

    const [error, setError] =
        useState("");

    const [aiText, setAiText] =
        useState("");

    const [aiError, setAiError] =
        useState("");

    const [aiLoading, setAiLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const selectionRef =
        useRef(null);

    const mountedRef =
        useRef(false);

    const collaborationStartedRef =
        useRef(false);

    const applyingRemoteRef =
        useRef(false);


    /* =====================================================
       LOAD DOCUMENT
    ===================================================== */

    useEffect(() => {
        let active = true;

        const loadDocument = async () => {
            try {
                setStatus("loading");
                setError("");

                const response =
                    await apiRequest(
                        `/documents/${documentId}`
                    );

                if (!active) {
                    return;
                }

                if (!response?.document) {
                    throw new Error(
                        "Document data was not returned by the server."
                    );
                }

                const loadedDocument =
                    response.document;

                setDocumentData(
                    loadedDocument
                );

                setTitle(
                    loadedDocument.title || ""
                );

                setStatus("connecting");
            } catch (err) {
                if (!active) {
                    return;
                }

                console.error(
                    "Document loading error:",
                    err
                );

                setError(
                    err?.message ||
                        "Unable to load document."
                );

                setStatus("error");
            }
        };

        if (documentId) {
            loadDocument();
        }

        return () => {
            active = false;
        };
    }, [documentId]);


    /* =====================================================
   COLLABORATION
===================================================== */
useEffect(() => {
    if (!documentData || !documentId) {
        return;
    }

    if (collaborationStartedRef.current) {
        return;
    }

    collaborationStartedRef.current = true;
    mountedRef.current = true;

    let cancelled = false;
    let cleanupListeners = () => {};

    const handleConnect = () => {
        if (cancelled) {
            return;
        }

        console.log(
            "BrainFlow realtime connected:",
            socket.id
        );

        setError("");
        setStatus("connected");

        socket.emit("join:document", {
            documentId,
        });
    };

    const handleConnectError = (err) => {
        if (cancelled) {
            return;
        }

        console.error(
            "BrainFlow realtime connection error:",
            err
        );

        setError(
            err?.message ||
                "Unable to connect to realtime collaboration."
        );

        setStatus("error");
    };

    const handleDisconnect = (reason) => {
        if (cancelled) {
            return;
        }

        console.warn(
            "BrainFlow realtime disconnected:",
            reason
        );

        setStatus("connecting");
    };

    const handleDocumentSync = (data) => {
        if (
            !data ||
            data.documentId !== documentId
        ) {
            return;
        }

        if (
            Array.isArray(data.content) &&
            data.content.length > 0
        ) {
            applyingRemoteRef.current = true;

            editor.children = data.content;

            setTimeout(() => {
                applyingRemoteRef.current = false;
            }, 0);
        }

        if (!cancelled) {
            setStatus("connected");
        }
    };

    const handleRemoteContent = (data) => {
        if (
            !data ||
            data.documentId !== documentId
        ) {
            return;
        }

        if (!Array.isArray(data.content)) {
            return;
        }

        applyingRemoteRef.current = true;

        editor.children = data.content;

        setTimeout(() => {
            applyingRemoteRef.current = false;
        }, 0);
    };

    const handleDocumentError = (data) => {
        if (cancelled) {
            return;
        }

        console.error(
            "Document socket error:",
            data
        );

        setError(
            data?.message ||
                "Realtime collaboration failed."
        );

        setStatus("error");
    };

    socket.on("connect", handleConnect);
    socket.on(
        "connect_error",
        handleConnectError
    );
    socket.on(
        "disconnect",
        handleDisconnect
    );

    socket.on(
        "document:sync",
        handleDocumentSync
    );

    socket.on(
        "document:content",
        handleRemoteContent
    );

    socket.on(
        "document:error",
        handleDocumentError
    );

    cleanupListeners = () => {
        socket.off("connect", handleConnect);
        socket.off(
            "connect_error",
            handleConnectError
        );
        socket.off(
            "disconnect",
            handleDisconnect
        );

        socket.off(
            "document:sync",
            handleDocumentSync
        );

        socket.off(
            "document:content",
            handleRemoteContent
        );

        socket.off(
            "document:error",
            handleDocumentError
        );
    };

    setStatus("connecting");

    connectSocket();

    return () => {
        cancelled = true;
        mountedRef.current = false;

        cleanupListeners();

        try {
            leaveDocument(documentId);
        } catch (err) {
            console.error(
                "Error leaving document:",
                err
            );
        }

        collaborationStartedRef.current = false;
    };
}, [
    documentData,
    documentId,
    editor,
]);


    /* =====================================================
       TITLE AUTOSAVE
    ===================================================== */

    const saveTitle = useCallback(
        async () => {
            if (!documentId) {
                return;
            }

            try {
                await apiRequest(
                    `/documents/${documentId}`,
                    {
                        method: "PATCH",
                        body: {
                            title,
                        },
                    }
                );
            } catch (err) {
                console.error(
                    "Title save error:",
                    err
                );

                setError(
                    err?.message ||
                        "Unable to save title."
                );
            }
        },
        [documentId, title]
    );


    useEffect(() => {
        if (
            !documentData ||
            status !== "connected"
        ) {
            return;
        }

        const timer = setTimeout(
            saveTitle,
            700
        );

        return () =>
            clearTimeout(timer);
    }, [
        saveTitle,
        documentData,
        status,
    ]);


    /* =====================================================
       EDITOR CHANGE
    ===================================================== */

    const handleEditorChange =
        (nextValue) => {
            if (
                applyingRemoteRef.current
            ) {
                return;
            }

            if (
                status !== "connected"
            ) {
                return;
            }

            if (!socket.connected) {
                return;
            }

            socket.emit(
                "document:content",
                {
                    documentId,
                    content: nextValue,
                }
            );
        };


    /* =====================================================
       CAPTURE SELECTION
    ===================================================== */

    const captureSelection = () => {
        if (!editor.selection) {
            selectionRef.current = null;
            return;
        }

        if (
            Range.isCollapsed(
                editor.selection
            )
        ) {
            selectionRef.current = null;
            return;
        }

        selectionRef.current = {
            anchor: {
                path: [
                    ...editor.selection
                        .anchor.path,
                ],
                offset:
                    editor.selection.anchor
                        .offset,
            },

            focus: {
                path: [
                    ...editor.selection
                        .focus.path,
                ],
                offset:
                    editor.selection.focus
                        .offset,
            },
        };
    };


    /* =====================================================
       AI ACTION
    ===================================================== */

    const runAI = async (action) => {
        captureSelection();

        let selectedText = "";

        if (
            editor.selection &&
            !Range.isCollapsed(
                editor.selection
            )
        ) {
            selectedText =
                Editor.string(
                    editor,
                    editor.selection
                );
        }

        setAiLoading(true);
        setAiError("");
        setAiText("");

        try {
            const response =
                await apiRequest(
                    "/ai/chat",
                    {
                        method: "POST",

                        body: {
                            documentId,
                            action,
                            selectedText,

                            message:
                                selectedText
                                    ? `Apply the ${action} action to the selected text.`
                                    : `${action} the document and provide a useful result.`,
                        },
                    }
                );

            const result =
                response?.response?.text?.trim();

            if (!result) {
                throw new Error(
                    "AI returned an empty response."
                );
            }

            setAiText(result);
        } catch (err) {
            console.error(
                "AI action error:",
                err
            );

            setAiError(
                err?.message ||
                    "Unable to generate AI response."
            );
        } finally {
            setAiLoading(false);
        }
    };


    /* =====================================================
       AI CHAT
    ===================================================== */

    const sendChat = async () => {
        const cleanMessage =
            message.trim();

        if (!cleanMessage) {
            return;
        }

        captureSelection();

        let selectedText = "";

        if (
            editor.selection &&
            !Range.isCollapsed(
                editor.selection
            )
        ) {
            selectedText =
                Editor.string(
                    editor,
                    editor.selection
                );
        }

        setAiLoading(true);
        setAiError("");
        setAiText("");

        try {
            const response =
                await apiRequest(
                    "/ai/chat",
                    {
                        method: "POST",

                        body: {
                            documentId,
                            action: "chat",
                            selectedText,
                            message:
                                cleanMessage,
                        },
                    }
                );

            const result =
                response?.response?.text?.trim();

            if (!result) {
                throw new Error(
                    "AI returned an empty response."
                );
            }

            setAiText(result);
            setMessage("");
        } catch (err) {
            console.error(
                "AI chat error:",
                err
            );

            setAiError(
                err?.message ||
                    "Unable to generate AI response."
            );
        } finally {
            setAiLoading(false);
        }
    };


    /* =====================================================
       APPLY AI RESULT
    ===================================================== */

    const applyAI = () => {
        if (!aiText.trim()) {
            return;
        }

        try {
            if (
                selectionRef.current
            ) {
                Transforms.select(
                    editor,
                    selectionRef.current
                );

                Transforms.delete(
                    editor
                );

                Transforms.insertText(
                    editor,
                    aiText
                );
            } else {
                Transforms.insertNodes(
                    editor,
                    {
                        type: "paragraph",

                        children: [
                            {
                                text: aiText,
                            },
                        ],
                    }
                );
            }

            setAiText("");

            selectionRef.current =
                null;
        } catch (err) {
            console.error(
                "AI apply error:",
                err
            );

            setAiError(
                "Unable to apply AI result to the document."
            );
        }
    };


    /* =====================================================
       RETRY
    ===================================================== */

  const retryConnection = () => {
    setError("");
    setStatus("connecting");

    collaborationStartedRef.current = false;
    mountedRef.current = true;

    try {
        if (socket.connected) {
            socket.emit("join:document", {
                documentId,
            });

            setStatus("connected");
            return;
        }

        connectSocket();
    } catch (err) {
        console.error(
            "Socket retry error:",
            err
        );

        setError(
            err?.message ||
                "Unable to reconnect to realtime collaboration."
        );

        setStatus("error");
    }
};  

    /* =====================================================
       LOADING
    ===================================================== */

    if (status === "loading") {
        return (
            <Layout user={user}>
                <div className="p-8 mx-auto max-w-7xl text-slate-400">
                    Loading document...
                </div>
            </Layout>
        );
    }


    /* =====================================================
       ERROR
    ===================================================== */

    if (status === "error") {
        return (
            <Layout user={user}>
                <div className="max-w-2xl p-8 mx-auto">
                    <div className="glass rounded-2xl p-7">

                        <div className="flex items-center gap-3 mb-3">

                            <WifiOff
                                className="text-red-400"
                                size={22}
                            />

                            <h1 className="text-2xl font-bold text-red-300">
                                Document connection failed
                            </h1>

                        </div>

                        <p className="text-slate-400">
                            {error ||
                                "Unable to connect to the collaborative editor."}
                        </p>

                        <div className="flex gap-3 mt-6">

                            <button
                                onClick={
                                    retryConnection
                                }
                                className="px-4 py-3 font-medium text-white transition bg-indigo-500 rounded-xl hover:bg-indigo-400"
                            >
                                Retry connection
                            </button>

                            <button
                                onClick={() =>
                                    navigate(
                                        "/dashboard"
                                    )
                                }
                                className="px-4 py-3 transition border rounded-xl border-white/10 text-slate-300 hover:bg-white/5"
                            >
                                Back to dashboard
                            </button>

                        </div>

                    </div>
                </div>
            </Layout>
        );
    }


    /* =====================================================
       MAIN UI
    ===================================================== */

    return (
        <Layout user={user}>

            <main className="mx-auto max-w-[1500px] p-4 md:p-6">

                {/* HEADER */}

                <div className="flex items-center gap-3 mb-4">

                    <button
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                        className="p-2 transition rounded-xl hover:bg-white/10"
                    >
                        <ArrowLeft
                            size={20}
                        />
                    </button>

                    <input
                        value={title}
                        onChange={(e) =>
                            setTitle(
                                e.target.value
                            )
                        }
                        className="flex-1 min-w-0 text-2xl font-bold text-white bg-transparent outline-none"
                    />

                    <span
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                            status ===
                            "connected"
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-amber-500/10 text-amber-300"
                        }`}
                    >
                        {status ===
                        "connected" ? (
                            <Wifi
                                size={13}
                            />
                        ) : (
                            <WifiOff
                                size={13}
                            />
                        )}

                        {status}
                    </span>

                </div>


                {/* MAIN GRID */}

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">

                    {/* DOCUMENT */}

                    <section className="glass min-h-[70vh] rounded-2xl p-5">

                        <div className="flex items-center gap-2 pb-3 mb-4 text-xs border-b border-white/10 text-slate-500">

                            <Save size={14} />

                            <span>
                                Changes sync automatically
                            </span>

                        </div>


                        <Slate
                            editor={editor}
                            initialValue={
                                documentData
                                    ?.content
                                    ?.length
                                    ? documentData.content
                                    : EMPTY_CONTENT
                            }
                            onChange={
                                handleEditorChange
                            }
                        >

                            <Editable
                                className="min-h-[60vh] max-w-3xl outline-none"
                                renderElement={
                                    renderElement
                                }
                                renderLeaf={
                                    renderLeaf
                                }
                                placeholder="Start writing..."
                                spellCheck
                                autoFocus
                                onSelect={
                                    captureSelection
                                }
                            />

                        </Slate>

                    </section>


                    {/* AI PANEL */}

                    <aside className="p-5 glass h-fit rounded-2xl xl:sticky xl:top-24">

                        <div className="flex items-center gap-2 mb-4">

                            <Sparkles
                                className="text-indigo-300"
                                size={19}
                            />

                            <h2 className="font-semibold text-white">
                                BrainFlow AI
                            </h2>

                        </div>


                        <p className="mb-4 text-xs leading-5 text-slate-500">
                            Select text in the
                            editor and choose an
                            action. The AI result
                            stays separate until
                            you apply it.
                        </p>


                        {/* AI ACTIONS */}

                        <div className="grid grid-cols-2 gap-2">

                            {AI_ACTIONS.map(
                                (action) => (
                                    <button
                                        key={
                                            action
                                        }
                                        disabled={
                                            aiLoading ||
                                            status !==
                                                "connected"
                                        }
                                        onMouseDown={(
                                            event
                                        ) => {
                                            event.preventDefault();

                                            captureSelection();
                                        }}
                                        onClick={() =>
                                            runAI(
                                                action
                                            )
                                        }
                                        className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs capitalize text-slate-200 transition hover:border-indigo-400/40 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {action}
                                    </button>
                                )
                            )}

                        </div>


                        {/* CHAT */}

                        <div className="flex gap-2 mt-4">

                            <input
                                value={message}
                                onChange={(e) =>
                                    setMessage(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (
                                        e.key ===
                                        "Enter"
                                    ) {
                                        e.preventDefault();
                                        sendChat();
                                    }
                                }}
                                placeholder="Ask BrainFlow..."
                                className="flex-1 min-w-0 px-3 py-2 text-sm text-white border outline-none rounded-xl border-white/10 bg-white/5 placeholder:text-slate-600 focus:border-indigo-400/40"
                            />

                            <button
                                onClick={
                                    sendChat
                                }
                                disabled={
                                    aiLoading ||
                                    !message.trim()
                                }
                                className="px-3 text-white transition bg-indigo-500 rounded-xl hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Send size={16} />
                            </button>

                        </div>


                        {/* LOADING */}

                        {aiLoading && (
                            <div className="p-3 mt-4 text-sm text-indigo-300 rounded-xl bg-indigo-500/10">
                                BrainFlow is
                                thinking...
                            </div>
                        )}


                        {/* ERROR */}

                        {aiError && (
                            <div className="p-3 mt-4 text-xs leading-5 text-red-300 border rounded-xl border-red-400/10 bg-red-500/10">
                                {aiError}
                            </div>
                        )}


                        {/* AI RESULT */}

                        {aiText && (
                            <div className="p-4 mt-4 border rounded-2xl border-indigo-400/20 bg-indigo-500/5">

                                <div className="mb-2 text-xs tracking-wider text-indigo-300 uppercase">
                                    AI result
                                </div>

                                <p className="text-sm leading-6 whitespace-pre-wrap text-slate-200">
                                    {aiText}
                                </p>

                                <div className="flex gap-2 mt-4">

                                    <button
                                        onClick={
                                            applyAI
                                        }
                                        className="flex-1 px-3 py-2 text-sm font-semibold text-white transition bg-indigo-500 rounded-lg hover:bg-indigo-400"
                                    >
                                        Apply to document
                                    </button>

                                    <button
                                        onClick={() =>
                                            setAiText(
                                                ""
                                            )
                                        }
                                        className="px-3 transition border rounded-lg border-white/10 text-slate-300 hover:bg-white/5"
                                        title="Discard result"
                                    >
                                        <RotateCcw
                                            size={15}
                                        />
                                    </button>

                                </div>

                            </div>
                        )}

                    </aside>

                </div>

            </main>

        </Layout>
    );
}