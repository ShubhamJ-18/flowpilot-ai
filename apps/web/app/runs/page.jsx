'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export default function RunsPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadRuns();
  }, [statusFilter]);

  async function loadRuns() {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.listRuns(params);
      setRuns(res.runs || []);
    } catch {
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Execution Runs</h1>
          <p className="text-xs text-slate-400">Complete execution history, step outputs, errors, and telemetry.</p>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {['', 'SUCCEEDED', 'RUNNING', 'WAITING_FOR_APPROVAL', 'FAILED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === '' ? 'All Statuses' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400">
              <Play className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-white">No executions recorded</h3>
            <p className="mt-1 text-xs text-slate-500">Trigger a test run from any workflow editor canvas.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 font-mono text-[11px] uppercase text-slate-400">
                  <th className="px-4 py-3">Workflow</th>
                  <th className="px-4 py-3">Run ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Steps</th>
                  <th className="px-4 py-3">Started At</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3.5 font-semibold text-slate-100">
                      {run.workflow?.name || 'Workflow Run'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">
                      {run.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          run.status === 'SUCCEEDED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : run.status === 'RUNNING'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : run.status === 'WAITING_FOR_APPROVAL'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">
                      {run._count?.stepRuns || 0} steps
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {new Date(run.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/runs/${run.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/10 px-2.5 py-1 text-xs font-semibold text-indigo-400 hover:bg-indigo-600 hover:text-white"
                      >
                        Inspect
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
