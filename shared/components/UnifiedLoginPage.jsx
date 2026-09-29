import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  UserCheck,
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  School,
  Sparkles,
} from 'lucide-react';

export const MODULE_ROLES = [
  {
    id: 'SUPER_ADMIN',
    name: 'Super Admin',
    subtitle: 'Platform Control',
    icon: ShieldCheck,
    port: 5001,
    frontendPort: 5173,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    activeRing: 'ring-amber-600 border-amber-600',
    inputPlaceholder: 'superadmin@scoms.in',
    inputLabel: 'Super Admin Email',
    buttonColor: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-600',
    demoUser: {
      identifier: 'superadmin@scoms.in',
      password: 'Password@123',
      roleName: 'Super Admin',
    },
    redirectUrl: '/super-admin/dashboard',
    apiPrefix: '/api/v1/super-admin',
    forgotPasswordUrl: '/super-admin/forgot-password',
  },
  {
    id: 'INSTITUTE_ADMIN',
    name: 'Institute Admin',
    subtitle: 'School Management',
    icon: Building2,
    port: 5002,
    frontendPort: 5174,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    activeRing: 'ring-indigo-600 border-indigo-600',
    inputPlaceholder: 'admin@dpis-delhi.edu.in',
    inputLabel: 'Institute Admin Email',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-600',
    demoUser: {
      identifier: 'admin@dpis-delhi.edu.in',
      password: 'Password@123',
      roleName: 'Institute Admin',
    },
    redirectUrl: '/admin/dashboard',
    apiPrefix: '/api/v1/admin',
    forgotPasswordUrl: '/admin/forgot-password',
  },
  {
    id: 'STAFF',
    name: 'Staff & Faculty',
    subtitle: 'Teachers & HODs',
    icon: UserCheck,
    port: 5003,
    frontendPort: 5175,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    activeRing: 'ring-emerald-600 border-emerald-600',
    inputPlaceholder: 'EMP-2025-0001 or email',
    inputLabel: 'Employee Code / Email',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600',
    demoUser: {
      identifier: 'teacher@dpis-delhi.edu.in',
      password: 'Password@123',
      roleName: 'Staff / Faculty',
    },
    redirectUrl: '/staff/dashboard',
    apiPrefix: '/api/v1/staff',
    forgotPasswordUrl: '/staff/forgot-password',
  },
  {
    id: 'STUDENT',
    name: 'Student & Parent',
    subtitle: 'Academics & Fees',
    icon: GraduationCap,
    port: 5004,
    frontendPort: 5176,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    activeRing: 'ring-purple-600 border-purple-600',
    inputPlaceholder: 'ADM/2025/00001 or email',
    inputLabel: 'Admission Number / Email',
    buttonColor: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-600',
    demoUser: {
      identifier: 'arun.kumar@student.dpis.edu.in',
      password: 'Password@123',
      roleName: 'Student',
    },
    redirectUrl: '/student/dashboard',
    apiPrefix: '/api/v1/student',
    forgotPasswordUrl: '/student/forgot-password',
  },
];

// Demo-credential autofill and the pre-filled-password banner are dev-tooling, not
// something a real deployment should ship — import.meta.env.DEV is false in every
// `vite build` output (what actually gets deployed), true only under `vite`/`vite dev`,
// so this needs no separate config flag to stay off in production.
const isDevEnvironment = Boolean(import.meta.env?.DEV);

export const UnifiedLoginPage = ({ defaultRole = 'INSTITUTE_ADMIN', onCustomLoginSuccess }) => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(
    MODULE_ROLES.find((m) => m.id === defaultRole) || MODULE_ROLES[1]
  );
  const [identifier, setIdentifier] = useState(isDevEnvironment ? activeModule.demoUser.identifier : '');
  const [password, setPassword] = useState(isDevEnvironment ? activeModule.demoUser.password : '');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleModuleSelect = (moduleItem) => {
    setActiveModule(moduleItem);
    setIdentifier(isDevEnvironment ? moduleItem.demoUser.identifier : '');
    setPassword(isDevEnvironment ? moduleItem.demoUser.password : '');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMessage('Please provide both your identifier and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const targetPort = activeModule.port;
    const backendUrl = `http://localhost:${targetPort}${activeModule.apiPrefix}/auth/login`;

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          email: identifier,
          admissionNumber: identifier,
          employeeCode: identifier,
          password,
          targetRole: activeModule.id,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const { user, accessToken, refreshToken, redirectUrl } = result.data;

        // A success response with no real token is a backend bug, not something to
        // paper over with a fake token string — that would silently send the user
        // into the app carrying credentials that will fail on the very first
        // authenticated request, with no indication why.
        if (!accessToken || !refreshToken) {
          throw new Error('Login succeeded but the server did not return a session token. Please try again or contact support.');
        }

        setSuccessMessage('Authentication successful. Redirecting...');

        localStorage.setItem('scoms_access_token', accessToken);
        localStorage.setItem('scoms_refresh_token', refreshToken);
        localStorage.setItem('scoms_user', JSON.stringify(user));
        localStorage.setItem('scoms_current_role', user.role || activeModule.id);

        // Set role/module-specific tokens and user details
        if (user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN') {
          localStorage.setItem('scoms_superadmin_token', accessToken);
          localStorage.setItem('scoms_superadmin_user', JSON.stringify(user));
        } else if (user.role === 'INSTITUTE_ADMIN') {
          localStorage.setItem('scoms_admin_token', accessToken);
          localStorage.setItem('scoms_admin_user', JSON.stringify(user));
        } else if ([
          'PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STAFF',
          'ACCOUNTANT', 'LIBRARIAN', 'TRANSPORT_MANAGER', 'HOSTEL_WARDEN',
          'EXAM_ADMIN', 'PLACEMENT_OFFICER'
        ].includes(user.role)) {
          localStorage.setItem('scoms_staff_token', accessToken);
          localStorage.setItem('scoms_staff_user', JSON.stringify(user));
        } else if (user.role === 'STUDENT' || user.role === 'PARENT') {
          localStorage.setItem('scoms_student_token', accessToken);
          localStorage.setItem('scoms_student_user', JSON.stringify(user));
        }

        if (onCustomLoginSuccess) {
          onCustomLoginSuccess(user, accessToken, activeModule.id);
        }

        setTimeout(() => {
          const targetFrontendPort = activeModule.frontendPort;
          const finalUrl = redirectUrl || activeModule.redirectUrl;
          if (window.location.port && window.location.port !== String(targetFrontendPort)) {
            window.location.href = `http://localhost:${targetFrontendPort}${finalUrl}`;
          } else {
            navigate(finalUrl);
          }
        }, 800);
      } else {
        throw new Error(result.message || 'Invalid credentials provided.');
      }
    } catch (err) {
      console.error('[SCOMS Unified Auth] Backend call failed:', err.message);
      setErrorMessage(err.message || 'Failed to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Left Pane - Branding & Graphic (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-[#0B0F19] overflow-hidden flex-col justify-between p-12">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
              <School className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                SCOMS <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">Enterprise</span>
              </h1>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 text-xs font-medium backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Unified Education Platform
            </div>
            <h2 className="text-4xl xl:text-5xl font-semibold text-white leading-[1.15] tracking-tight">
              Manage your institution with intelligent precision.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed font-light">
              A centralized ecosystem seamlessly connecting administrators, faculty, students, and parents in one secure environment.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-slate-500 font-medium">
          <p>© 2026 SCOMS Solutions Inc.</p>
          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 xl:p-24 relative bg-gray-50/50">
        <div className="w-full max-w-[480px]">
          
          {/* Mobile Header (Visible only on small screens) */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <School className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              SCOMS <span className="text-indigo-600">ERP</span>
            </h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2 text-sm">Select your portal and enter your credentials to continue.</p>
          </div>

          {/* Role Selector Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {MODULE_ROLES.map((m) => {
              const Icon = m.icon;
              const isSelected = activeModule.id === m.id;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModuleSelect(m)}
                  className={`relative text-left p-4 rounded-2xl border transition-all duration-200 group ${
                    isSelected 
                      ? `bg-white ${m.activeRing} shadow-sm ring-1` 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg ${isSelected ? m.bgColor : 'bg-gray-100 group-hover:bg-gray-200 transition-colors'}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? m.color : 'text-gray-500'}`} />
                    </div>
                    {isSelected && (
                      <div className={`w-2 h-2 rounded-full ${m.bgColor.replace('bg-', 'bg-').replace('50', '500')}`} />
                    )}
                  </div>
                  <h3 className={`font-semibold text-sm ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                    {m.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{m.subtitle}</p>
                </button>
              );
            })}
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {activeModule.inputLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeModule.inputPlaceholder}
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-shadow"
                  style={{
                    '--tw-ring-color': `var(--tw-colors-${activeModule.color.split('-')[1]}-500)`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => navigate(activeModule.forgotPasswordUrl)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="block w-full pl-11 pr-11 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className={`w-5 h-5 rounded border border-gray-300 bg-white peer-checked:${activeModule.buttonColor.split(' ')[0]} peer-checked:border-transparent transition-all`}></div>
                  <CheckCircle2 className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Remember for 30 days</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white ${activeModule.buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to {activeModule.name}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill helper banner — dev builds only, see isDevEnvironment above */}
          {isDevEnvironment && (
            <div className="mt-10 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 text-center flex flex-wrap items-center justify-center gap-2">
                <span>Demo credentials pre-filled.</span>
                <span className="flex items-center gap-1.5">
                  Test Password: <code className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-gray-200">Password@123</code>
                </span>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default UnifiedLoginPage;
