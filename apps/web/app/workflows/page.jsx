'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import {
  GitFork,
  Plus,
  Play,
  Search,
  Layers,
  ArrowRight,
  Trash2,
  Edit,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadWorkflows();
  }, [search, statusFilter]);

  async function loadWorkflows() {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.listWorkflows(params);
      setWorkflows(res.workflows || []);
    } catch {
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    setDeletingId(id);
    try {
      await api.deleteWorkflow(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete workflow.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Automated Workflows</h1>
            <p className="text-xs text-slate-400">Design, inspect, and run DAG workflows powered by schema-validated AI.</p>
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

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows by title or keyword..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {['', 'ACTIVE', 'DRAFT'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === '' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Workflows Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400">
              <GitFork className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-white">No workflows found</h3>
            <p className="mt-1 text-xs text-slate-500">Create your first automated workflow or generate one from natural language.</p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/workflows/new"
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                <Plus className="h-4 w-4" />
                Create Workflow
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf) => {
              const nodeCount = wf.definition?.nodes?.length || 0;
              const edgeCount = wf.definition?.edges?.length || 0;

              return (
                <div
                  key={wf.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          wf.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}
                      >
                        {wf.status}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">v{wf.version}</span>
                    </div>

                    <h3 className="mt-3 text-base font-semibold text-white line-clamp-1">{wf.name}</h3>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                      {wf.description || 'No description provided.'}
                    </p>

                    <div className="mt-4 flex items-center gap-3 border-t border-slate-800/80 pt-3 text-[11px] text-slate-500 font-mono">
                      <span>{nodeCount} Nodes</span>
                      <span>•</span>
                      <span>{edgeCount} Edges</span>
                      <span>•</span>
                      <span>{wf._count?.runs || 0} Runs</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <button
                      onClick={() => handleDelete(wf.id)}
                      disabled={deletingId === wf.id}
                      className="rounded p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                      title="Delete workflow"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <Link
                      href={`/workflows/${wf.id}`}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600/15 px-3 py-1.5 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30 transition hover:bg-indigo-600 hover:text-white"
                    >
                      Open Canvas
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
