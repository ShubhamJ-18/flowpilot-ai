'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import {
  GitFork,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
  Coins,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  Loader2,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await api.getDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Operations Dashboard</h1>
            <p className="text-xs text-slate-400">Real-time workflow execution telemetry and AI resource tracking.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/workflows/new"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              New Workflow
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400">
            {error}
          </div>
        ) : (
          <>
            {/* Pending Approvals Callout Banner */}
            {data?.runs?.waitingForApproval > 0 && (
              <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">
                      {data.runs.waitingForApproval} Workflow Run(s) Awaiting Approval
                    </h4>
                    <p className="text-[11px] text-amber-400/80">Human-in-the-loop review is required before steps can proceed.</p>
                  </div>
                </div>
                <Link
                  href="/runs"
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-400"
                >
                  Review Approvals
                </Link>
              </div>
            )}

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Total Workflows</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400">
                    <GitFork className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{data?.workflows?.total || 0}</span>
                  <span className="text-xs text-emerald-400">{data?.workflows?.active || 0} active</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Executions</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-400">
                    <Play className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{data?.runs?.total || 0}</span>
                  <span className="text-xs font-semibold text-emerald-400">{data?.runs?.successRate || 0}% success</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Avg Step Duration</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{data?.runs?.avgDurationMs || 0}</span>
                  <span className="text-xs text-slate-400">ms / step</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">AI Tokens / Cost</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/10 text-purple-400">
                    <Coins className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{(data?.ai?.totalTokens || 0).toLocaleString()}</span>
                  <span className="text-xs text-purple-400">${data?.ai?.estimatedCost || 0}</span>
                </div>
              </div>
            </div>

            {/* Recent Executions & Errors */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Recent Runs Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Recent Execution Runs</h3>
                  <Link href="/runs" className="text-xs text-indigo-400 hover:text-indigo-300">
                    View all
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-mono uppercase text-[10px]">
                        <th className="pb-2">Workflow</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Triggered At</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data?.recentRuns?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-500">
                            No workflow executions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        data?.recentRuns?.map((run) => (
                          <tr key={run.id} className="hover:bg-slate-800/30">
                            <td className="py-3 font-medium text-slate-200">
                              {run.workflow?.name || 'Untitled Workflow'}
                            </td>
                            <td className="py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  run.status === 'SUCCEEDED'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : run.status === 'RUNNING'
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                    : run.status === 'WAITING_FOR_APPROVAL'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}
                              >
                                {run.status}
                              </span>
                            </td>
                            <td className="py-3 text-slate-400">
                              {new Date(run.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3 text-right">
                              <Link
                                href={`/runs/${run.id}`}
                                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                              >
                                Details
                                <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Execution Health & Errors */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">Execution Health & Issues</h3>

                {data?.recentErrors?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/40 p-6 text-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    <p className="mt-2 text-xs font-semibold text-slate-200">System Healthy</p>
                    <p className="text-[11px] text-slate-500">No failed workflow executions in recent telemetry.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.recentErrors.map((err) => (
                      <div key={err.id} className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs">
                        <div className="flex items-center justify-between text-rose-300 font-semibold">
                          <span>{err.workflow?.name}</span>
                          <span className="font-mono text-[10px]">{new Date(err.finishedAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-rose-400 line-clamp-2">{err.errorSummary}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scheduled Triggers Preview */}
                <div className="border-t border-slate-800 pt-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Scheduled Triggers
                  </h4>
                  {data?.scheduledTriggers?.length === 0 ? (
                    <p className="text-xs text-slate-500">No active cron triggers scheduled.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {data.scheduledTriggers.map((t) => (
                        <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-950 p-2 text-xs">
                          <span className="text-slate-300 font-medium">{t.workflow?.name}</span>
                          <span className="font-mono text-[10px] text-indigo-400">{t.cronExpression}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
