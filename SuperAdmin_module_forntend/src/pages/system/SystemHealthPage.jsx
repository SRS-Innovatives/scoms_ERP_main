import React, { useEffect, useState } from 'react';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import { Activity, Server, Database, ShieldCheck, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import systemService from '../../services/systemService';

const INTEGRATION_LABELS = { email: 'Email (SMTP)', sms: 'SMS Gateway', whatsapp: 'WhatsApp Gateway', payments: 'Razorpay Payments' };

const formatUptime = (seconds) => {
  if (seconds === undefined) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${seconds % 60}s`;
};

export const SystemHealthPage = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    systemService.getHealth()
      .then((res) => setHealth(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const dbUpCount = health?.services?.filter((s) => s.database?.status === 'UP').length || 0;
  const avgLatency = health?.services?.length
    ? Math.round(health.services.reduce((sum, s) => sum + (s.database?.latencyMs || 0), 0) / health.services.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="System & Health" subtitle="Real service reachability, database latency, and integration mode — measured live, not simulated numbers." />
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 rounded-xl">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Platform Status"
          value={health?.overallStatus === 'OPERATIONAL' ? 'Operational' : 'Degraded'}
          icon={health?.overallStatus === 'OPERATIONAL' ? ShieldCheck : ShieldAlert}
          color={health?.overallStatus === 'OPERATIONAL' ? 'emerald' : 'rose'}
        />
        <StatCard title="Services Reachable" value={`${health?.services?.filter((s) => s.reachable).length || 0} / ${health?.services?.length || 0}`} icon={Server} color="indigo" />
        <StatCard title="Databases Up" value={`${dbUpCount} / ${health?.services?.length || 0}`} icon={Database} color="sky" />
        <StatCard title="Avg DB Latency" value={`${avgLatency}ms`} icon={Activity} color="purple" />
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Backend Service Status</h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {health?.services?.map((s) => (
            <div key={s.key} className="py-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{s.name} <span className="text-slate-400 font-normal">:{s.port}</span></p>
                <p className="text-[11px] text-slate-500">
                  {s.reachable ? `Uptime: ${formatUptime(s.uptimeSeconds)} • DB: ${s.database?.status} (${s.database?.latencyMs ?? '—'}ms) • Mem: ${s.memory?.rssMB ?? '—'} MB` : `Unreachable — ${s.error}`}
                </p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${s.reachable && s.database?.status === 'UP' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' : 'bg-rose-100 dark:bg-rose-950 text-rose-700'}`}>
                {s.reachable && s.database?.status === 'UP' ? 'Healthy' : s.reachable ? 'Degraded' : 'Down'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Integration Mode</h3>
        <p className="text-slate-500">Whether each external channel is configured with real credentials or running in the built-in simulated fallback.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(health?.integrations || {}).map(([key, mode]) => (
            <div key={key} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-700 dark:text-slate-300">{INTEGRATION_LABELS[key] || key}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${mode === 'LIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {mode === 'LIVE' ? 'Live' : 'Simulated'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPage;
