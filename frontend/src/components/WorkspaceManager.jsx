import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api.js";

export default function WorkspaceManager({ workspace, currentUserId, onClose, onWorkspaceUpdated }) {
  const [name, setName] = useState(workspace?.name || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const ownerId = workspace?.owner?._id || workspace?.owner;
  const canManage = String(currentUserId || "") === String(ownerId || "");

  async function load() {
    if (!workspace?._id) return;
    try {
      setLoading(true); setError("");
      const data = await apiRequest(`/workspaces/${workspace._id}`);
      setMembers(Array.isArray(data?.members) ? data.members : []);
    } catch (err) { setError(err?.message || "Could not load members."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [workspace?._id]);

  async function saveWorkspace(e) {
    e.preventDefault();
    try {
      setSaving(true); setError(""); setMessage("");
      const data = await apiRequest(`/workspaces/${workspace._id}`, { method: "PATCH", body: { name, description } });
      onWorkspaceUpdated?.(data?.workspace || { ...workspace, name, description });
      setMessage("Workspace updated.");
    } catch (err) { setError(err?.message || "Could not update workspace."); }
    finally { setSaving(false); }
  }

  async function invite(e) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setSaving(true); setError(""); setMessage("");
      const data = await apiRequest(`/workspaces/${workspace._id}/invite`, { method: "POST", body: { email: email.trim().toLowerCase(), role } });
      setMessage(data?.message || "Member added."); setEmail(""); await load();
    } catch (err) { setError(err?.message || "Could not add member."); }
    finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><p className="text-sm font-semibold text-slate-900">Workspace settings</p><p className="text-[11px] text-slate-500">{workspace?.name}</p></div><button onClick={onClose} className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100">✕</button></header>
      <div className="grid gap-5 p-5 md:grid-cols-2">
        <form onSubmit={saveWorkspace} className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Workspace</h3>
          <input value={name} onChange={(e)=>setName(e.target.value)} disabled={!canManage} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50" placeholder="Workspace name" />
          <textarea value={description} onChange={(e)=>setDescription(e.target.value)} disabled={!canManage} className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50" placeholder="Description" />
          {canManage && <button disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40">{saving ? "Saving…" : "Save changes"}</button>}
        </form>
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Members</h3>
          {canManage && <form onSubmit={invite} className="space-y-2 rounded-xl border border-slate-200 p-3"><input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="member@email.com" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><div className="flex gap-2"><select value={role} onChange={(e)=>setRole(e.target.value)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="editor">Editor</option><option value="viewer">Viewer</option><option value="admin">Admin</option></select><button disabled={saving} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Add member</button></div></form>}
          <div className="space-y-2">{loading ? <p className="text-sm text-slate-400">Loading members…</p> : members.map((m)=><div key={m._id || m.user?._id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{m.user?.name || m.user?.email || "Member"}</p><p className="truncate text-[11px] text-slate-400">{m.user?.email}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">{m.role}</span></div>)}</div>
        </div>
      </div>
      {(message || error) && <div className={`mx-5 mb-5 rounded-xl p-3 text-xs ${error ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>{error || message}</div>}
    </section>
  </div>;
}
