import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import WorkspaceChat from "../components/WorkspaceChat.jsx";
import WorkspaceManager from "../components/WorkspaceManager.jsx";

import {
    connectSocket,
    disconnectSocket,
    socket,
} from "../lib/socket.js";

import {
    apiRequest,
} from "../lib/api.js";


/* ============================================================================
   CONSTANTS
============================================================================ */

const DEFAULT_WORKSPACE_NAME = "My Workspace";

const DEFAULT_WORKSPACE_DESCRIPTION =
    "My BrainFlow workspace";


/* ============================================================================
   SMALL UI COMPONENTS
============================================================================ */

function BrainMark() {
    return (
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-500/20 to-indigo-500/10 shadow-[0_0_35px_rgba(139,92,246,0.18)]">
            <div className="absolute rounded-lg inset-1 bg-gradient-to-br from-violet-400/10 to-transparent" />

            <span className="relative text-sm font-bold text-violet-200">
                B
            </span>
        </div>
    );
}


function AmbientBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -left-56 -top-56 h-[650px] w-[650px] rounded-full bg-violet-600/[0.09] blur-[150px]" />

            <div className="absolute -right-56 top-1/4 h-[650px] w-[650px] rounded-full bg-indigo-600/[0.08] blur-[150px]" />

            <div className="absolute bottom-[-350px] left-1/3 h-[600px] w-[600px] rounded-full bg-fuchsia-600/[0.045] blur-[150px]" />

            <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>
    );
}


function SidebarButton({
    icon,
    label,
    active = false,
    onClick,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                active
                    ? "border border-white/[0.06] bg-white/[0.055] text-white"
                    : "text-slate-500 hover:bg-white/[0.035] hover:text-slate-200"
            }`}
        >
            <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${
                    active
                        ? "bg-violet-500/10 text-violet-300"
                        : "text-slate-600 group-hover:text-slate-300"
                }`}
            >
                {icon}
            </span>

            <span className="flex-1">
                {label}
            </span>

            {active && (
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />
            )}
        </button>
    );
}


function MobileNavButton({
    icon,
    label,
    active = false,
    onClick,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] transition ${
                active
                    ? "bg-violet-500/10 text-violet-300"
                    : "text-slate-600 hover:text-slate-300"
            }`}
        >
            <span className="text-base">
                {icon}
            </span>

            <span>{label}</span>
        </button>
    );
}


function WorkspaceCard({
    workspace,
    selected,
    onClick,
}) {
    const initial =
        workspace?.name
            ?.trim()
            ?.charAt(0)
            ?.toUpperCase() || "B";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                selected
                    ? "border-violet-400/15 bg-violet-500/[0.07]"
                    : "border-white/[0.06] bg-white/[0.025] hover:border-white/[0.10] hover:bg-white/[0.045]"
            }`}
        >
           <div className="relative flex items-center justify-center flex-shrink-0 overflow-hidden text-white shadow-lg h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-violet-600/10">
    <div className="absolute inset-0 transition opacity-0 bg-white/10 group-hover:opacity-100" />

    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="relative w-5 h-5"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3h7.086a2.5 2.5 0 0 1 1.768.732l3.914 3.914A2.5 2.5 0 0 1 20 9.414V18.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-13Z"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 3v5h5M8 12h8M8 16h5"
        />
    </svg>
</div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-slate-200">
                    {workspace.name ||
                        DEFAULT_WORKSPACE_NAME}
                </p>

                <p className="mt-0.5 truncate text-[10px] text-slate-600">
                    {workspace.description ||
                        "BrainFlow workspace"}
                </p>
            </div>

            {selected && (
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />
            )}
        </button>
    );
}


function StatCard({
    icon,
    label,
    value,
    description,
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/15 hover:bg-white/[0.04]">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/[0.04] blur-2xl transition group-hover:bg-violet-500/[0.08]" />

            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-600">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                        {value}
                    </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/[0.07] text-violet-300">
                    {icon}
                </div>
            </div>

            <p className="relative mt-3 text-[10px] text-slate-600">
                {description}
            </p>
        </div>
    );
}


function DocumentCard({
    document,
    onClick,
}) {
    const updatedText = document?.updatedAt
        ? new Date(
              document.updatedAt
          ).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "Recently";

    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative min-h-[190px] overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-violet-400/20 hover:bg-white/[0.045] hover:shadow-[0_20px_50px_rgba(0,0,0,0.22)]"
        >
            <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-violet-500/[0.06] blur-3xl opacity-0 transition duration-500 group-hover:opacity-100" />

            <div className="absolute bottom-0 left-0 w-0 h-px transition-all duration-500 bg-gradient-to-r from-violet-400 to-indigo-400 group-hover:w-full" />

            <div className="relative flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.035] text-violet-300 transition group-hover:border-violet-400/15 group-hover:bg-violet-500/[0.08]">
                    ▤
                </div>

                <span className="transition text-slate-700 group-hover:translate-x-1 group-hover:text-violet-300">
                    →
                </span>
            </div>

            <div className="relative mt-8">
                <h3 className="text-sm font-semibold truncate text-slate-100">
                    {document.title ||
                        "Untitled Document"}
                </h3>

                <p className="mt-2 text-[10px] text-slate-600">
                    Updated {updatedText}
                </p>
            </div>

            <div className="absolute flex items-center justify-between bottom-5 left-5 right-5">
                <span className="text-[9px] uppercase tracking-[0.15em] text-slate-700">
                    Document
                </span>

                <span className="text-[10px] text-slate-700 transition group-hover:text-violet-400">
                    Open
                </span>
            </div>
        </button>
    );
}


function DocumentSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="h-[190px] animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.025]"
                />
            ))}
        </div>
    );
}


function EmptyDocuments({
    disabled,
    onCreate,
}) {
    return (
        <div className="relative flex min-h-[340px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.012] px-6 text-center">
            <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.07] blur-3xl" />

            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-2xl text-violet-300 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                ◇
            </div>

            <h3 className="relative mt-5 text-sm font-semibold text-white">
                Your workspace is empty
            </h3>

            <p className="relative max-w-sm mt-2 text-xs leading-6 text-slate-600">
                Create your first document and start turning
                ideas into meaningful work.
            </p>

            <button
                type="button"
                disabled={disabled}
                onClick={onCreate}
                className="relative mt-6 rounded-xl border border-violet-400/15 bg-violet-500/[0.08] px-4 py-2.5 text-xs font-semibold text-violet-200 transition hover:border-violet-400/25 hover:bg-violet-500/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {disabled
                    ? "Creating..."
                    : "Create your first document"}
            </button>
        </div>
    );
}


function ErrorBanner({
    message,
    onRetry,
}) {
    if (!message) {
        return null;
    }

    return (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-400/10 bg-red-500/[0.05] px-4 py-3 text-xs text-red-300 sm:flex-row sm:items-center sm:justify-between">
            <span>{message}</span>

            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="self-start rounded-lg border border-red-400/10 bg-red-400/[0.05] px-3 py-1.5 text-[10px] font-semibold text-red-200 transition hover:bg-red-400/[0.10] sm:self-auto"
                >
                    Retry
                </button>
            )}
        </div>
    );
}


function MobileHeader({
    selectedWorkspace,
    socketConnected,
    onOpenChat,
    onLogout,
}) {
    return (
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07070c]/85 backdrop-blur-2xl lg:hidden">
            <div className="flex h-[68px] items-center justify-between px-4">
                <div className="flex items-center min-w-0 gap-3">
                    <BrainMark />

                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                            {selectedWorkspace?.name ||
                                "BrainFlow"}
                        </p>

                        <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                    socketConnected
                                        ? "bg-emerald-400"
                                        : "bg-slate-600"
                                }`}
                            />

                            <span className="text-[9px] text-slate-600">
                                {socketConnected
                                    ? "Connected"
                                    : "Offline"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onOpenChat}
                        disabled={!selectedWorkspace}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/[0.07] text-violet-300 transition hover:bg-violet-500/[0.12] disabled:opacity-40"
                    >
                        ✦
                    </button>

                    <button
                        type="button"
                        onClick={onLogout}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white/[0.04] hover:text-slate-300"
                    >
                        ↪
                    </button>
                </div>
            </div>
        </header>
    );
}


/* ============================================================================
   DASHBOARD
============================================================================ */

export default function Dashboard() {
    const navigate = useNavigate();

    const [
        workspaces,
        setWorkspaces,
    ] = useState([]);

    const [
        selectedWorkspace,
        setSelectedWorkspace,
    ] = useState(null);

    const [
        documents,
        setDocuments,
    ] = useState([]);

    const [
        loadingWorkspaces,
        setLoadingWorkspaces,
    ] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [
        loadingDocuments,
        setLoadingDocuments,
    ] = useState(false);

    const [
        creatingWorkspace,
        setCreatingWorkspace,
    ] = useState(false);

    const [
        creatingDocument,
        setCreatingDocument,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        chatOpen,
        setChatOpen,
    ] = useState(false);

    const [
        socketConnected,
        setSocketConnected,
    ] = useState(
        socket.connected
    );

    const [
        searchQuery,
        setSearchQuery,
    ] = useState("");

    const [
        mobileWorkspaceOpen,
        setMobileWorkspaceOpen,
    ] = useState(false);

    const [
        workspaceManagerOpen,
        setWorkspaceManagerOpen,
    ] = useState(false);


    /* ========================================================================
       SOCKET
    ======================================================================== */

    useEffect(() => {
        const handleConnect = () => {
            setSocketConnected(true);

            console.log(
                "Dashboard socket connected:",
                socket.id
            );
        };

        const handleDisconnect = () => {
            setSocketConnected(false);
        };

        const handleConnectError = (
            socketError
        ) => {
            setSocketConnected(false);

            console.error(
                "Dashboard socket connection failed:",
                socketError.message
            );
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

        if (!socket.connected) {
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

            disconnectSocket();
        };
    }, []);


    /* ========================================================================
       LOAD WORKSPACES
    ======================================================================== */

    useEffect(() => {
        loadWorkspaces();
    }, []);
    useEffect(() => {
    loadCurrentUser();
}, []);

async function loadCurrentUser() {
    try {
        const data = await apiRequest("/auth/me");
        console.log("Current user:", data);
        setCurrentUser(data?.user || null);
    } catch (error) {
        console.error("Failed to load current user:", error);
    }
}

    /* ========================================================================
       LOAD DOCUMENTS WHEN WORKSPACE CHANGES
    ======================================================================== */

    useEffect(() => {
        if (!selectedWorkspace?._id) {
            setDocuments([]);
            return;
        }

        loadDocuments(
            selectedWorkspace._id
        );
    }, [
        selectedWorkspace?._id,
    ]);


    /* ========================================================================
       WORKSPACE DATA
    ======================================================================== */

    async function loadWorkspaces() {
        try {
            setLoadingWorkspaces(true);
            setError("");

            const data =
                await apiRequest(
                    "/workspaces"
                );

            const workspaceList =
                Array.isArray(
                    data?.workspaces
                )
                    ? data.workspaces
                    : [];

            setWorkspaces(
                workspaceList
            );

            if (
                workspaceList.length > 0
            ) {
                setSelectedWorkspace(
                    workspaceList[0]
                );

                return;
            }

            await createInitialWorkspace();
        } catch (
            workspaceError
        ) {
            console.error(
                "Failed to load workspaces:",
                workspaceError
            );

            setError(
                workspaceError.message ||
                    "Failed to load workspaces."
            );
        } finally {
            setLoadingWorkspaces(false);
        }
    }


    async function createInitialWorkspace() {
        try {
            setCreatingWorkspace(true);
            setError("");

            const data =
                await apiRequest(
                    "/workspaces",
                    {
                        method: "POST",
                        body: {
                            name:
                                DEFAULT_WORKSPACE_NAME,
                            description:
                                DEFAULT_WORKSPACE_DESCRIPTION,
                        },
                    }
                );

            const newWorkspace =
                data?.workspace;

            if (!newWorkspace) {
                throw new Error(
                    "Workspace was not returned by the server."
                );
            }

            setWorkspaces([
                newWorkspace,
            ]);

            setSelectedWorkspace(
                newWorkspace
            );
        } catch (
            workspaceError
        ) {
            console.error(
                "Failed to create workspace:",
                workspaceError
            );

            setError(
                workspaceError.message ||
                    "Failed to create workspace."
            );
        } finally {
            setCreatingWorkspace(false);
        }
    }


    function handleSelectWorkspace(
        workspace
    ) {
        setSelectedWorkspace(
            workspace
        );

        setMobileWorkspaceOpen(
            false
        );

        setError("");

        setSearchQuery("");
    }


    /* ========================================================================
       DOCUMENT DATA
    ======================================================================== */

   async function loadDocuments(workspaceId) {
    try {
        setLoadingDocuments(true);
        setError("");

        const data = await apiRequest(
            `/workspaces/${workspaceId}`
        );

        setDocuments(
            Array.isArray(data?.documents)
                ? data.documents
                : []
        );
    } catch (documentError) {
        console.error(
            "Failed to load documents:",
            documentError
        );

        setError(
            documentError.message ||
                "Failed to load documents."
        );
    } finally {
        setLoadingDocuments(false);
    }
}


    async function handleCreateDocument() {
        if (
            !selectedWorkspace?._id
        ) {
            setError(
                "No workspace is selected."
            );

            return;
        }

        try {
            setCreatingDocument(true);
            setError("");

           const data =
    await apiRequest(
        "/workspaces/documents",
        {
            method: "POST",
            body: {
                workspaceId:
                    selectedWorkspace._id,

                title:
                    "Untitled Document",
            },
        }
    );
            const newDocument =
                data?.document;

            if (
                !newDocument?._id
            ) {
                throw new Error(
                    "Document was created but no document ID was returned."
                );
            }

            setDocuments(
                (
                    currentDocuments
                ) => [
                    newDocument,
                    ...currentDocuments,
                ]
            );

            navigate(
                `/documents/${newDocument._id}`
            );
        } catch (
            documentError
        ) {
            console.error(
                "Failed to create document:",
                documentError
            );

            setError(
                documentError.message ||
                    "Failed to create document."
            );
        } finally {
            setCreatingDocument(false);
        }
    }


    /* ========================================================================
       LOGOUT
    ======================================================================== */

    async function handleLogout() {
        try {
            await apiRequest(
                "/auth/logout",
                {
                    method: "POST",
                }
            );
        } catch (
            logoutError
        ) {
            console.error(
                "Logout failed:",
                logoutError
            );
        } finally {
            disconnectSocket();

            navigate(
                "/login",
                {
                    replace: true,
                }
            );
        }
    }


    /* ========================================================================
       WORKSPACE MANAGER
    ======================================================================== */

    function openWorkspaceManager() {
        if (!selectedWorkspace) {
            setError("No workspace is selected.");
            return;
        }

        setWorkspaceManagerOpen(true);
    }


    function handleWorkspaceUpdated(updatedWorkspace) {
        if (!updatedWorkspace?._id) {
            return;
        }

        setSelectedWorkspace(updatedWorkspace);

        setWorkspaces((currentWorkspaces) =>
            currentWorkspaces.map((workspace) =>
                workspace._id === updatedWorkspace._id
                    ? updatedWorkspace
                    : workspace
            )
        );
    }


    /* ========================================================================
       SEARCH
    ======================================================================== */

    const filteredDocuments =
        useMemo(() => {
            const query =
                searchQuery
                    .trim()
                    .toLowerCase();

            if (!query) {
                return documents;
            }

            return documents.filter(
                (document) =>
                    (
                        document.title ||
                        ""
                    )
                        .toLowerCase()
                        .includes(query)
            );
        }, [
            documents,
            searchQuery,
        ]);


    /* ========================================================================
       SCROLL HELPERS
    ======================================================================== */

    function scrollToDocuments() {
        document
            .querySelector(
                "#documents"
            )
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
    }


    /* ========================================================================
       RENDER
    ======================================================================== */

    return (
        <main className="min-h-screen overflow-x-hidden bg-[#07070c] text-slate-100">
            <AmbientBackground />

            <div className="relative flex min-h-screen">
                {/* ============================================================
                    DESKTOP SIDEBAR
                ============================================================ */}

                <aside className="sticky top-0 hidden h-screen w-[255px] flex-shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.012] backdrop-blur-2xl lg:flex">
                    {/* BRAND */}
                    <div className="flex items-center gap-3 px-6 py-6">
                        <BrainMark />

                        <div>
                            <p className="text-[15px] font-semibold tracking-tight text-white">
                                BrainFlow
                            </p>

                            <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-slate-700">
                                Intelligent workspace
                            </p>
                        </div>
                    </div>


                    {/* WORKSPACES */}
                    <div className="px-4">
                        <div className="flex items-center justify-between px-3 mb-2">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                                Workspaces
                            </p>

                            <span className="text-[9px] text-slate-700">
                                {workspaces.length}
                            </span>
                        </div>

                        {loadingWorkspaces ||
                        creatingWorkspace ? (
                            <div className="h-[58px] animate-pulse rounded-xl bg-white/[0.035]" />
                        ) : (
                            <div className="space-y-2">
                                {workspaces.map(
                                    (
                                        workspace
                                    ) => (
                                        <WorkspaceCard
                                            key={
                                                workspace._id
                                            }
                                            workspace={
                                                workspace
                                            }
                                            selected={
                                                selectedWorkspace?._id ===
                                                workspace._id
                                            }
                                            onClick={() =>
                                                handleSelectWorkspace(
                                                    workspace
                                                )
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </div>


                    {/* NAVIGATION */}
                    <nav className="px-4 mt-8">
                        <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                            Workspace
                        </p>

                        <SidebarButton
                            icon="⌂"
                            label="Overview"
                            active
                        />

                        <SidebarButton
                            icon="▤"
                            label="Documents"
                            onClick={
                                scrollToDocuments
                            }
                        />

                        <SidebarButton
                            icon="✦"
                            label="Ask BrainFlow"
                            onClick={() =>
                                selectedWorkspace &&
                                setChatOpen(
                                    true
                                )
                            }
                        />

                       <SidebarButton
    icon="◎"
    label="Members"
    onClick={openWorkspaceManager}
/>

<SidebarButton
    icon="⚙"
    label="Settings"
    onClick={openWorkspaceManager}
/>

                        <SidebarButton
                            icon="◌"
                            label="Activity"
                        />
                    </nav>


                    {/* AI CARD */}
                    <div className="mx-4 mt-6 rounded-2xl border border-violet-400/10 bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.03] p-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 text-violet-300">
                            ✦
                        </div>

                        <p className="mt-3 text-xs font-semibold text-slate-200">
                            Workspace AI
                        </p>

                        <p className="mt-1 text-[10px] leading-5 text-slate-600">
                            Ask questions about your workspace
                            knowledge.
                        </p>

                        <button
                            type="button"
                            disabled={
                                !selectedWorkspace
                            }
                            onClick={() =>
                                setChatOpen(
                                    true
                                )
                            }
                            className="mt-3 w-full rounded-lg border border-violet-400/10 bg-violet-500/[0.07] px-3 py-2 text-[10px] font-semibold text-violet-300 transition hover:bg-violet-500/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Ask BrainFlow
                        </button>
                    </div>


                    {/* BOTTOM */}
                    <div className="px-4 pb-5 mt-auto">
                        <SidebarButton
                            icon="⚙"
                            label="Settings"
                            onClick={openWorkspaceManager}
                        />

                        <button
                            type="button"
                            onClick={
                                handleLogout
                            }
                            className="group mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-white/[0.035] hover:text-slate-200"
                        >
                            <span className="flex items-center justify-center rounded-lg h-7 w-7 text-slate-700 group-hover:text-slate-300">
                                ↪
                            </span>

                            <span>
                                Log out
                            </span>
                        </button>
                    </div>
                </aside>


                {/* ============================================================
                    MAIN COLUMN
                ============================================================ */}

                <section className="flex-1 min-w-0">
                    {/* MOBILE HEADER */}
                    <MobileHeader
                        selectedWorkspace={
                            selectedWorkspace
                        }
                        socketConnected={
                            socketConnected
                        }
                        onOpenChat={() =>
                            setChatOpen(
                                true
                            )
                        }
                        onLogout={
                            handleLogout
                        }
                    />


                    {/* ========================================================
                        DESKTOP TOPBAR
                    ======================================================== */}

                    <header className="sticky top-0 z-30 hidden h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#07070c]/80 px-5 backdrop-blur-2xl sm:px-8 lg:flex">
                        <div className="flex items-center gap-3">
                            <div className="flex w-[340px] items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5">
                                <span className="text-sm text-slate-700">
                                    ⌕
                                </span>

                                <input
                                    value={
                                        searchQuery
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearchQuery(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Search documents..."
                                    className="flex-1 min-w-0 text-xs bg-transparent outline-none text-slate-300 placeholder:text-slate-700"
                                />

                                <span className="rounded-md border border-white/[0.07] px-1.5 py-0.5 text-[9px] text-slate-700">
                                    ⌘ K
                                </span>
                            </div>
                        </div>


                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={
                                    !selectedWorkspace
                                }
                                onClick={() =>
                                    setChatOpen(
                                        true
                                    )
                                }
                                className="flex items-center gap-2 rounded-xl border border-violet-400/15 bg-violet-500/[0.07] px-4 py-2.5 text-xs font-semibold text-violet-300 transition hover:border-violet-400/25 hover:bg-violet-500/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <span>
                                    ✦
                                </span>

                                Ask BrainFlow
                            </button>

                            <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                        socketConnected
                                            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                            : "bg-slate-600"
                                    }`}
                                />

                                <span className="text-[10px] text-slate-600">
                                    {socketConnected
                                        ? "Connected"
                                        : "Offline"}
                                </span>
                            </div>

                            <button
                                type="button"
                                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200"
                            >
                                ♢

                                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-400" />
                            </button>

                            <div className="h-6 w-px bg-white/[0.07]" />

                            <div className="flex items-center justify-center text-xs font-bold text-white h-9 w-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800">
                                D
                            </div>
                        </div>
                    </header>


                    {/* ========================================================
                        MOBILE WORKSPACE PICKER
                    ======================================================== */}

                    <div className="border-b border-white/[0.05] px-4 py-3 lg:hidden">
                        <button
                            type="button"
                            onClick={() =>
                                setMobileWorkspaceOpen(
                                    (
                                        value
                                    ) =>
                                        !value
                                )
                            }
                            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left"
                        >
                            <div className="flex items-center justify-center w-8 h-8 text-xs font-bold rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                                {selectedWorkspace?.name
                                    ?.charAt(
                                        0
                                    )
                                    ?.toUpperCase() ||
                                    "B"}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate text-slate-200">
                                    {selectedWorkspace?.name ||
                                        "Select workspace"}
                                </p>

                                <p className="text-[9px] text-slate-600">
                                    Current workspace
                                </p>
                            </div>

                            <span className="text-slate-600">
                                {mobileWorkspaceOpen
                                    ? "⌃"
                                    : "⌄"}
                            </span>
                        </button>

                        {mobileWorkspaceOpen && (
                            <div className="mt-2 space-y-2">
                                {workspaces.map(
                                    (
                                        workspace
                                    ) => (
                                        <WorkspaceCard
                                            key={
                                                workspace._id
                                            }
                                            workspace={
                                                workspace
                                            }
                                            selected={
                                                selectedWorkspace?._id ===
                                                workspace._id
                                            }
                                            onClick={() =>
                                                handleSelectWorkspace(
                                                    workspace
                                                )
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </div>


                    {/* ========================================================
                        PAGE CONTENT
                    ======================================================== */}

                    <div className="mx-auto max-w-[1450px] px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:py-10 lg:pb-10">
                        <ErrorBanner
                            message={error}
                            onRetry={() => {
                                if (
                                    selectedWorkspace?._id
                                ) {
                                    loadDocuments(
                                        selectedWorkspace._id
                                    );
                                } else {
                                    loadWorkspaces();
                                }
                            }}
                        />


                        {/* ====================================================
                            HERO
                        ==================================================== */}

                        <section className="group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-white/[0.055] via-white/[0.025] to-violet-500/[0.045] shadow-[0_30px_100px_rgba(0,0,0,0.18)]">
                            <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-violet-500/[0.08] blur-3xl transition duration-700 group-hover:bg-violet-500/[0.12]" />

                            <div className="absolute bottom-[-100px] right-1/3 h-52 w-52 rounded-full bg-indigo-500/[0.05] blur-3xl" />

                            <div className="relative grid lg:grid-cols-[1fr_auto]">
                                <div className="px-6 py-8 sm:px-9 sm:py-10 lg:py-12">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/10 bg-violet-500/[0.07] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.7)]" />

                                        {selectedWorkspace?.name ||
                                            "Your workspace"}
                                    </div>

                                   <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl lg:text-[44px]">
    Welcome back.
</h1>

                                    <p className="max-w-xl mt-4 text-sm leading-7 text-slate-500">
                                        Your ideas, documents and
                                        collaboration, all flowing through
                                        one intelligent workspace.
                                    </p>

                                    <div className="flex flex-wrap gap-3 mt-7">
                                        <button
                                            type="button"
                                            disabled={
                                                !selectedWorkspace ||
                                                creatingDocument ||
                                                creatingWorkspace
                                            }
                                            onClick={
                                                handleCreateDocument
                                            }
                                            className="group/button inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(124,58,237,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <span>
                                                {creatingDocument
                                                    ? "Creating..."
                                                    : "＋ Create document"}
                                            </span>

                                            {!creatingDocument && (
                                                <span className="transition group-hover/button:translate-x-0.5">
                                                    →
                                                </span>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                !selectedWorkspace
                                            }
                                            onClick={() =>
                                                setChatOpen(
                                                    true
                                                )
                                            }
                                            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-5 py-3 text-xs font-semibold text-slate-300 transition hover:border-violet-400/15 hover:bg-violet-500/[0.06] hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <span>
                                                ✦
                                            </span>

                                            Ask BrainFlow
                                        </button>
                                    </div>
                                </div>


                                {/* HERO VISUAL */}
                                <div className="relative hidden min-h-[280px] w-[340px] items-center justify-center overflow-hidden lg:flex">
                                    <div className="absolute h-48 w-48 rounded-full border border-violet-400/10 bg-violet-500/[0.025] shadow-[0_0_100px_rgba(139,92,246,0.08)]" />

                                    <div className="absolute h-32 w-32 rounded-full border border-indigo-400/10 bg-indigo-500/[0.025]" />

                                    <div className="absolute h-20 w-20 rounded-2xl border border-violet-400/20 bg-violet-500/[0.08] shadow-[0_0_50px_rgba(139,92,246,0.18)] [transform:perspective(600px)_rotateX(18deg)_rotateY(-18deg)]">
                                        <div className="flex items-center justify-center h-full text-xl font-bold text-violet-200">
                                            B
                                        </div>
                                    </div>

                                    <div className="absolute left-16 top-16 h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.8)]" />

                                    <div className="absolute right-20 top-24 h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)]" />

                                    <div className="absolute bottom-20 left-24 h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.8)]" />
                                </div>
                            </div>
                        </section>


                        {/* ====================================================
                            STATS
                        ==================================================== */}

                        <section className="grid gap-4 mt-6 sm:grid-cols-3">
                            <StatCard
                                icon="▤"
                                label="Documents"
                                value={
                                    loadingDocuments
                                        ? "—"
                                        : documents.length
                                }
                                description={
                                    documents.length ===
                                    0
                                        ? "Ready for your first idea"
                                        : "In the current workspace"
                                }
                            />

                            <StatCard
                                icon="◎"
                                label="Workspaces"
                                value={
                                    workspaces.length
                                }
                                description="Spaces available to you"
                            />

                            <StatCard
                                icon="✦"
                                label="AI actions"
                                value="0"
                                description="Analytics layer comes next"
                            />
                        </section>


                        {/* ====================================================
                            DOCUMENTS
                        ==================================================== */}

                        <section
                            id="documents"
                            className="mt-9 scroll-mt-24"
                        >
                            <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                                        Workspace
                                    </p>

                                    <div className="flex items-center gap-3 mt-1">
                                        <h2 className="text-xl font-semibold tracking-tight text-white">
                                            Recent documents
                                        </h2>

                                        <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[9px] text-slate-600">
                                            {
                                                documents.length
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 sm:hidden">
                                        <span className="text-slate-700">
                                            ⌕
                                        </span>

                                        <input
                                            value={
                                                searchQuery
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setSearchQuery(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="Search..."
                                            className="w-28 bg-transparent text-[10px] text-slate-300 outline-none placeholder:text-slate-700"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        disabled={
                                            !selectedWorkspace ||
                                            creatingDocument
                                        }
                                        onClick={
                                            handleCreateDocument
                                        }
                                        className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[10px] font-semibold text-slate-300 transition hover:border-violet-400/15 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        + New
                                    </button>
                                </div>
                            </div>


                            {/* SEARCH RESULT STATE */}
                            {!loadingDocuments &&
                            searchQuery.trim() &&
                            filteredDocuments.length ===
                                0 ? (
                                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.012] px-6 py-14 text-center">
                                    <div className="text-xl text-slate-700">
                                        ⌕
                                    </div>

                                    <p className="mt-3 text-xs font-semibold text-slate-400">
                                        No matching documents
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-700">
                                        Try a different document
                                        title.
                                    </p>
                                </div>
                            ) : loadingDocuments ? (
                                <DocumentSkeleton />
                            ) : filteredDocuments.length ===
                              0 ? (
                                <EmptyDocuments
                                    disabled={
                                        !selectedWorkspace ||
                                        creatingDocument
                                    }
                                    onCreate={
                                        handleCreateDocument
                                    }
                                />
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {filteredDocuments.map(
                                        (
                                            document
                                        ) => (
                                            <DocumentCard
                                                key={
                                                    document._id
                                                }
                                                document={
                                                    document
                                                }
                                                onClick={() =>
                                                    navigate(
                                                        `/documents/${document._id}`
                                                    )
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            )}
                        </section>


                        {/* ====================================================
                            LOWER PRODUCT AREA
                        ==================================================== */}

                        <section className="mt-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                            {/* KNOWLEDGE CARD */}
                            <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/[0.05] blur-3xl" />

                                <div className="relative flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                                            BrainFlow loop
                                        </p>

                                        <h3 className="mt-2 text-lg font-semibold text-white">
                                            Store knowledge → understand
                                            knowledge → take action
                                        </h3>

                                        <p className="max-w-xl mt-3 text-xs leading-6 text-slate-600">
                                            Your workspace is becoming a
                                            connected layer for documents,
                                            contextual AI, collaboration and
                                            future actions.
                                        </p>
                                    </div>

                                    <div className="hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/[0.06] text-violet-300 sm:flex">
                                        ✦
                                    </div>
                                </div>

                                <div className="relative grid gap-2 mt-6 sm:grid-cols-3">
                                    {[
                                        [
                                            "01",
                                            "Knowledge",
                                        ],
                                        [
                                            "02",
                                            "Intelligence",
                                        ],
                                        [
                                            "03",
                                            "Action",
                                        ],
                                    ].map(
                                        ([
                                            number,
                                            label,
                                        ]) => (
                                            <div
                                                key={
                                                    number
                                                }
                                                className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
                                            >
                                                <span className="text-[9px] font-semibold text-violet-400">
                                                    {
                                                        number
                                                    }
                                                </span>

                                                <p className="mt-2 text-xs font-medium text-slate-300">
                                                    {
                                                        label
                                                    }
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>


                            {/* AI CARD */}
                            <div className="relative overflow-hidden rounded-2xl border border-violet-400/10 bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.025] p-6">
                                <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-indigo-500/[0.08] blur-3xl" />

                                <div className="relative">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/[0.08] text-violet-300">
                                        ✦
                                    </div>

                                    <h3 className="mt-5 text-sm font-semibold text-white">
                                        Ask your workspace
                                    </h3>

                                    <p className="mt-2 text-[11px] leading-5 text-slate-600">
                                        BrainFlow AI can search your
                                        workspace documents and answer with
                                        source-aware context.
                                    </p>

                                    <button
                                        type="button"
                                        disabled={
                                            !selectedWorkspace
                                        }
                                        onClick={() =>
                                            setChatOpen(
                                                true
                                            )
                                        }
                                        className="relative mt-5 w-full rounded-xl border border-violet-400/15 bg-violet-500/[0.08] px-4 py-2.5 text-[10px] font-semibold text-violet-200 transition hover:bg-violet-500/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Open workspace AI →
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </section>
            </div>


            {/* ================================================================
                MOBILE BOTTOM NAV
            ================================================================ */}

            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#08080d]/90 px-2 pb-2 pt-1 backdrop-blur-2xl lg:hidden">
                <div className="flex items-center justify-around max-w-md mx-auto">
                    <MobileNavButton
                        icon="⌂"
                        label="Home"
                        active
                    />

                    <MobileNavButton
                        icon="▤"
                        label="Docs"
                        onClick={
                            scrollToDocuments
                        }
                    />

                    <MobileNavButton
                        icon="✦"
                        label="AI"
                        onClick={() =>
                            selectedWorkspace &&
                            setChatOpen(
                                true
                            )
                        }
                    />

                    <MobileNavButton
                        icon="◎"
                        label="Team"
                        onClick={openWorkspaceManager}
                    />

                    <MobileNavButton
                        icon="⚙"
                        label="Settings"
                        onClick={openWorkspaceManager}
                    />
                </div>
            </div>


           {/* ================================================================
    WORKSPACE CHAT
================================================================ */}

{chatOpen && selectedWorkspace && (
    <WorkspaceChat
        workspace={selectedWorkspace}
        documents={documents}
        onClose={() => setChatOpen(false)}
    />
)}

            {/* ================================================================
                WORKSPACE MANAGER
            ================================================================ */}

            {workspaceManagerOpen &&
                selectedWorkspace && (
                    <WorkspaceManager
                        workspace={selectedWorkspace}
                        currentUserId={selectedWorkspace?.owner}
                        onClose={() =>
                            setWorkspaceManagerOpen(false)
                        }
                        onWorkspaceUpdated={
                            handleWorkspaceUpdated
                        }
                    />
                )}
        </main>
    );
}