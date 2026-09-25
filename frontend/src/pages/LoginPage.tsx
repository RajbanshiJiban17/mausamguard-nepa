import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { api } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({
        username_or_email: username.trim(),
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
      setError(err.message || 'लगइन प्रमाणीकरण असफल भयो (Authentication failed). कृपया विवरण जाँच्नुहोस्।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <DisclaimerBanner />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-950/80 border border-blue-800/80 text-blue-400 mb-2 shadow-lg shadow-blue-950/50">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              MausamGuard Operator Portal
            </h1>
            <p className="text-xs text-slate-400">
              प्रणाली प्रशासन तथा सुरक्षा प्रमाणीकरण (Role-Based Access Control)
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username or Official Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs text-white pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter authorized username..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password / सुरक्षित पासवर्ड
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs text-white pl-9 pr-10 py-2.5 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>प्रमाणीकरण हुँदैछ (Authenticating)...</span>
                </>
              ) : (
                <>
                  <span>सुरक्षित लगइन गर्नुहोस् (Sign In to Console)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* High Security Guarantee Box */}
          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl text-[11px] space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>उच्च सुरक्षा प्रणाली (High Security & Audit Protection)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              सबै लगइन प्रयासहरू सुरक्षित ईन्क्रिप्सन (Bcrypt Salted Hash) र अडिट लग (Security Audit Trail) मार्फत सुरक्षित गरिएका छन्। संवेदनशील डेटा सुरक्षित रहन्छ।
            </p>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>सार्वजनिक लाइभ पोर्टलमा फर्कनुहोस् (Public Portal)</span>
            </Link>
          </div>
        </div>
      </main>

      <div className="py-4 text-center text-xs text-slate-500">
        MausamGuard Nepal • Secure Role-Based Access Control (RBAC) System
      </div>
    </div>
  );
}
