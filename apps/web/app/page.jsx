import Link from 'next/link';
import {
  Sparkles,
  PlayCircle,
  GitFork,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Lock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-slate-800/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">FlowPilot AI</span>
            <span className="ml-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
              v1.0 Enterprise
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-xs font-medium text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Natural Language to Visual Automation DAGs
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Automate Business Processes with{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Controlled AI & Visual DAGs
            </span>
          </h1>

          <p className="mt-6 text-base text-slate-400 sm:text-lg">
            Describe your workflow in plain English. FlowPilot AI generates a deterministic, schema-validated node graph that you can inspect, visually customize, execute step-by-step, and monitor in real-time.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-600/30 transition hover:bg-indigo-500"
            >
              Start Automating
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-800"
            >
              Explore Live Demo
            </Link>
          </div>
        </div>

        {/* Interactive Architecture Graphic */}
        <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs text-slate-400">FlowPilot AI DAG Architecture</span>
            </div>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400">
              Deterministic Sandbox Active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-left">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <PlayCircle className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200">1. Trigger Ingestion</h4>
              <p className="mt-1 text-[11px] text-slate-400">Manual, webhook, or cron payload receives data safely.</p>
            </div>

            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 text-left">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <Cpu className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200">2. AI Microservice</h4>
              <p className="mt-1 text-[11px] text-slate-400">FastAPI LLM summarization, classification & extraction.</p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-left">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200">3. Approval Gate</h4>
              <p className="mt-1 text-[11px] text-slate-400">Human-in-the-loop review pauses runs until confirmed.</p>
            </div>

            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 text-left">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                <Layers className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200">4. Report / Webhook</h4>
              <p className="mt-1 text-[11px] text-slate-400">Compiled reports and SSRF-hardened webhook dispatches.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Principles Section */}
      <section className="border-t border-slate-800/80 bg-slate-900/30 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Architected for Production Security</h2>
            <p className="mt-2 text-sm text-slate-400">No arbitrary code execution. No prompt vulnerabilities. Full auditability.</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Strict Node Registry</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                The LLM never generates arbitrary executable code (no eval, no bash, no Python). Every step runs an approved, typed-by-schema registry handler.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Immutable Versioning</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Every execution is bound to an immutable snapshot version in PostgreSQL. Editing a workflow never alters running jobs or past audit logs.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">SSRF-Protected Actions</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Webhook destinations are validated via DNS lookup against loopback, RFC1918 private spaces, and AWS/GCP cloud metadata addresses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center text-xs text-slate-500">
        <p>FlowPilot AI — Intelligent Workflow Automation Platform • Full Stack Architecture</p>
      </footer>
    </div>
  );
}
