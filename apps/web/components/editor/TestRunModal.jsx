'use client';

import React, { useState } from 'react';
import { Play, X, Loader2, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function TestRunModal({ isOpen, onClose, workflowId, onRunStarted }) {
  const [inputJson, setInputJson] = useState(
    JSON.stringify(
      {
        ticket_text: 'Urgent: Payment processor timeout on checkout for enterprise accounts. Customers unable to place orders.',
        customer_email: 'enterprise-client@bigcorp.com',
      },
      null,
      2
    )
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeRun, setActiveRun] = useState(null);

  if (!isOpen) return null;

  async function handleStartRun(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setActiveRun(null);

    let parsedInput = {};
    try {
      parsedInput = JSON.parse(inputJson);
    } catch {
      setError('Invalid JSON payload. Please verify syntax.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.triggerRun({
        workflowId,
        input: parsedInput,
      });

      const run = res.data.run;
      setActiveRun(run);
      if (onRunStarted) {
        onRunStarted(run.id);
      }
    } catch (err) {
      setError(err.message || 'Failed to dispatch workflow execution.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/30">
              <Play className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Test Execute Workflow</h3>
              <p className="text-xs text-slate-400">Provide test parameters to execute this workflow immediately.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <form onSubmit={handleStartRun} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Trigger Input JSON
              </label>
              <textarea
                rows={6}
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {activeRun && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Execution Run Dispatched
                  </span>
                  <span className="font-mono text-xs text-slate-400">Run ID: {activeRun.id.slice(0, 8)}...</span>
                </div>
                <p className="text-xs text-slate-400">Execution is running in background. You can monitor the steps directly on the canvas or view detailed logs.</p>
                <div className="pt-2">
                  <Link
                    href={`/runs/${activeRun.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Open Execution Logs
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    Execute Run
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
