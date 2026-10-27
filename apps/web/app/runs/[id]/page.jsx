'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalComment, setApprovalComment] = useState('Approved by reviewer');
  const [expandedSteps, setExpandedSteps] = useState({});

  useEffect(() => {
    if (params?.id) {
      loadRunDetails(params.id);
    }
  }, [params?.id]);

  async function loadRunDetails(id) {
    try {
      setLoading(true);
      const res = await api.getRun(id);
      setRun(res.data.run);
      // Auto-expand all steps
      const map = {};
      res.data.run.stepRuns?.forEach((s) => (map[s.id] = true));
      setExpandedSteps(map);
    } catch (err) {
      setError(err.message || 'Execution run not found.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    setActionLoading(true);
    try {
      await api.approveRun(run.id, approvalComment);
      await loadRunDetails(run.id);
    } catch (err) {
      alert(err.message || 'Failed to approve execution.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    setActionLoading(true);
    try {
      await api.rejectRun(run.id, 'Rejected by reviewer');
      await loadRunDetails(run.id);
    } catch (err) {
      alert(err.message || 'Failed to reject execution.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRetry() {
    setActionLoading(true);
    try {
      const res = await api.retryRun(run.id);
      router.push(`/runs/${res.data.run.id}`);
    } catch (err) {
      alert(err.message || 'Failed to retry run.');
      setActionLoading(false);
    }
  }

  function toggleStep(stepId) {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/runs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Execution Runs
        </Link>

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
            {/* Header Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-white">{run.workflow?.name}</h1>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        run.status === 'SUCCEEDED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : run.status === 'RUNNING'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse'
                          : run.status === 'WAITING_FOR_APPROVAL'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-500">Run ID: {run.id}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/workflows/${run.workflowId}`}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700"
                  >
                    Open Canvas
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <button
                    onClick={handleRetry}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Rerun Execution
                  </button>
                </div>
              </div>

              {/* Approval Action Banner if Waiting */}
              {run.status === 'WAITING_FOR_APPROVAL' && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                    Approval Required to Proceed
                  </div>
                  <p className="text-xs text-slate-300">
                    This workflow has reached a configured Approval Gate. Inspect the intermediate steps below, then approve or reject continuation.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <input
                      type="text"
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder="Approval comment..."
                      className="min-w-[260px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500"
                    >
                      <Check className="h-4 w-4" />
                      Approve & Resume
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                    >
                      <X className="h-4 w-4" />
                      Reject Run
                    </button>
                  </div>
                </div>
              )}

              {/* Error Summary Banner if Failed */}
              {run.errorSummary && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs space-y-1">
                  <span className="font-semibold text-rose-300">Execution Error:</span>
                  <p className="font-mono text-rose-400">{run.errorSummary}</p>
                </div>
              )}

              {/* Final Output Preview if Succeeded */}
              {run.status === 'SUCCEEDED' && run.output && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-2">
                  <span className="text-xs font-semibold text-emerald-400">Final Execution Output:</span>
                  <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-emerald-300">
                    {JSON.stringify(run.output, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Step-by-step Timeline */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Step Execution Timeline</h3>

              {run.stepRuns?.length === 0 ? (
                <p className="text-xs text-slate-500">No step telemetry available.</p>
              ) : (
                <div className="space-y-2.5">
                  {run.stepRuns?.map((step, idx) => {
                    const isExpanded = !!expandedSteps[step.id];

                    return (
                      <div
                        key={step.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStep(step.id)}
                          className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-800/40"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 font-mono text-[11px] font-bold text-slate-400">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-200">{step.nodeId}</span>
                                <span className="font-mono text-[10px] uppercase text-indigo-400">[{step.nodeType}]</span>
                              </div>
                              <span className="text-[11px] text-slate-500">
                                {step.durationMs !== null ? `${step.durationMs}ms` : 'In progress...'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                step.status === 'SUCCEEDED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : step.status === 'RUNNING'
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                  : step.status === 'SKIPPED'
                                  ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}
                            >
                              {step.status}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                        </button>

                        {/* Collapsible Step Payload Body */}
                        {isExpanded && (
                          <div className="border-t border-slate-800/80 bg-slate-950/70 p-4 space-y-3">
                            {step.output && (
                              <div>
                                <span className="mb-1 block font-mono text-[10px] uppercase text-slate-400">Output:</span>
                                <pre className="overflow-x-auto rounded-lg bg-slate-950 p-2.5 font-mono text-xs text-slate-300">
                                  {JSON.stringify(step.output, null, 2)}
                                </pre>
                              </div>
                            )}

                            {step.errorSummary && (
                              <div className="rounded-lg bg-rose-500/10 p-2.5 font-mono text-xs text-rose-400">
                                Error: {step.errorSummary}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
