'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import {
  Blocks,
  Plus,
  Trash2,
  Lock,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [provider, setProvider] = useState('WEBHOOK');
  const [displayName, setDisplayName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    try {
      setLoading(true);
      const res = await api.listIntegrations();
      setIntegrations(res.data.integrations || []);
    } catch {
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddIntegration(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.createIntegration({
        provider,
        displayName,
        credentials: { url: targetUrl },
      });

      setModalOpen(false);
      setDisplayName('');
      setTargetUrl('');
      await loadIntegrations();
    } catch (err) {
      setError(err.message || 'Failed to save integration.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to revoke and delete this integration?')) return;
    try {
      await api.deleteIntegration(id);
      setIntegrations((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete integration.');
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Configured Integrations</h1>
            <p className="text-xs text-slate-400">Secure third-party webhook and API credentials encrypted at rest.</p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Add Integration
          </button>
        </div>

        {/* Security Banner */}
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-300">Zero-Plaintext Credential Storage</h4>
            <p className="text-[11px] text-slate-400">
              All credentials and auth tokens are encrypted using AES-256-GCM. Stored secrets are never serialized into frontend responses.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : integrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400">
              <Blocks className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-white">No integrations configured</h3>
            <p className="mt-1 text-xs text-slate-500">Connect outbound webhook endpoints to trigger external actions safely.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-400">
                      {item.provider}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-white">{item.displayName}</h3>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">Configured: {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="mt-6 flex justify-end border-t border-slate-800/80 pt-3">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Integration Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-white">Configure New Integration</h3>
              <button onClick={() => setModalOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddIntegration} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300">Integration Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="WEBHOOK">Webhook Destination</option>
                  <option value="SLACK">Slack Incoming Webhook</option>
                  <option value="EMAIL">Notification Dispatcher</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Display Label</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Production Alerts Endpoint"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Target URL / Secret</label>
                <input
                  type="url"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://webhook.site/..."
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-slate-500">SSRF protected: private IPs are strictly rejected.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save & Encrypt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
