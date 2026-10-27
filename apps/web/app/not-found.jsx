import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-3xl font-extrabold text-white">404 — Page Not Found</h1>
      <p className="mt-2 text-xs text-slate-400">The automation route or resource you requested does not exist.</p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Return to Dashboard
      </Link>
    </div>
  );
}
