'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  PlayCircle,
  FileText,
  AlignLeft,
  GitFork,
  Sparkles,
  Tags,
  ScanText,
  FileCode,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Send,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';

const ICON_MAP = {
  MANUAL_TRIGGER: PlayCircle,
  TEXT_INPUT: FileText,
  TEXT_TEMPLATE: AlignLeft,
  CONDITION: GitFork,
  AI_SUMMARIZE: Sparkles,
  AI_CLASSIFY: Tags,
  AI_EXTRACT: ScanText,
  JSON_TRANSFORM: FileCode,
  DELAY: Clock,
  APPROVAL_GATE: ShieldCheck,
  REPORT_OUTPUT: CheckCircle2,
  WEBHOOK_ACTION: Send,
};

const CATEGORY_COLORS = {
  TRIGGER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  INPUT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  LOGIC: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  AI: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  TRANSFORM: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  UTILITY: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  HUMAN: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  INTEGRATION: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  OUTPUT: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

function CustomNode({ data, selected }) {
  const {
    id,
    type,
    label,
    config = {},
    status = 'idle', // 'idle', 'running', 'succeeded', 'failed', 'skipped'
    error,
  } = data;

  const Icon = ICON_MAP[type] || Sparkles;
  const isTrigger = type === 'MANUAL_TRIGGER';
  const isCondition = type === 'CONDITION';

  let borderState = 'border-slate-800 bg-slate-900/90 hover:border-slate-700';
  if (selected) {
    borderState = 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-900';
  }
  if (status === 'running') {
    borderState = 'border-indigo-400 ring-2 ring-indigo-500/50 animate-pulse bg-indigo-950/20';
  } else if (status === 'succeeded') {
    borderState = 'border-emerald-500/80 ring-1 ring-emerald-500/30 bg-emerald-950/10';
  } else if (status === 'failed') {
    borderState = 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/20';
  } else if (status === 'skipped') {
    borderState = 'opacity-50 border-slate-800 bg-slate-950/40';
  }

  // Summary snippet calculation
  let summaryText = '';
  if (type === 'AI_CLASSIFY' && config.categories) {
    summaryText = `Categories: ${config.categories.join(', ')}`;
  } else if (type === 'CONDITION') {
    summaryText = `${config.field || 'field'} ${config.operator || '=='} "${config.value || ''}"`;
  } else if (type === 'TEXT_TEMPLATE') {
    summaryText = config.template ? config.template.slice(0, 35) + '...' : 'No template';
  } else if (type === 'AI_SUMMARIZE') {
    summaryText = `Length: ${config.maxLength || 'concise'} • Tone: ${config.tone || 'pro'}`;
  } else if (type === 'REPORT_OUTPUT') {
    summaryText = config.title || 'Summary Report';
  } else if (type === 'APPROVAL_GATE') {
    summaryText = 'Awaits user approval';
  }

  return (
    <div
      className={`min-w-[220px] max-w-[260px] rounded-xl border p-3.5 shadow-xl backdrop-blur transition-all ${borderState}`}
    >
      {/* Incoming Target Handle (not on trigger) */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-slate-400 hover:!bg-indigo-400"
        />
      )}

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-100 line-clamp-1">{label || type}</h4>
            <span className="font-mono text-[10px] text-slate-500">{id}</span>
          </div>
        </div>

        {/* Status Indicator Badge */}
        {status === 'running' && (
          <span className="flex items-center gap-1 rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running
          </span>
        )}
        {status === 'succeeded' && (
          <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
            <Check className="h-3 w-3" />
            Done
          </span>
        )}
        {status === 'failed' && (
          <span className="flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-medium text-rose-300">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        )}
      </div>

      {/* Node Body / Summary */}
      {summaryText && (
        <div className="mt-2.5 rounded bg-slate-950/60 p-1.5 font-mono text-[11px] text-slate-400 line-clamp-2">
          {summaryText}
        </div>
      )}

      {/* Node Error Display if failed */}
      {error && (
        <div className="mt-2 rounded bg-rose-500/10 p-1.5 text-[11px] font-medium text-rose-400">
          {error}
        </div>
      )}

      {/* Outgoing Source Handles */}
      {isCondition ? (
        <>
          {/* True branch port */}
          <div className="absolute -right-3 top-4 flex items-center gap-1">
            <span className="text-[10px] font-semibold text-emerald-400">True</span>
            <Handle
              type="source"
              id="true"
              position={Position.Right}
              className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-emerald-500 hover:!scale-125"
            />
          </div>
          {/* False branch port */}
          <div className="absolute -right-3 bottom-4 flex items-center gap-1">
            <span className="text-[10px] font-semibold text-rose-400">False</span>
            <Handle
              type="source"
              id="false"
              position={Position.Right}
              className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-rose-500 hover:!scale-125"
            />
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-indigo-500 hover:!scale-125"
        />
      )}
    </div>
  );
}

export default memo(CustomNode);
