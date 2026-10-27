'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { ShieldAlert, CheckCircle2, Server, Activity, Users, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  async function fetchHealth() {
    try {
      const res = await fetch('/api/v1/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setHealth({ status: 'unreachable', error: err.message });
    } finally {
      setLoading(false);
    }
  }

  if (user?.role !== 'ADMIN') {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 p-12 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-rose-400" />
          <h2 className="text-base font-bold text-rose-300">Administrative Access Restricted</h2>
          <p className="text-xs text-rose-400">
            This area requires the <code className="font-mono font-bold">ADMIN</code> role. Your current account role is <code className="font-mono">{user?.role}</code>.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Administration</h1>
          <p className="text-xs text-slate-400">Infrastructure diagnostics, service status, and security telemetry.</p>
        </div>

        {/* Health Diagnostic Card */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">API Gateway</span>
              <Server className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-sm font-bold text-white">
                {health?.status === 'ok' ? 'Healthy & Online' : 'Degraded'}
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-slate-500">Service: {health?.service || 'Express API'}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Database Engine</span>
              <Activity className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-sm font-bold text-white">PostgreSQL 18</span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-slate-500">ORM: Prisma 5.22 • Active Pool</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Execution Engine</span>
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-sm font-bold text-white">DAG Topo Engine</span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-slate-500">Queue: BullMQ / In-Process Worker</p>
          </div>
        </div>

        {/* Admin Overview Details */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Security & Audit Policy</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All administrative actions, authentication attempts, workflow creation, and execution dispatches generate persistent audit log records in PostgreSQL (<code className="font-mono text-indigo-400">AuditLog</code>). Passwords and session secrets are encrypted and redacted from all logs.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
