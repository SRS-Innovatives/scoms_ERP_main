import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const { success } = useNotification();
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    success(`Reset OTP sent to ${email}`, 'OTP Dispatched');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-slate-800 shadow-2xl bg-slate-900/90 text-white space-y-4">
        <h2 className="text-xl font-bold">Reset Super Admin Password</h2>
        <p className="text-xs text-slate-400">Enter your registered email to receive authentication OTP.</p>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@scoms.edu.in"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
          />
          <button type="submit" className="w-full py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl">
            Send Reset OTP
          </button>
        </form>
        <Link to="/super-admin/login" className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
