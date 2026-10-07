import {
    motion,
    useScroll,
    useTransform,
} from "framer-motion";

import { Link } from "react-router-dom";

import DocumentHero3D from "../components/DocumentHero3D.jsx";

function Glow() {
    return (
        <>
            <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[150px]" />

            <div className="pointer-events-none absolute -right-40 top-[500px] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[150px]" />

            <div className="pointer-events-none absolute left-1/3 top-[900px] h-[450px] w-[450px] rounded-full bg-fuchsia-600/[0.06] blur-[150px]" />
        </>
    );
}

function GridBackground() {
    return (
        <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:72px_72px]" />
    );
}

function FeatureCard({
    number,
    title,
    description,
}) {
    return (
        <motion.div
            whileHover={{
                y: -8,
                rotateX: 2,
                rotateY: -2,
            }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
            }}
            className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.035] p-7 backdrop-blur-xl"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.07] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

            <div className="relative">
                <span className="text-xs font-semibold tracking-[0.25em] text-violet-300/70">
                    {number}
                </span>

                <h3 className="mt-8 text-xl font-semibold text-white">
                    {title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                    {description}
                </p>
            </div>
        </motion.div>
    );
}

export default function Landing() {
    const { scrollY } = useScroll();

    const heroY = useTransform(
        scrollY,
        [0, 700],
        [0, 180]
    );

    const heroOpacity = useTransform(
        scrollY,
        [0, 500],
        [1, 0]
    );

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#050509] text-white">
            <Glow />
            <GridBackground />

            {/* NAVBAR */}
            <nav className="relative z-20 flex items-center justify-between px-6 py-6 mx-auto max-w-7xl lg:px-8">
                <Link
                    to="/"
                    className="flex items-center gap-3"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-sm font-bold text-violet-200 shadow-[0_0_35px_rgba(139,92,246,0.15)]">
                        B
                    </div>

                    <span className="text-[15px] font-semibold tracking-tight">
                        BrainFlow
                    </span>
                </Link>

                <div className="items-center hidden gap-8 text-sm text-slate-400 md:flex">
                    <a
                        href="#features"
                        className="transition hover:text-white"
                    >
                        Features
                    </a>

                    <a
                        href="#workflow"
                        className="transition hover:text-white"
                    >
                        Workflow
                    </a>

                    <a
                        href="#ai"
                        className="transition hover:text-white"
                    >
                        AI
                    </a>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        to="/login"
                        className="hidden rounded-xl px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white sm:block"
                    >
                        Sign in
                    </Link>

                    <Link
                        to="/register"
                        className="rounded-xl border border-violet-300/20 bg-violet-500/15 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-300/35 hover:bg-violet-500/25"
                    >
                        Get started
                    </Link>
                </div>
            </nav>

            {/* HERO */}
            <section className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center px-6 pb-16 pt-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pb-24">
                <motion.div
                    style={{
                        y: heroY,
                        opacity: heroOpacity,
                    }}
                    className="relative z-10 max-w-2xl"
                >
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
                            duration: 0.7,
                        }}
                        className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/[0.07] px-4 py-2 text-xs font-medium text-violet-200"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.9)]" />

                        Intelligent workspace for modern teams
                    </motion.div>

                    <motion.h1
                        initial={{
                            opacity: 0,
                            y: 25,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.8,
                            delay: 0.1,
                        }}
                        className="text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl"
                    >
                        Your ideas.
                        <br />

                        <span className="text-transparent bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text">
                            One intelligent flow.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{
                            opacity: 0,
                            y: 20,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.8,
                            delay: 0.2,
                        }}
                        className="max-w-xl text-base leading-8 mt-7 text-slate-400 sm:text-lg"
                    >
                        BrainFlow brings your documents,
                        workspace, collaboration and AI
                        into one beautifully connected
                        environment.
                    </motion.p>

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
                            duration: 0.8,
                            delay: 0.3,
                        }}
                        className="flex flex-wrap gap-3 mt-9"
                    >
                        <Link
                            to="/register"
                            className="group relative overflow-hidden rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                        >
                            Start creating

                            <span className="ml-2 transition group-hover:translate-x-1">
                                →
                            </span>
                        </Link>

                        <Link
                            to="/login"
                            className="rounded-2xl border border-white/10 bg-white/[0.035] px-6 py-3.5 text-sm font-medium text-white backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07]"
                        >
                            Explore workspace
                        </Link>
                    </motion.div>

                    <div className="flex items-center gap-6 mt-10 text-xs text-slate-600">
                        <span>Rich documents</span>
                        <span>•</span>
                        <span>Contextual AI</span>
                        <span>•</span>
                        <span>Realtime workspace</span>
                    </div>
                </motion.div>

                {/* 3D DOCUMENT */}
                <motion.div
                    initial={{
                        opacity: 0,
                        scale: 0.88,
                        x: 40,
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        x: 0,
                    }}
                    transition={{
                        duration: 1.2,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative mt-4 lg:mt-0"
                >
                    <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.10] blur-[100px]" />

                    <DocumentHero3D />
                </motion.div>
            </section>

            {/* FEATURE SECTION */}
            <section
                id="features"
                className="relative z-10 px-6 mx-auto max-w-7xl py-28 lg:px-8"
            >
                <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">
                        One connected workspace
                    </p>

                    <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                        Everything your thinking needs.
                    </h2>

                    <p className="mt-5 text-base leading-8 text-slate-400">
                        Stop moving between disconnected tools.
                        BrainFlow keeps the work and the intelligence
                        together.
                    </p>
                </div>

                <div className="grid gap-5 mt-14 md:grid-cols-3">
                    <FeatureCard
                        number="01"
                        title="Rich documents"
                        description="Write, structure and organize ideas in a powerful document environment built for serious work."
                    />

                    <FeatureCard
                        number="02"
                        title="Contextual AI"
                        description="Summarize, rewrite, expand and transform content without leaving the document you're working in."
                    />

                    <FeatureCard
                        number="03"
                        title="Connected workspace"
                        description="Keep documents, teams, activity and collaboration inside one secure workspace."
                    />
                </div>
            </section>

            {/* WORKFLOW */}
            <section
                id="workflow"
                className="relative z-10 px-6 mx-auto max-w-7xl py-28 lg:px-8"
            >
                <div className="grid items-center gap-16 lg:grid-cols-2">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                            The workflow
                        </p>

                        <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                            From blank page to finished thought.
                        </h2>

                        <p className="max-w-xl mt-6 text-base leading-8 text-slate-400">
                            BrainFlow keeps the entire process inside
                            the same workspace instead of making you
                            copy content between five different apps.
                        </p>

                        <div className="mt-10 space-y-6">
                            {[
                                [
                                    "Write",
                                    "Create your document and build your ideas naturally.",
                                ],
                                [
                                    "Think",
                                    "Use contextual AI directly on the content you're working on.",
                                ],
                                [
                                    "Flow",
                                    "Collaborate, organize and keep everything connected.",
                                ],
                            ].map(([title, description], index) => (
                                <div
                                    key={title}
                                    className="flex gap-4"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-violet-300">
                                        0{index + 1}
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-white">
                                            {title}
                                        </h3>

                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            {description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 rounded-[3rem] bg-violet-500/[0.08] blur-[90px]" />

                        <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-2xl">
                            <div className="rounded-2xl border border-white/[0.07] bg-[#0a0a10] p-6">
                                <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                                    <span className="text-xs text-slate-500">
                                        BrainFlow document
                                    </span>

                                    <span className="flex items-center gap-2 text-[10px] text-emerald-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        Saved
                                    </span>
                                </div>

                                <div className="py-10">
                                    <div className="w-3/5 h-4 rounded bg-white/10" />

                                    <div className="mt-8 space-y-3">
                                        <div className="h-2.5 w-full rounded bg-white/[0.06]" />
                                        <div className="h-2.5 w-[92%] rounded bg-white/[0.06]" />
                                        <div className="h-2.5 w-[80%] rounded bg-white/[0.06]" />
                                    </div>

                                    <div className="mt-10 rounded-2xl border border-violet-400/10 bg-violet-500/[0.06] p-5">
                                        <div className="text-xs font-semibold text-violet-200">
                                            ✦ BrainFlow AI
                                        </div>

                                        <p className="mt-3 text-xs leading-6 text-slate-400">
                                            Select text and transform
                                            it without leaving your
                                            document.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI */}
            <section
                id="ai"
                className="relative z-10 max-w-5xl px-6 py-32 mx-auto text-center lg:px-8"
            >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">
                    Intelligence where you work
                </p>

                <h2 className="max-w-3xl mx-auto mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
                    Your AI shouldn't live in another tab.
                </h2>

                <p className="max-w-2xl mx-auto mt-6 text-base leading-8 text-slate-400">
                    BrainFlow brings AI directly into the context of
                    your documents so your ideas can move faster.
                </p>

                <Link
                    to="/register"
                    className="mt-10 inline-flex rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                >
                    Build your workspace
                    <span className="ml-2">→</span>
                </Link>
            </section>

            {/* FOOTER */}
            <footer className="relative z-10 border-t border-white/[0.06]">
                <div className="flex flex-col gap-4 px-6 py-8 mx-auto text-xs max-w-7xl text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-8">
                    <span>
                        © {new Date().getFullYear()} BrainFlow
                    </span>

                    <span>
                        Think. Write. Flow.
                    </span>
                </div>
            </footer>
        </main>
    );
}