'use client';

import React, { useState } from 'react';
import { Sparkles, X, Loader2, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

const EXAMPLE_PROMPTS = [
  'Every morning, analyze customer support tickets, classify their urgency, summarize the important issues, and prepare a report.',
  'Extract customer name, invoice amount, and due date from raw document text, format the JSON, and create a report digest.',
  'Classify incoming user feedback into bug, feature_request, or praise. If bug, route to manager approval.',
];

export default function AiGeneratorModal({ isOpen, onClose, onApplyProposal }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proposalData, setProposalData] = useState(null);

  if (!isOpen) return null;

  async function handleGenerate(e) {
    e?.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setProposalData(null);

    try {
      const res = await api.generateWorkflow(prompt);
      setProposalData(res.data);
    } catch (err) {
      setError(err.message || 'Workflow generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (proposalData?.proposal) {
      onApplyProposal(proposalData.proposal);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Generate Workflow with AI</h3>
              <p className="text-xs text-slate-400">Describe your process in plain English and FlowPilot will construct the graph.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleGenerate} className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workflow Description
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Ingest customer inquiries, classify their sentiment, summarize problems, and generate an executive report."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
            />

            {/* Quick Examples */}
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-slate-500">Quick Templates:</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(p)}
                    className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-slate-700 hover:text-indigo-300"
                  >
                    {p.slice(0, 48)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Graph...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Structured Proposal
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Proposal Review */}
          {proposalData && (
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Validated Workflow Proposal Ready
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {proposalData.proposal.nodes.length} Nodes • {proposalData.proposal.edges.length} Connections
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-100">{proposalData.proposal.name}</h4>
                <p className="text-xs text-slate-400">{proposalData.proposal.description}</p>
              </div>

              <div className="rounded-lg bg-slate-950 p-2.5 text-xs text-slate-300">
                <span className="font-semibold text-indigo-400">Architecture Explanation: </span>
                {proposalData.proposal.explanation}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500"
                >
                  Apply to Visual Canvas
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
