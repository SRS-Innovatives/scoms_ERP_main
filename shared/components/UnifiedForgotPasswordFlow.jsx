import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { MODULE_ROLES } from './UnifiedLoginPage';

/**
 * Real 3-step forgot-password flow (request code → verify code → set new password),
 * shared by all 4 portals. Backed by shared/auth/passwordReset.js on each backend.
 */
export const UnifiedForgotPasswordFlow = ({ defaultRole = 'INSTITUTE_ADMIN' }) => {
  const navigate = useNavigate();
  const activeModule = MODULE_ROLES.find((m) => m.id === defaultRole) || MODULE_ROLES[1];

  const [step, setStep] = useState('IDENTIFIER'); // IDENTIFIER | OTP | RESET | DONE
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const apiBase = `http://localhost:${activeModule.port}${activeModule.apiPrefix}`;

  const callApi = async (path, body) => {
    const res = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message || 'Something went wrong.');
    return result;
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await callApi('/auth/forgot-password', { identifier });
      setInfoMessage(result.message);
      setStep('OTP');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      await callApi('/auth/verify-otp', { identifier, otp });
      setInfoMessage('');
      setStep('RESET');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await callApi('/auth/reset-password', { identifier, otp, newPassword });
      setStep('DONE');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-slate-800 shadow-2xl bg-slate-900/90 text-white space-y-5">
        <h2 className="text-xl font-bold">Reset {activeModule.name} Password</h2>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{errorMessage}</p>
          </div>
        )}
        {infoMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-300">{infoMessage}</p>
          </div>
        )}

        {step === 'IDENTIFIER' && (
          <form onSubmit={handleRequestCode} className="space-y-4 text-xs">
            <p className="text-slate-400">Enter your {activeModule.inputLabel.toLowerCase()} to receive a verification code.</p>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={activeModule.inputPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
            <button type="submit" disabled={loading} className={`w-full py-2.5 font-bold text-white rounded-xl disabled:opacity-50 ${activeModule.buttonColor}`}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            <p className="text-slate-400">Enter the 6-digit code sent to your registered email.</p>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white tracking-[0.3em] font-mono"
              />
            </div>
            <button type="submit" disabled={loading} className={`w-full py-2.5 font-bold text-white rounded-xl disabled:opacity-50 ${activeModule.buttonColor}`}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {step === 'RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <p className="text-slate-400">Choose a new password (minimum 8 characters).</p>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
            <button type="submit" disabled={loading} className={`w-full py-2.5 font-bold text-white rounded-xl disabled:opacity-50 ${activeModule.buttonColor}`}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 'DONE' && (
          <div className="text-center space-y-4 py-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm text-slate-300">Your password has been reset. You've been logged out of all sessions for security — please log in with your new password.</p>
            <button onClick={() => navigate(activeModule.forgotPasswordUrl.replace('/forgot-password', '/login'))} className={`w-full py-2.5 font-bold text-white rounded-xl ${activeModule.buttonColor}`}>
              Go to Login
            </button>
          </div>
        )}

        {step !== 'DONE' && (
          <button
            onClick={() => navigate(activeModule.forgotPasswordUrl.replace('/forgot-password', '/login'))}
            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </button>
        )}
      </div>
    </div>
  );
};

export default UnifiedForgotPasswordFlow;
