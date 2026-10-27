'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import WorkflowEditor from '@/components/editor/WorkflowEditor';
import { api } from '@/lib/api';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params?.id) {
      loadWorkflow(params.id);
    }
  }, [params?.id]);

  async function loadWorkflow(id) {
    try {
      setLoading(true);
      const res = await api.getWorkflow(id);
      setWorkflow(res.data.workflow);
    } catch (err) {
      setError(err.message || 'Workflow not found or access denied.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {loading ? (
          <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-400" />
            <h3 className="text-sm font-semibold text-rose-300">Unable to load workflow</h3>
            <p className="text-xs text-rose-400">{error}</p>
            <Link
              href="/workflows"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Workflows
            </Link>
          </div>
        ) : (
          <>
            {/* Header / Info Bar */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">{workflow.name}</h1>
                <p className="text-xs text-slate-400">{workflow.description || 'Interactive Visual DAG Editor'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] text-slate-300">
                  Version v{workflow.version}
                </span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                  {workflow.status}
                </span>
              </div>
            </div>

            {/* Embedded Visual Editor */}
            <WorkflowEditor workflow={workflow} onSaveSuccess={(updated) => setWorkflow(updated)} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
