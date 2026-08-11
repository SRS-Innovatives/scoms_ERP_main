import React, { useState } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useStudentAuth();
  const { success } = useNotification();
  const navigate = useNavigate();

  const [admissionNo, setAdmissionNo] = useState('SCOMS2026CS001');
  const [password, setPassword] = useState('StudentPass123!');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(admissionNo, password);
    success('Logged in to Digital Campus.', 'Welcome Arun Kumar!');
    navigate('/student/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10 bg-slate-900/90 text-white">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg mb-3">
            S
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">SCOMS Student Portal</h2>
          <p className="text-xs text-slate-400 mt-1">One Digital Campus for Every Student</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Admission Number / Email / Phone</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600"
              />
              <span>Remember 30 days</span>
            </label>
            <Link to="/student/forgot-password" className="text-indigo-400 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>Enter Student Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center space-y-2">
          <p className="text-[11px] text-slate-500">Or sign in with Single Sign-On (SSO)</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => handleSubmit({ preventDefault: () => {} })} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200">
              Google Account
            </button>
            <button onClick={() => handleSubmit({ preventDefault: () => {} })} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200">
              Microsoft Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
