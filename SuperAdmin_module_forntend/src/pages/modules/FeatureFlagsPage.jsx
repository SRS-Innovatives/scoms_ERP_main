import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { ToggleLeft, ToggleRight, ShieldCheck, ShieldAlert, Loader2, Power } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import featureFlagService from '../../services/featureFlagService';

/**
 * Feature Flags — platform-wide switches. Each one really turns its feature on or off for
 * every institution (shared/utils/featureFlags.js); changes are saved and audit-logged.
 * Whole modules per institution are managed in Module Manager instead.
 */
export const FeatureFlagsPage = () => {
  const { success, error: showError } = useNotification();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    featureFlagService.getAll()
      .then((r) => setFlags(r.data || []))
      .catch((e) => setLoadError(e.message || 'Could not load feature flags'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (f) => {
    const turningOff = f.enabled;
    if (turningOff && !window.confirm(`Switch OFF "${f.name}" for every institution?\n\n${f.whenOff}`)) return;
    setBusy(f.key);
    try {
      const r = await featureFlagService.set(f.key, !f.enabled);
      setFlags(r.data || []);
      success(r.message);
    } catch (e) {
      showError(e.message || 'Could not change the flag');
    } finally {
      setBusy(null);
    }
  };

  const on = flags.filter((f) => f.enabled).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Feature Flags" subtitle="Platform-wide switches — turning one off stops that feature for every institution at once (e.g. during a gateway outage or to control costs). Modules per institution are managed in Module Manager." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Switches" value={loading ? '—' : String(flags.length)} subtitle="Platform-wide" icon={Power} color="indigo" />
        <StatCard title="On" value={loading ? '—' : String(on)} subtitle="Working normally" icon={ShieldCheck} color="emerald" />
        <StatCard title="Off" value={loading ? '—' : String(flags.length - on)} subtitle="Switched off for everyone" icon={ShieldAlert} color="rose" />
      </div>

      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
        ) : loadError ? (
          <div className="text-center py-10 space-y-2">
            <ShieldAlert className="w-9 h-9 text-rose-400 mx-auto" />
            <p className="text-slate-600 dark:text-slate-300">{loadError}</p>
            <button onClick={load} className="px-3 py-1.5 font-semibold text-white bg-indigo-600 rounded-lg">Try again</button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {flags.map((f) => (
              <li key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{f.name}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.enabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'}`}>{f.enabled ? 'ON' : 'OFF'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{f.description}</p>
                  <p className="text-slate-400"><b>When off:</b> {f.whenOff}</p>
                  {f.updatedAt && <p className="text-slate-400">Last changed {new Date(f.updatedAt).toLocaleString('en-IN')}{f.updatedBy ? ` by ${f.updatedBy}` : ''}</p>}
                </div>
                <button
                  onClick={() => toggle(f)}
                  disabled={busy === f.key}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-white disabled:opacity-50 ${f.enabled ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {busy === f.key ? <Loader2 className="w-4 h-4 animate-spin" /> : f.enabled ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                  {f.enabled ? 'Switch off' : 'Switch on'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FeatureFlagsPage;
