'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import AiGeneratorModal from '@/components/editor/AiGeneratorModal';
import { api } from '@/lib/api';
import {
  Sparkles,
  Plus,
  PlayCircle,
  FileCode,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const STARTER_TEMPLATES = [
  {
    id: 'scratch',
    title: 'Blank Canvas',
    description: 'Start with a simple Manual Trigger and final Report node to build your custom logic from scratch.',
    icon: Plus,
    definition: {
      nodes: [
        { id: 'trigger_1', type: 'MANUAL_TRIGGER', label: 'Manual Trigger', position: { x: 100, y: 180 }, config: { inputSchema: { text: 'string' } } },
        { id: 'report_1', type: 'REPORT_OUTPUT', label: 'Final Output', position: { x: 450, y: 180 }, config: { title: 'Workflow Result' } },
      ],
      edges: [{ id: 'e1', source: 'trigger_1', target: 'report_1' }],
    },
  },
  {
    id: 'support_triage',
    title: 'Customer Support Triage',
    description: 'Ingests support tickets, classifies urgency with AI, condenses key issues, checks urgent criteria, and reports.',
    icon: PlayCircle,
    definition: {
      nodes: [
        { id: 'trigger_1', type: 'MANUAL_TRIGGER', label: 'Ticket Ingestion', position: { x: 100, y: 180 }, config: { inputSchema: { ticket_text: 'string' } } },
        { id: 'classify_1', type: 'AI_CLASSIFY', label: 'Classify Urgency', position: { x: 380, y: 100 }, config: { inputField: 'ticket_text', categories: ['urgent', 'standard', 'low'] } },
        { id: 'summarize_1', type: 'AI_SUMMARIZE', label: 'Summarize Issue', position: { x: 380, y: 280 }, config: { inputField: 'ticket_text', maxLength: 'concise' } },
        { id: 'condition_1', type: 'CONDITION', label: 'Is Urgent?', position: { x: 680, y: 100 }, config: { field: 'classify_1.category', operator: 'equals', value: 'urgent' } },
        { id: 'approval_1', type: 'APPROVAL_GATE', label: 'Manager Review', position: { x: 960, y: 80 }, config: { prompt: 'Manager must authorize urgent report' } },
        { id: 'report_1', type: 'REPORT_OUTPUT', label: 'Executive Summary', position: { x: 960, y: 280 }, config: { title: 'Support Report', fields: { summary: '{{summarize_1.summary}}' } } },
      ],
      edges: [
        { id: 'e1', source: 'trigger_1', target: 'classify_1' },
        { id: 'e2', source: 'trigger_1', target: 'summarize_1' },
        { id: 'e3', source: 'classify_1', target: 'condition_1' },
        { id: 'e4', source: 'condition_1', target: 'approval_1', sourceHandle: 'true' },
        { id: 'e5', source: 'condition_1', target: 'report_1', sourceHandle: 'false' },
        { id: 'e6', source: 'summarize_1', target: 'report_1' },
      ],
    },
  },
  {
    id: 'document_extract',
    title: 'Document Extraction & Formatting',
    description: 'Extracts structured metadata (vendor, amount, date) from unstructured documents and formats clean JSON.',
    icon: FileCode,
    definition: {
      nodes: [
        { id: 'trigger_1', type: 'MANUAL_TRIGGER', label: 'Document Input', position: { x: 100, y: 180 }, config: { inputSchema: { text: 'string' } } },
        { id: 'extract_1', type: 'AI_EXTRACT', label: 'Extract Entities', position: { x: 380, y: 180 }, config: { inputField: 'text', schemaFields: [{ name: 'customer_name', type: 'string' }, { name: 'amount', type: 'number' }] } },
        { id: 'transform_1', type: 'JSON_TRANSFORM', label: 'Format Output', position: { x: 660, y: 180 }, config: { mappings: { customer: 'extract_1.extracted.customer_name', amount: 'extract_1.extracted.amount' } } },
        { id: 'report_1', type: 'REPORT_OUTPUT', label: 'Summary Digest', position: { x: 940, y: 180 }, config: { title: 'Extraction Digest' } },
      ],
      edges: [
        { id: 'e1', source: 'trigger_1', target: 'extract_1' },
        { id: 'e2', source: 'extract_1', target: 'transform_1' },
        { id: 'e3', source: 'transform_1', target: 'report_1' },
      ],
    },
  },
];

export default function NewWorkflowPage() {
  const router = useRouter();
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreateWithTemplate(template) {
    setCreating(true);
    setError(null);
    try {
      const res = await api.createWorkflow({
        name: template.title,
        description: template.description,
        status: 'ACTIVE',
        definition: template.definition,
      });

      router.push(`/workflows/${res.data.workflow.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create workflow.');
      setCreating(false);
    }
  }

  async function handleApplyAiProposal(proposal) {
    setCreating(true);
    setError(null);
    try {
      const res = await api.createWorkflow({
        name: proposal.name,
        description: proposal.description,
        status: 'ACTIVE',
        definition: {
          nodes: proposal.nodes,
          edges: proposal.edges,
        },
      });

      router.push(`/workflows/${res.data.workflow.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create workflow from AI proposal.');
      setCreating(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create New Workflow</h1>
          <p className="text-xs text-slate-400">Choose a starter template or describe your process in plain language.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* AI Generator Highlight Banner */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 p-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Assisted Workflow Builder
            </div>
            <h3 className="text-lg font-bold text-white">Describe in Natural Language</h3>
            <p className="text-xs text-slate-400">
              FlowPilot uses structured AI to propose a complete validated DAG with node configurations.
            </p>
          </div>

          <button
            onClick={() => setAiModalOpen(true)}
            disabled={creating}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
          >
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </button>
        </div>

        {/* Templates Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Or Select a Starter Blueprint</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STARTER_TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleCreateWithTemplate(tmpl)}
                  disabled={creating}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left transition hover:border-slate-700 hover:bg-slate-850 disabled:opacity-50"
                >
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="mt-4 text-sm font-semibold text-white">{tmpl.title}</h4>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-3">{tmpl.description}</p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                    <span>Use Blueprint</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AiGeneratorModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onApplyProposal={handleApplyAiProposal}
      />
    </AppLayout>
  );
}
