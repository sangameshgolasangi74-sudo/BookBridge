import { useState } from 'react';
import { X, Eye, EyeOff, ShieldCheck, UserCheck, BookMarked } from 'lucide-react';
import { User, UserRole } from '../types';
import { apiRequest, setStoredSessionToken } from '../lib/api';

interface AuthModalProps {
  open: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User, selectedPortal: UserRole) => void;
  onNotify: (title: string, description?: string, variant?: 'success' | 'error' | 'info') => void;
}

export function AuthModal({
  open,
  initialMode = 'login',
  onClose,
  onSuccess,
  onNotify
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>(initialMode);
  const [portalRole, setPortalRole] = useState<UserRole>('customer');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [registerRole, setRegisterRole] = useState<'customer' | 'owner'>('customer');

  // Password recovery state
  const [recoverStep, setRecoverStep] = useState<'email' | 'verify'>('email');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [issuedDemoCode, setIssuedDemoCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const fillDemoCredentials = (targetRole: UserRole) => {
    setError('');
    setMode('login');
    setPortalRole(targetRole);
    if (targetRole === 'customer') {
      setEmail('maya.lin@university.edu');
      setPassword('Reader@2026');
    } else if (targetRole === 'owner') {
      setEmail('arjun.mehta@presshouse.org');
      setPassword('Owner@2026');
    } else {
      setEmail('admin@bookbridge.org');
      setPassword('AdminBridge#2026');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest<{ user: User; sessionToken: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, portalRole })
      });
      setStoredSessionToken(res.sessionToken);
      onNotify(`Welcome back, ${res.user.name}`, `Signed into ${portalRole} workspace.`);
      onSuccess(res.user, portalRole);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<{ user: User; sessionToken: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role: registerRole,
          phone,
          institution
        })
      });
      setStoredSessionToken(res.sessionToken);
      onNotify('Account created', 'Your BookBridge customer and book owner access is ready.');
      onSuccess(res.user, registerRole);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (recoverStep === 'email') {
        const res = await apiRequest<{ step: string; message: string; demoVerificationCode?: string }>(
          '/api/auth/recover-password',
          {
            method: 'POST',
            body: JSON.stringify({ email })
          }
        );
        setIssuedDemoCode(res.demoVerificationCode || '');
        setRecoverStep('verify');
        onNotify('Verification code ready', res.message, 'info');
      } else {
        const res = await apiRequest<{ step: string; message: string }>('/api/auth/recover-password', {
          method: 'POST',
          body: JSON.stringify({ email, resetCode, newPassword })
        });
        onNotify('Password updated', res.message);
        setMode('login');
        setRecoverStep('email');
        setResetCode('');
        setNewPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#142B45]/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="BookBridge Account Authentication"
        className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-[#142B45] text-white flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">
              {mode === 'login' ? 'Sign In to BookBridge' : mode === 'register' ? 'Create Reader Account' : 'Recover Password'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {mode === 'login'
                ? 'Choose your role portal to access your workspace'
                : mode === 'register'
                  ? 'Register once for both Customer and Book Owner services'
                  : 'Verify your account email to set a new password'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-1.5 text-slate-300 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode Tabs */}
          <div className="flex gap-1 p-1 bg-[#F5F7FA] border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login' ? 'bg-white text-[#142B45] shadow-xs' : 'text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'register' ? 'bg-white text-[#142B45] shadow-xs' : 'text-slate-600'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('recover');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'recover' ? 'bg-white text-[#142B45] shadow-xs' : 'text-slate-600'
              }`}
            >
              Reset Password
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Separate Role Login Portal Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#142B45] mb-1.5">Login Portal</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPortalRole('customer')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      portalRole === 'customer'
                        ? 'border-[#19A68C] bg-[#19A68C]/10 text-[#142B45]'
                        : 'border-slate-200 text-slate-600 hover:bg-[#F5F7FA]'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mb-1 text-[#19A68C]" />
                    <span className="block text-xs font-semibold">Customer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortalRole('owner')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      portalRole === 'owner'
                        ? 'border-[#19A68C] bg-[#19A68C]/10 text-[#142B45]'
                        : 'border-slate-200 text-slate-600 hover:bg-[#F5F7FA]'
                    }`}
                  >
                    <BookMarked className="w-4 h-4 mb-1 text-[#142B45]" />
                    <span className="block text-xs font-semibold">Book Owner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortalRole('admin')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      portalRole === 'admin'
                        ? 'border-[#142B45] bg-[#142B45]/10 text-[#142B45]'
                        : 'border-slate-200 text-slate-600 hover:bg-[#F5F7FA]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 mb-1 text-[#142B45]" />
                    <span className="block text-xs font-semibold">Administrator</span>
                  </button>
                </div>
                {portalRole === 'admin' && (
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Protected portal: administrator accounts cannot be registered publicly.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#142B45] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#19A68C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#142B45] mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 pr-10 bg-[#F5F7FA] border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#19A68C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#142B45]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#142B45] hover:bg-[#1e3e63] disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                {loading ? 'Signing In...' : `Sign In as ${portalRole === 'owner' ? 'Book Owner' : portalRole === 'admin' ? 'Administrator' : 'Customer'}`}
              </button>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-medium text-slate-500 mb-2">
                  Quick Demo Accounts (Autofill):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('customer')}
                    className="py-1.5 px-2 text-xs font-medium bg-[#F5F7FA] hover:bg-slate-200/70 text-[#142B45] rounded-md border border-slate-200"
                  >
                    Customer Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('owner')}
                    className="py-1.5 px-2 text-xs font-medium bg-[#F5F7FA] hover:bg-slate-200/70 text-[#142B45] rounded-md border border-slate-200"
                  >
                    Owner Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('admin')}
                    className="py-1.5 px-2 text-xs font-medium bg-[#F5F7FA] hover:bg-slate-200/70 text-[#142B45] rounded-md border border-slate-200"
                  >
                    Admin Demo
                  </button>
                </div>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#142B45] mb-1">Primary Account Focus</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('customer')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                      registerRole === 'customer'
                        ? 'border-[#19A68C] bg-[#19A68C]/10 text-[#142B45]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Reader / Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterRole('owner')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                      registerRole === 'owner'
                        ? 'border-[#19A68C] bg-[#19A68C]/10 text-[#142B45]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Book Owner / Seller
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  All registered members can use both Customer and Book Owner dashboards.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#142B45] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jordan Patel"
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#142B45] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 014-2200"
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#142B45] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@college.edu"
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#142B45] mb-1">Institution or Neighborhood</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. State Engineering College / Downtown Hub"
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#142B45] mb-1">Password (min 6 characters)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-3 py-2 pr-10 bg-[#F5F7FA] border border-slate-200 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#19A68C] hover:bg-[#158c76] disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                {loading ? 'Creating Account...' : 'Create BookBridge Account'}
              </button>
            </form>
          )}

          {mode === 'recover' && (
            <form onSubmit={handleRecover} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#142B45] mb-1">Registered Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maya.lin@university.edu"
                  className="w-full px-3 py-2.5 bg-[#F5F7FA] border border-slate-200 rounded-lg text-sm"
                />
              </div>

              {recoverStep === 'verify' && (
                <>
                  {issuedDemoCode && (
                    <div className="p-3 bg-[#19A68C]/10 border border-[#19A68C]/30 rounded-lg text-xs text-[#142B45]">
                      Verification code issued: <strong className="font-mono-num">{issuedDemoCode}</strong>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-[#142B45] mb-1">6-Digit Verification Code</label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full px-3 py-2.5 bg-[#F5F7FA] border border-slate-200 rounded-lg text-sm font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#142B45] mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3 py-2.5 bg-[#F5F7FA] border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#142B45] hover:bg-[#1e3e63] text-white font-semibold text-sm rounded-lg"
              >
                {loading
                  ? 'Processing...'
                  : recoverStep === 'email'
                    ? 'Send Verification Code'
                    : 'Confirm Password Reset'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
