'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/auth-context';
import { User, Shield, Key, Cpu, Database } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Account & Environment Settings</h1>
          <p className="text-xs text-slate-400">Manage user identity, security parameters, and platform environment.</p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">User Profile</h3>
              <p className="text-xs text-slate-400">Authenticated user identity and role assignment.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</span>
              <p className="mt-1 text-sm font-medium text-slate-200">{user?.name}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Email Address</span>
              <p className="mt-1 text-sm font-medium text-slate-200">{user?.email}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Role</span>
              <p className="mt-1 font-mono text-xs font-bold text-indigo-400">{user?.role}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Member Since</span>
              <p className="mt-1 text-xs text-slate-400">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
              </p>
            </div>
          </div>
        </div>

        {/* Architecture & Security Specifications */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Platform Security Architecture</h3>
              <p className="text-xs text-slate-400">Core operational guarantees enforced by FlowPilot AI.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs text-slate-300">
            <div className="flex items-start gap-2.5 rounded-lg bg-slate-950 p-3">
              <Key className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Server-Side PostgreSQL Sessions: </span>
                <span>Session IDs are stored as cryptographic SHA-256 hashes and delivered via HttpOnly, SameSite=Lax cookies.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg bg-slate-950 p-3">
              <Cpu className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Zero Arbitrary Code Execution: </span>
                <span>AI generates only structured JSON graphs matching the strict 12-node registry. Template interpolation and conditions run via sandboxed declarative parsers.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg bg-slate-950 p-3">
              <Database className="h-4 w-4 shrink-0 text-purple-400 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Immutable Version Snapshots: </span>
                <span>Executing workflows creates an immutable version record, ensuring audits and reruns maintain exact historical fidelity.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
