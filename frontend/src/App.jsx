import { Link, Navigate, Route, Routes } from "react-router-dom";
import AcceptInvitation from "./pages/AcceptInvitation.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
function HomePage() {
  const features = [
    {
      icon: "✦",
      title: "AI-powered writing",
      description:
        "Summarize, rewrite, expand, and refine your ideas without leaving your document.",
    },
    {
      icon: "◈",
      title: "One connected workspace",
      description:
        "Keep your documents, ideas, and team collaboration organized in one place.",
    },
    {
      icon: "⌘",
      title: "Built for collaboration",
      description:
        "Bring your team together with shared workspaces and real-time collaboration.",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full -left-40 -top-40 h-96 w-96 bg-violet-600/20 blur-3xl" />
        <div className="absolute rounded-full -right-40 top-40 h-96 w-96 bg-indigo-600/20 blur-3xl" />
      </div>

      {/* Navigation */}
      <header className="relative z-10 border-b border-white/10">
        <nav className="flex items-center justify-between px-6 py-5 mx-auto max-w-7xl lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 text-xl font-bold text-white shadow-lg rounded-xl bg-violet-500 shadow-violet-500/20">
              B
            </div>

            <span className="text-xl font-semibold tracking-tight">
              BrainFlow
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden text-sm font-medium transition text-slate-300 hover:text-white sm:inline-block"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="flex flex-col items-center px-6 pt-24 pb-20 mx-auto text-center max-w-7xl sm:pt-32 lg:px-8 lg:pb-28">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm border rounded-full border-violet-400/20 bg-violet-400/10 text-violet-200">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            Your ideas deserve one connected space
          </div>

          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Think clearly.
            <br />
            <span className="text-transparent bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text">
              Create without limits.
            </span>
          </h1>

          <p className="max-w-2xl text-base leading-8 mt-7 text-slate-400 sm:text-lg">
            BrainFlow brings your documents, AI writing tools, and team
            collaboration together in one focused digital workspace.
          </p>

          <div className="flex flex-col gap-4 mt-10 sm:flex-row">
            <Link
              to="/register"
              className="rounded-xl bg-violet-500 px-7 py-3.5 text-center font-semibold text-white shadow-xl shadow-violet-500/20 transition hover:-translate-y-0.5 hover:bg-violet-400"
            >
              Create your workspace
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            </Link>

            <a
              href="#features"
              className="rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-center font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            >
              Explore features
            </a>
          </div>

          {/* Product preview */}
          <div className="w-full max-w-5xl p-3 mt-20 border shadow-2xl rounded-2xl border-white/10 bg-slate-900/80 shadow-violet-950/30 backdrop-blur sm:p-5">
            <div className="overflow-hidden border rounded-xl border-white/10 bg-slate-950">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>

                <span className="text-xs font-medium tracking-wide text-slate-500">
                  BRAINFLOW WORKSPACE
                </span>

                <div className="w-10 h-2 rounded-full bg-slate-800" />
              </div>

              <div className="grid min-h-72 grid-cols-1 text-left sm:grid-cols-[190px_1fr]">
                <aside className="p-5 border-b border-white/10 bg-slate-900/60 sm:border-b-0 sm:border-r">
                  <p className="mb-5 text-xs font-semibold tracking-widest uppercase text-slate-500">
                    Workspace
                  </p>

                  <div className="space-y-3 text-sm">
                    <div className="px-3 py-2 rounded-lg bg-violet-500/15 text-violet-200">
                      ◫ &nbsp; My documents
                    </div>
                    <div className="px-3 py-2 text-slate-400">
                      ◈ &nbsp; Shared with me
                    </div>
                    <div className="px-3 py-2 text-slate-400">
                      ✦ &nbsp; AI assistant
                    </div>
                  </div>
                </aside>

                <div className="p-6 sm:p-10">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                      <p className="text-xs text-slate-500">
                        MY DOCUMENTS / PROJECT NOTES
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">
                        Project ideas
                      </h2>
                    </div>

                    <span className="px-3 py-2 text-xs font-medium border rounded-lg border-violet-400/20 bg-violet-400/10 text-violet-200">
                      ✦ AI tools
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="w-11/12 h-3 rounded-full bg-slate-800" />
                    <div className="w-full h-3 rounded-full bg-slate-800" />
                    <div className="w-4/5 h-3 rounded-full bg-slate-800" />
                    <div className="w-2/3 h-3 rounded-full bg-slate-800" />
                  </div>

                  <div className="p-4 mt-8 border rounded-xl border-violet-400/20 bg-violet-400/5">
                    <p className="text-xs font-semibold tracking-wider uppercase text-violet-300">
                      ✦ BrainFlow AI
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Turn your rough ideas into clear, organized writing.
                      Summarize content, explore alternatives, and refine your
                      work while staying in your document.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-t border-white/10 bg-slate-900/40"
        >
          <div className="px-6 py-20 mx-auto max-w-7xl lg:px-8 lg:py-24">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-sm font-semibold tracking-widest uppercase text-violet-300">
                Everything connected
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                A workspace that flows with you
              </h2>

              <p className="mt-5 leading-7 text-slate-400">
                Spend less time switching between tools and more time turning
                your ideas into meaningful work.
              </p>
            </div>

            <div className="grid gap-5 mt-14 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="transition border rounded-2xl border-white/10 bg-slate-950/70 p-7 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-slate-900"
                >
                  <div className="flex items-center justify-center w-12 h-12 text-2xl border rounded-xl border-violet-400/20 bg-violet-400/10 text-violet-300">
                    {feature.icon}
                  </div>

                  <h3 className="mt-6 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6 py-20 text-center lg:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to bring your ideas together?
          </h2>

          <p className="max-w-xl mx-auto mt-5 leading-7 text-slate-400">
            Start building a more connected way to think, write, and work with
            your team.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-flex rounded-xl bg-violet-500 px-7 py-3.5 font-semibold text-white transition hover:bg-violet-400"
          >
            Get started with BrainFlow →
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 border-t border-white/10 py-7">
        <div className="flex flex-col items-center justify-between gap-3 mx-auto text-sm max-w-7xl text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} BrainFlow. All rights reserved.</p>
          <p>One space for your ideas, documents, and team.</p>
        </div>
      </footer>
    </div>
  );
}

function NotFoundPage() {
  return (
    <main className="flex items-center justify-center min-h-screen px-6 text-center bg-slate-950 text-slate-100">
      <div>
        <p className="text-sm font-semibold tracking-widest text-violet-300">
          404 — PAGE NOT FOUND
        </p>

        <h1 className="mt-5 text-4xl font-bold">
          We couldn't find that page.
        </h1>

        <p className="mt-4 text-slate-400">
          Check the address or return to the BrainFlow home page.
        </p>

        <Link
          to="/"
          className="inline-flex px-5 py-3 mt-8 font-semibold text-white transition rounded-lg bg-violet-500 hover:bg-violet-400"
        >
          Go to home
        </Link>
      </div>
    </main>
  );
}
   function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route path="/404" element={<NotFoundPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;