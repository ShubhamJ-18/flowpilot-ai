'use client';

import React from 'react';
import { X, Trash2, HelpCircle } from 'lucide-react';
import { NODE_REGISTRY } from '@flowpilot/shared';

export default function NodeConfigDrawer({ selectedNode, onUpdateNode, onDeleteNode, onClose }) {
  if (!selectedNode) return null;

  const { id, type, data } = selectedNode;
  const config = data?.config || {};
  const spec = NODE_REGISTRY[type] || {};

  function handleConfigChange(key, value) {
    onUpdateNode(id, {
      ...data,
      config: {
        ...config,
        [key]: value,
      },
    });
  }

  function handleLabelChange(e) {
    onUpdateNode(id, {
      ...data,
      label: e.target.value,
    });
  }

  return (
    <div className="absolute right-4 top-4 z-20 flex w-80 max-h-[calc(100%-2rem)] flex-col rounded-xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{data.label || spec.displayName || type}</h3>
          <p className="font-mono text-xs text-slate-500">ID: {id}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body with Scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Label */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Display Label</label>
          <input
            type="text"
            value={data.label || ''}
            onChange={handleLabelChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Dynamic Fields by Type */}
        {type === 'TEXT_TEMPLATE' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Template String</label>
            <textarea
              rows={4}
              value={config.template || ''}
              onChange={(e) => handleConfigChange('template', e.target.value)}
              placeholder="e.g. Ticket analysis: {{summarize_1.summary}}"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Use <code className="text-indigo-400">{'{{nodeId.field}}'}</code> to safely inject upstream values.
            </p>
          </div>
        )}

        {type === 'CONDITION' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Field Reference</label>
              <input
                type="text"
                value={config.field || ''}
                onChange={(e) => handleConfigChange('field', e.target.value)}
                placeholder="classify_1.category"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Comparison Operator</label>
              <select
                value={config.operator || 'equals'}
                onChange={(e) => handleConfigChange('operator', e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="equals">Equals (case-insensitive)</option>
                <option value="not_equals">Does Not Equal</option>
                <option value="contains">Contains Substring</option>
                <option value="greater_than">Greater Than (&gt;)</option>
                <option value="less_than">Less Than (&lt;)</option>
                <option value="in">In List</option>
                <option value="is_empty">Is Empty / Null</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Target Value</label>
              <input
                type="text"
                value={config.value || ''}
                onChange={(e) => handleConfigChange('value', e.target.value)}
                placeholder="urgent"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {type === 'AI_CLASSIFY' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Input Field</label>
              <input
                type="text"
                value={config.inputField || 'ticket_text'}
                onChange={(e) => handleConfigChange('inputField', e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Categories (comma-separated)</label>
              <input
                type="text"
                value={(config.categories || []).join(', ')}
                onChange={(e) =>
                  handleConfigChange(
                    'categories',
                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="urgent, standard, low, spam"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {type === 'AI_SUMMARIZE' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Length</label>
              <select
                value={config.maxLength || 'concise'}
                onChange={(e) => handleConfigChange('maxLength', e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="concise">Concise (1-2 sentences)</option>
                <option value="medium">Medium (1 paragraph)</option>
                <option value="detailed">Detailed (Multi-point breakdown)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Tone</label>
              <select
                value={config.tone || 'professional'}
                onChange={(e) => handleConfigChange('tone', e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="professional">Professional</option>
                <option value="neutral">Neutral</option>
                <option value="bullet_points">Bullet Points</option>
              </select>
            </div>
          </div>
        )}

        {type === 'DELAY' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Delay Seconds (max 300)</label>
            <input
              type="number"
              min={1}
              max={300}
              value={config.seconds || 5}
              onChange={(e) => handleConfigChange('seconds', parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {type === 'APPROVAL_GATE' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Approval Message Prompt</label>
            <textarea
              rows={3}
              value={config.prompt || ''}
              onChange={(e) => handleConfigChange('prompt', e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {type === 'REPORT_OUTPUT' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Report Title</label>
            <input
              type="text"
              value={config.title || ''}
              onChange={(e) => handleConfigChange('title', e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {type === 'WEBHOOK_ACTION' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Destination URL</label>
              <input
                type="url"
                value={config.url || ''}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                placeholder="https://webhook.site/..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-slate-500">SSRF protected: private IPs strictly blocked.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-800 p-4">
        <button
          onClick={() => onDeleteNode(id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
        >
          <Trash2 className="h-4 w-4" />
          Delete Node
        </button>
      </div>
    </div>
  );
}
