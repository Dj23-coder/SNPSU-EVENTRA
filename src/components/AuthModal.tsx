import React, { useState } from 'react';
import { X, Lock, Mail, Building2, ShieldCheck, ArrowRight, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, quickLoginAs, submitAccessRequest } = useAuth();
  const [mode, setMode] = useState<'login' | 'request'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Request access form state
  const [reqClubName, setReqClubName] = useState('');
  const [reqCoordinator, setReqCoordinator] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqCategory, setReqCategory] = useState('Technical');
  const [reqReason, setReqReason] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        onClose();
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch {
      setError('An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reqClubName.trim() || !reqCoordinator.trim() || !reqEmail.trim() || !reqPhone.trim()) {
      setError('All fields are required to submit an access request.');
      return;
    }

    submitAccessRequest({
      clubName: reqClubName.trim(),
      coordinatorName: reqCoordinator.trim(),
      email: reqEmail.trim().toLowerCase(),
      phone: reqPhone.replace(/\D/g, '').slice(-10),
      category: reqCategory,
      reason: reqReason.trim(),
    });

    setRequestSubmitted(true);
  };

  const handleDemoLogin = (clubIdOrAdmin: string) => {
    const res = quickLoginAs(clubIdOrAdmin);
    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Login failed.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with SVG Logo */}
        <div className="px-6 py-5 bg-[#0F1B2D] text-white flex items-center justify-between">
          <div>
            <div className="text-white drop-shadow-md">
              <Logo size="sm" showUniversitySlot={false} />
            </div>
            <p className="text-[11px] text-emerald-200 mt-1 font-medium">
              Official Club Coordinator & Admin Access
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Request Access */}
        <div className="grid grid-cols-2 border-b border-slate-200 text-xs font-bold text-center">
          <button
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-3 transition border-b-2 ${
              mode === 'login'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('request');
              setError('');
            }}
            className={`py-3 transition border-b-2 ${
              mode === 'request'
                ? 'border-purple-600 text-purple-800 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Request Club Access
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Club accounts are created manually in Firebase by the <strong>Student Affairs Admin</strong>. Self-signup is disabled to preserve campus authenticity.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. codecraft@snpsu.edu.in or admin"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Demo Switcher */}
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  1-Click Demo Profiles (Testing):
                </p>

                <div className="space-y-1.5">
                  <button
                    onClick={() => handleDemoLogin('admin')}
                    className="w-full text-left p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-700" />
                      <span>University Admin</span>
                    </div>
                    <span className="text-[10px] bg-purple-200 px-1.5 py-0.5 rounded">Admin</span>
                  </button>

                  <button
                    onClick={() => handleDemoLogin('club-codecraft')}
                    className="w-full text-left p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <span>SNPSU CodeCraft (Technical)</span>
                    </div>
                    <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded">Club</span>
                  </button>

                  <button
                    onClick={() => handleDemoLogin('club-cultural')}
                    className="w-full text-left p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-rose-700" />
                      <span>Sapthagiri Cultural Guild</span>
                    </div>
                    <span className="text-[10px] bg-rose-200 px-1.5 py-0.5 rounded">Club</span>
                  </button>
                </div>
              </div>
            </>
          ) : requestSubmitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">Request Submitted</h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Your club registration request has been forwarded to the Student Affairs Office (Admin). Once approved, you will receive login setup credentials.
              </p>
              <button
                onClick={() => {
                  setRequestSubmitted(false);
                  setMode('login');
                }}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            /* Request Access Form */
            <form onSubmit={handleRequestSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Club / Initiative Name *
                </label>
                <input
                  type="text"
                  required
                  value={reqClubName}
                  onChange={e => setReqClubName(e.target.value)}
                  placeholder="e.g. SNPSU Astronomy Club"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lead Coordinator Name *
                </label>
                <input
                  type="text"
                  required
                  value={reqCoordinator}
                  onChange={e => setReqCoordinator(e.target.value)}
                  placeholder="e.g. Amit K"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Proposed Official Email *
                </label>
                <input
                  type="email"
                  required
                  value={reqEmail}
                  onChange={e => setReqEmail(e.target.value)}
                  placeholder="e.g. astronomy@snpsu.edu.in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={reqCategory}
                    onChange={e => setReqCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Entrepreneurship">Entrepreneurship</option>
                    <option value="Robotics">Robotics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    WhatsApp (10 digits) *
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={reqPhone}
                    onChange={e => setReqPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9845012345"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Brief Purpose / Faculty Advisor
                </label>
                <textarea
                  rows={2}
                  value={reqReason}
                  onChange={e => setReqReason(e.target.value)}
                  placeholder="Faculty coordinator, department, or scope of events..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                Submit Request to Student Affairs
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
