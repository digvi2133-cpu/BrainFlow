import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { connectSocket, disconnectSocket, socket } from "../lib/socket.js";
import { apiRequest } from "../lib/api.js";
function Dashboard() {
  const navigate = useNavigate();
    useEffect(() => {
    connectSocket();

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleConnectError = (error) => {
      console.error("Socket connection failed:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      disconnectSocket();
    };
  }, []);

  async function handleLogout() {
    try {
        await apiRequest("/auth/logout", {
            method: "POST",
        });
    } catch (error) {
        console.error("Logout failed:", error);
    } finally {
        disconnectSocket();
        navigate("/login", { replace: true });
    }
}

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 text-lg font-bold text-white rounded-xl bg-violet-500">
            B
          </div>
          <span className="text-xl font-semibold">BrainFlow</span>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium transition border rounded-lg border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
        >
          Log out
        </button>
      </header>

      <section className="px-6 py-12 mx-auto max-w-7xl">
        <div>
          <p className="text-sm font-semibold tracking-widest uppercase text-violet-300">
            Your workspace
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Welcome to BrainFlow
          </h1>

          <p className="max-w-2xl mt-3 text-slate-400">
            Your ideas, documents, and collaboration will come together here.
            Create a workspace and start organizing your work.
          </p>
        </div>

        <div className="grid gap-6 mt-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border rounded-2xl border-white/10 bg-slate-900/70">
            <div className="flex items-center justify-center w-12 h-12 text-2xl rounded-xl bg-violet-500/10">
              📁
            </div>
            <h2 className="mt-5 text-lg font-semibold text-white">
              Workspaces
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Organize projects, invite teammates, and keep related work
              together.
            </p>
            <button
              disabled
              className="px-4 py-2 mt-5 text-sm font-medium rounded-lg cursor-not-allowed bg-violet-500/20 text-violet-200"
            >
              Coming next
            </button>
          </div>

          <div className="p-6 border rounded-2xl border-white/10 bg-slate-900/70">
            <div className="flex items-center justify-center w-12 h-12 text-2xl rounded-xl bg-sky-500/10">
              📝
            </div>
            <h2 className="mt-5 text-lg font-semibold text-white">
              Documents
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Create and manage documents in one place, ready for contextual
              AI assistance.
            </p>
            <button
              disabled
              className="px-4 py-2 mt-5 text-sm font-medium rounded-lg cursor-not-allowed bg-sky-500/20 text-sky-200"
            >
              Coming next
            </button>
          </div>

          <div className="p-6 border rounded-2xl border-white/10 bg-slate-900/70">
            <div className="flex items-center justify-center w-12 h-12 text-2xl rounded-xl bg-emerald-500/10">
              📊
            </div>
            <h2 className="mt-5 text-lg font-semibold text-white">
              AI usage
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Track your AI activity and usage analytics as you work.
            </p>
            <button
              disabled
              className="px-4 py-2 mt-5 text-sm font-medium rounded-lg cursor-not-allowed bg-emerald-500/20 text-emerald-200"
            >
              Coming next
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;