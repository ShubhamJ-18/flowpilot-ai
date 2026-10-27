'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Sparkles, ArrowRight, Loader2, AlertCircle, Shield, User } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickLogin(userEmail) {
    setEmail(userEmail);
    setPassword('Password123!');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Welcome back</h2>
          <p className="mt-1 text-xs text-slate-400">Sign in to manage and execute your automation workflows.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@flowpilot.ai"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <Link href="/forgot-password" className="text-[11px] text-indigo-400 hover:text-indigo-300">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Sign In to FlowPilot
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 border-t border-slate-800 pt-4">
            <p className="mb-2 text-center text-[11px] font-medium text-slate-500">Quick Test Credentials:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('alex@flowpilot.ai')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 py-1.5 text-[11px] font-medium text-slate-300 hover:border-slate-700 hover:text-white"
              >
                <User className="h-3.5 w-3.5 text-indigo-400" />
                Demo User
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@flowpilot.ai')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 py-1.5 text-[11px] font-medium text-slate-300 hover:border-slate-700 hover:text-white"
              >
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                Demo Admin
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
