import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { Server, ShieldCheck, Key, Clock, Plug, Gauge, Globe, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import infraService from '../../services/infraService';

const MODE_STYLE = {
  LIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  SIMULATED: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  OFF: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};
const INTEGRATION_LABEL = { email: 'Email (SMTP)', sms: 'SMS gateway', whatsapp: 'WhatsApp', payments: 'Online payments (Razorpay)', ai: 'AI tutor (OpenAI)', pushNotifications: 'Phone push notifications' };
const uptime = (s) => {
  const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600); const m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
};

const Card = ({ icon: Icon, title, children }) => (
  <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2"><Icon className="w-4 h-4 text-indigo-500" /> {title}</h3>
    {children}
  </div>
);

/**
 * API Management — how the platform API is actually configured and running right now:
 * endpoints, protection (rate limits, request size, CORS, sign-in token lifetimes), which
 * integrations are live, the platform switches, and the real API keys that exist (each
 * institution's public admission-form key). Read-only — these are set in code / server
 * settings, and the switches on their own pages.
 */
export const ApiManagementPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    infraService.getApi()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message || 'Could not read the API settings'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (error) {
    return (
      <div className="glass-card p-10 rounded-2xl border border-rose-200 dark:border-rose-900 text-center space-y-3 text-xs">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-slate-700 dark:text-slate-300">{error}</p>
        <button onClick={load} className="px-3.5 py-2 font-semibold text-white bg-indigo-600 rounded-xl">Try again</button>
      </div>
    );
  }

  const live = Object.values(data.integrations).filter((v) => v === 'LIVE').length;
  const flagsOff = data.featureFlags.filter((f) => !f.enabled);

  return (
    <div className="space-y-6">
      <PageHeader title="API Management" subtitle="How the SCOMS API is configured and running right now — read live from the server." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Server" value={data.environment === 'production' ? 'Production' : data.environment} subtitle={`Node ${data.nodeVersion}${data.region ? ` · ${data.region}` : ''}`} icon={Server} color="indigo" />
        <StatCard title="Up for" value={uptime(data.uptimeSeconds)} subtitle={data.release ? `Release ${data.release}` : 'Since the last restart'} icon={Clock} color="emerald" />
        <StatCard title="Integrations live" value={`${live} of ${Object.keys(data.integrations).length}`} subtitle="Others simulated or off" icon={Plug} color="indigo" />
        <StatCard title="Platform status" value={data.maintenanceMode ? 'Maintenance' : flagsOff.length ? `${flagsOff.length} switched off` : 'All on'} subtitle={data.maintenanceMode ? 'Portals show "Under maintenance"' : 'Maintenance mode off'} icon={ShieldCheck} color={data.maintenanceMode || flagsOff.length ? 'rose' : 'emerald'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card icon={Globe} title="Endpoints">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.apis.map((a) => (
              <li key={a.basePath} className="flex justify-between gap-3 py-1.5"><span className="font-semibold text-slate-800 dark:text-slate-200">{a.name}</span><code className="font-mono text-slate-500">{a.basePath}</code></li>
            ))}
          </ul>
        </Card>

        <Card icon={Gauge} title="Protection">
          <ul className="space-y-1.5">
            {data.rateLimits.map((r) => (
              <li key={r.label} className="flex justify-between gap-3"><span className="text-slate-700 dark:text-slate-300">{r.label}</span><span className="font-semibold whitespace-nowrap">{r.max} per {r.windowMinutes} min</span></li>
            ))}
            <li className="flex justify-between gap-3"><span className="text-slate-700 dark:text-slate-300">Largest request accepted</span><span className="font-semibold">{data.requestBodyLimit}</span></li>
            <li className="flex justify-between gap-3"><span className="text-slate-700 dark:text-slate-300">Sign-in lasts</span><span className="font-semibold">{data.tokens.accessExpires} (renewable for {data.tokens.refreshExpires})</span></li>
            <li className="flex justify-between gap-3">
              <span className="text-slate-700 dark:text-slate-300">Websites allowed to call the API (CORS)</span>
              <span className={`font-semibold text-right ${data.cors.open ? 'text-amber-600' : ''}`}>{data.cors.open ? 'Any website' : data.cors.origins.join(', ')}</span>
            </li>
          </ul>
          {data.cors.open && <p className="text-[11px] text-amber-600">Tip: set CORS_ORIGINS on the server to your portal addresses so only your own websites can call the API.</p>}
        </Card>

        <Card icon={Plug} title="Integrations">
          <ul className="space-y-1.5">
            {Object.entries(data.integrations).map(([k, v]) => (
              <li key={k} className="flex justify-between gap-3">
                <span className="text-slate-700 dark:text-slate-300">{INTEGRATION_LABEL[k] || k}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${MODE_STYLE[v] || MODE_STYLE.OFF}`}>{v === 'LIVE' ? 'Live' : v === 'SIMULATED' ? 'Simulated' : 'Off'}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-400">"Simulated" means no real credentials are set on the server — messages and payments are logged, not really sent.</p>
        </Card>

        <Card icon={ShieldCheck} title="Platform switches">
          <ul className="space-y-1.5">
            <li className="flex justify-between gap-3"><span className="text-slate-700 dark:text-slate-300">Maintenance mode</span><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${data.maintenanceMode ? MODE_STYLE.SIMULATED : MODE_STYLE.LIVE}`}>{data.maintenanceMode ? 'On' : 'Off'}</span></li>
            {data.featureFlags.map((f) => (
              <li key={f.key} className="flex justify-between gap-3"><span className="text-slate-700 dark:text-slate-300">{f.name}</span><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.enabled ? MODE_STYLE.LIVE : MODE_STYLE.OFF}`}>{f.enabled ? 'On' : 'Off'}</span></li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-400">Change these on <Link to="/super-admin/maintenance" className="text-indigo-600 hover:underline">Maintenance Mode</Link> and <Link to="/super-admin/feature-flags" className="text-indigo-600 hover:underline">Feature Flags</Link>.</p>
        </Card>
      </div>

      <Card icon={Key} title={`API keys (${data.apiKeys.length})`}>
        {data.apiKeys.length === 0 ? (
          <p className="text-slate-500">No API keys have been issued. Institutions create a key for their public admission form in their own Front Office settings.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr><th className="py-2 pr-3">Institution</th><th className="py-2 pr-3">Used for</th><th className="py-2 pr-3">Key</th><th className="py-2">Institution status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.apiKeys.map((k) => (
                <tr key={k.code}>
                  <td className="py-1.5 pr-3 font-semibold">{k.institution} <span className="font-mono text-slate-400">{k.code}</span></td>
                  <td className="py-1.5 pr-3">{k.purpose}</td>
                  <td className="py-1.5 pr-3 font-mono">{k.key}</td>
                  <td className="py-1.5">{k.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="flex justify-end">
        <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>
    </div>
  );
};

export default ApiManagementPage;
