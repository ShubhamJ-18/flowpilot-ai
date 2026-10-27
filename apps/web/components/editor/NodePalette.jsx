'use client';

import React from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import { NODE_REGISTRY } from '@flowpilot/shared';

export default function NodePalette({ isOpen, onClose, onAddNode }) {
  if (!isOpen) return null;

  const nodeTypes = Object.values(NODE_REGISTRY);

  return (
    <div className="absolute left-4 top-4 z-20 flex w-72 max-h-[calc(100%-2rem)] flex-col rounded-xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 p-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Add Workflow Node</h3>
        </div>
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {nodeTypes.map((spec) => (
          <button
            key={spec.type}
            onClick={() => onAddNode(spec.type)}
            className="flex w-full items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5 text-left transition hover:border-indigo-500/40 hover:bg-slate-800/60"
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
              <Plus className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">{spec.displayName}</span>
                <span className="text-[10px] uppercase font-mono text-slate-500">{spec.category}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">{spec.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
