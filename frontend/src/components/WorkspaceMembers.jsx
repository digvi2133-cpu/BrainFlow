import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api.js";

function getMemberId(member) {
    return member?.user?._id || member?.user?.id || member?._id || member?.id;
}

function getInitials(name, email) {
    const value = (name || email || "U").trim();
    const parts = value.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return value.slice(0, 2).toUpperCase();
}

function roleLabel(role) {
    if (role === "owner") return "Owner";
    if (role === "admin") return "Admin";
    if (role === "viewer") return "Viewer";
    return "Editor";
}

export default function WorkspaceMembers({ workspaceId, workspaceName }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [members, setMembers] = useState([]);
    const [membership, setMembership] = useState(null);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("editor");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const canInvite = ["owner", "admin"].includes(membership?.role);

    const visibleMembers = useMemo(() => {
        return Array.isArray(members) ? members : [];
    }, [members]);

    async function loadMembers() {
        if (!workspaceId) return;

        try {
            setLoading(true);
            setError("");

            const data = await apiRequest(`/workspaces/${workspaceId}`);

            setMembers(Array.isArray(data?.members) ? data.members : []);
            setMembership(data?.membership || null);
        } catch (loadError) {
            console.error("Failed to load workspace members:", loadError);
            setError(loadError?.message || "Failed to load members.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (open) {
            loadMembers();
        }
    }, [open, workspaceId]);

    async function handleInvite(event) {
        event.preventDefault();

        const cleanEmail = email.trim().toLowerCase();

        if (!workspaceId) {
            setError("Select a workspace first.");
            return;
        }

        if (!canInvite) {
            setError("Only workspace owners and admins can add members.");
            return;
        }

        if (!cleanEmail) {
            setError("Enter the member's email address.");
            return;
        }

        try {
            setInviting(true);
            setError("");
            setSuccess("");

            await apiRequest(`/workspaces/${workspaceId}/invite`, {
                method: "POST",
                body: {
                    email: cleanEmail,
                    role,
                },
            });

            setEmail("");
            setRole("editor");
            setSuccess("Member added successfully.");
            await loadMembers();
        } catch (inviteError) {
            console.error("Failed to add workspace member:", inviteError);
            setError(inviteError?.message || "Failed to add member.");
        } finally {
            setInviting(false);
        }
    }

    function closeDrawer() {
        setOpen(false);
        setError("");
        setSuccess("");
        setEmail("");
        setRole("editor");
    }

    if (!workspaceId) {
        return (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-violet-300">
                        ◎
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Workspace members</p>
                        <p className="mt-1 text-[11px] text-slate-600">Select a workspace to manage members.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/[0.05] blur-3xl" />

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/[0.07] text-lg text-violet-300">
                            ◎
                        </div>

                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                                Collaboration
                            </p>
                            <h3 className="mt-1 text-sm font-semibold text-white">
                                Workspace members
                            </h3>
                            <p className="mt-1 text-[10px] text-slate-600">
                                {workspaceName || "Current workspace"} · {members.length || "—"} member{members.length === 1 ? "" : "s"}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/15 bg-violet-500/[0.08] px-4 py-2.5 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/[0.14]"
                    >
                        <span>◎</span>
                        Members
                        <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-violet-100">
                            {members.length}
                        </span>
                    </button>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 z-[100]">
                    <button
                        type="button"
                        aria-label="Close members panel"
                        onClick={closeDrawer}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-[#0a0a10] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                                    Workspace
                                </p>
                                <h2 className="mt-1 text-base font-semibold text-white">Members</h2>
                                <p className="mt-1 max-w-[270px] truncate text-[10px] text-slate-600">
                                    {workspaceName || "Current workspace"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeDrawer}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                                <div className="mb-4">
                                    <p className="text-xs font-semibold text-white">Add a member</p>
                                    <p className="mt-1 text-[10px] leading-5 text-slate-600">
                                        The person must already have a BrainFlow account with this email address.
                                    </p>
                                </div>

                                {canInvite ? (
                                    <form onSubmit={handleInvite} className="space-y-3">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            placeholder="member@example.com"
                                            autoComplete="email"
                                            className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-700 focus:border-violet-400/30"
                                        />

                                        <div className="flex gap-2">
                                            <select
                                                value={role}
                                                onChange={(event) => setRole(event.target.value)}
                                                className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-[#11111a] px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-violet-400/30"
                                            >
                                                <option value="editor">Editor</option>
                                                <option value="viewer">Viewer</option>
                                            </select>

                                            <button
                                                type="submit"
                                                disabled={inviting}
                                                className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {inviting ? "Adding..." : "Add member"}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-3 text-[10px] leading-5 text-amber-200/70">
                                        You are a {roleLabel(membership?.role).toLowerCase()}. Only workspace owners and admins can add members.
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-3 rounded-xl border border-red-400/10 bg-red-400/[0.04] px-3 py-2.5 text-[10px] leading-5 text-red-300">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="mt-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-3 py-2.5 text-[10px] leading-5 text-emerald-300">
                                        {success}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                        Current members
                                    </p>
                                    <button
                                        type="button"
                                        onClick={loadMembers}
                                        disabled={loading}
                                        className="text-[10px] font-medium text-violet-300 hover:text-violet-200 disabled:opacity-50"
                                    >
                                        {loading ? "Refreshing..." : "Refresh"}
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map((item) => (
                                            <div key={item} className="h-14 animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.025]" />
                                        ))}
                                    </div>
                                ) : visibleMembers.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-white/[0.08] p-5 text-center text-[10px] text-slate-600">
                                        No members found.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {visibleMembers.map((member) => {
                                            const memberUser = member?.user || {};
                                            const memberId = getMemberId(member);
                                            const name = memberUser?.name || "BrainFlow user";
                                            const memberEmail = memberUser?.email || "";
                                            const memberRole = member?.role || "editor";

                                            return (
                                                <div key={memberId || memberEmail || name} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-bold text-white">
                                                        {getInitials(name, memberEmail)}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium truncate text-slate-200">{name}</p>
                                                        <p className="truncate text-[10px] text-slate-600">{memberEmail}</p>
                                                    </div>

                                                    <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-[9px] font-medium text-slate-400">
                                                        {roleLabel(memberRole)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}
