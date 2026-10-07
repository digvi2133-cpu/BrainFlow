import { useState } from "react";
import { apiRequest } from "../lib/api.js";

export default function WorkspaceChat({
    workspace,
    documents = [],
    onClose,
}) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const workspaceName =
        workspace?.name || "Current workspace";

    async function sendMessage(event) {
  event?.preventDefault();

  const cleanMessage = message.trim();

  if (!cleanMessage || loading) return;

  setMessages((items) => [
    ...items,
    {
      role: "user",
      text: cleanMessage,
    },
  ]);

  setMessage("");
  setLoading(true);
  setError("");

  try {
    const documentId = documents[0]?._id;

    if (!documentId) {
        setError(
            "Please create a document before using Workspace AI."
        );
        return;
    }

    const data = await apiRequest("/ai/chat", {
    method: "POST",
    body: {
       documentId: documents[0]?._id,
        message: cleanMessage,
        action: "chat",
    },
});

    const reply = data?.response?.text;

    if (!reply) {
      throw new Error("AI returned an empty response.");
    }

    setMessages((items) => [
      ...items,
      {
        role: "assistant",
        text: reply,
      },
    ]);
  } catch (err) {
    console.error("Dashboard AI error:", err);
    setError(err?.message || "AI request failed.");
  } finally {
    setLoading(false);
  }
}

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-end bg-black/40 p-3 sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section className="flex h-[min(720px,90vh)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

                {/* HEADER */}
                <header className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 text-violet-600">
                                ✦
                            </div>

                            <p className="text-sm font-semibold text-slate-900">
                                Ask BrainFlow
                            </p>
                        </div>

                        <p className="mt-1 text-[11px] text-slate-500">
                            {workspaceName}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-2 transition rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    >
                        ✕
                    </button>
                </header>

                {/* MESSAGES */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50">

                    {messages.length === 0 && (
                        <div className="p-5 bg-white border shadow-sm rounded-2xl border-violet-100">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 text-violet-600">
                                ✦
                            </div>

                            <p className="mt-4 text-sm font-semibold text-slate-900">
                                Ask your workspace
                            </p>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                Ask BrainFlow a question and get an
                                AI-generated response.
                            </p>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {[
                                    "Summarize my work",
                                    "Help me organize my ideas",
                                    "Explain this concept",
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() =>
                                            setMessage(
                                                suggestion
                                            )
                                        }
                                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 transition hover:border-violet-200 hover:text-violet-600"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((item, index) => (
                        <div
                            key={`${item.role}-${index}`}
                            className={`flex ${
                                item.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            <div
                                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                                    item.role === "user"
                                        ? "bg-slate-900 text-white"
                                        : "border border-slate-200 bg-white text-slate-700"
                                }`}
                            >
                                {item.text}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="px-4 py-3 text-sm bg-white border rounded-2xl border-slate-200 text-slate-500">
                                BrainFlow is thinking…
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 text-xs leading-5 text-red-600 border border-red-200 rounded-xl bg-red-50">
                            {error}
                        </div>
                    )}
                </div>

                {/* INPUT */}
                <form
                    onSubmit={sendMessage}
                    className="p-3 bg-white border-t border-slate-200"
                >
                    <div className="flex gap-2">
                        <input
                            value={message}
                            onChange={(event) =>
                                setMessage(event.target.value)
                            }
                            placeholder="Ask BrainFlow anything…"
                            className="flex-1 min-w-0 px-4 py-3 text-sm transition border outline-none rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        />

                        <button
                            type="submit"
                            disabled={
                                !message.trim() ||
                                loading
                            }
                            className="px-5 text-sm font-semibold text-white transition rounded-xl bg-slate-900 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {loading
                                ? "..."
                                : "Send"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}