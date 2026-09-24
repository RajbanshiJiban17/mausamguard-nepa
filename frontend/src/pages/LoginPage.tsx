import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  KeyRound
} from 'lucide-react';
import { api } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('MausamGuardAdmin2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({
        username_or_email: username,
        password: password,
      });

      if (res.access_token) {
        localStorage.setItem('mg_access_token', res.access_token);
        localStorage.setItem('mg_user', JSON.stringify(res.user));
        navigate('/admin');
      } else {
        throw new Error('Access token was not returned.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <DisclaimerBanner />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-950/80 border border-blue-800/80 text-blue-400 mb-2">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              Operational Portal Access
            </h1>
            <p className="text-xs text-slate-400">
              Sign in with your role-authorized credentials to manage early warning alerts, ingestion tasks, and security audit logs.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs text-white pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Secret Passphrase
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs text-white pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Operator Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Evaluation Notice */}
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl text-[11px] space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              <span>Evaluation Seed Credentials</span>
            </div>
            <div className="text-slate-400 font-mono text-[10px]">
              User: <span className="text-white">admin</span> | Role: <span className="text-emerald-400">ADMIN</span>
            </div>
            <div className="text-slate-400 font-mono text-[10px]">
              Pass: <span className="text-white">MausamGuardAdmin2026!</span>
            </div>
          </div>
        </div>
      </main>

      <div className="py-4 text-center text-xs text-slate-500">
        MausamGuard Nepal • Secure Role-Based Access Control (RBAC) System
      </div>
    </div>
  );
}
