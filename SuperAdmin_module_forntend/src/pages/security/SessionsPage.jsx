import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { Users, Globe, Monitor, Activity, Trash2, LogOut, Loader2, RefreshCw, ShieldAlert, Search } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import sessionService from '../../services/sessionService';

const PORTAL_LABEL = {
  SUPER_ADMIN: 'Super Admin', INSTITUTE_ADMIN: 'Institute Admin', STAFF: 'Staff', STUDENT: 'Student',
  MOBILE_STAFF: 'Staff app', MOBILE_STUDENT: 'Student app', UNKNOWN: 'Older sign-in',
};
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const ago = (d) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(d)) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
};

/**
 * Active Sessions — every signed-in session across the platform (one per login per device):
 * who, portal, IP, browser / app, signed in, last active. Revoke signs that device out at
 * once; "Sign out everywhere" ends all of one user's sessions.
 */
export const SessionsPage = () => {
  const { success, error: showError } = useNotification();
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [portal, setPortal] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback((page = 1, q = search, p = portal) => {
    setLoading(true);
    setLoadError('');
    sessionService.getSessions({ page, search: q.trim(), portal: p })
      .then((r) => { setData(r.data); setMeta(r.meta || { page: 1, totalPages: 1, total: 0 }); })
      .catch((e) => setLoadError(e.message || 'Could not load sessions'))
      .finally(() => setLoading(false));
  }, [search, portal]);

  useEffect(() => { load(1, search, portal); }, [portal]); // eslint-disable-line react-hooks/exhaustive-deps

  const revoke = async (s) => {
    if (!window.confirm(`Sign ${s.user.email} out of this ${PORTAL_LABEL[s.portal || 'UNKNOWN']} session (${s.client} on ${s.os})?${s.current ? '\n\nThis is YOUR current session — you will be signed out.' : ''}`)) return;
    setBusy(s.id);
    try {
      success((await sessionService.revoke(s.id)).message);
      load(meta.page);
    } catch (e) {
      showError(e.message || 'Could not revoke the session');
    } finally {
      setBusy(null);
    }
  };

  const revokeUser = async (s) => {
    if (!window.confirm(`Sign ${s.user.email} out of ALL their sessions, on every device and portal?`)) return;
    setBusy(`u:${s.user.id}`);
    try {
      success((await sessionService.revokeUser(s.user.id)).message);
      load(1);
    } catch (e) {
      showError(e.message || 'Could not sign the user out');
    } finally {
      setBusy(null);
    }
  };

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <PageHeader title="Active Sessions" subtitle="Everyone signed in to SCOMS right now — one row per sign-in on a device. Revoke signs that device out immediately." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Sessions" value={stats ? fmt(stats.active) : '—'} subtitle={stats ? `${fmt(stats.users)} people signed in` : 'Across all portals'} icon={Users} color="indigo" />
        <StatCard title="Active in last 15 min" value={stats ? fmt(stats.activeLast15Min) : '—'} subtitle="Used the platform recently" icon={Activity} color="emerald" />
        <StatCard title="Desktop / Web" value={stats ? fmt(stats.desktop) : '—'} subtitle="Browsers" icon={Monitor} color="indigo" />
        <StatCard title="Mobile" value={stats ? fmt(stats.mobile) : '—'} subtitle="Phones & the SCOMS apps" icon={Globe} color="indigo" />
      </div>

      {stats && Object.keys(stats.byPortal).length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <button onClick={() => setPortal('')} className={`px-3 py-1.5 rounded-xl font-semibold border ${portal === '' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700'}`}>All ({fmt(stats.active)})</button>
          {Object.entries(stats.byPortal).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
            <button key={k} onClick={() => setPortal(k)} className={`px-3 py-1.5 rounded-xl font-semibold border ${portal === k ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700'}`}>
              {PORTAL_LABEL[k] || k} ({fmt(n)})
            </button>
          ))}
        </div>
      )}

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(1)} placeholder="Search by email, institution or IP…" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
          <button onClick={() => load(1)} className="px-3.5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">Search</button>
          <button onClick={() => load(meta.page)} title="Refresh" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw className="w-4 h-4" /></button>
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
        ) : loadError ? (
          <div className="text-center py-8 space-y-2">
            <ShieldAlert className="w-9 h-9 text-rose-400 mx-auto" />
            <p className="text-slate-600 dark:text-slate-300">{loadError}</p>
            <button onClick={() => load(meta.page)} className="px-3 py-1.5 font-semibold text-white bg-indigo-600 rounded-lg">Try again</button>
          </div>
        ) : !data?.sessions.length ? (
          <p className="text-center text-slate-500 py-10">{search || portal ? 'No sessions match.' : 'Nobody is signed in.'}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr><th className="py-2 pr-3">User</th><th className="py-2 pr-3">Portal</th><th className="py-2 pr-3">Device</th><th className="py-2 pr-3">IP address</th><th className="py-2 pr-3">Signed in</th><th className="py-2 pr-3">Last active</th><th className="py-2" /></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.sessions.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 pr-3">
                        <p className="font-bold text-slate-900 dark:text-white">{s.user.email}{s.current && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">YOU</span>}</p>
                        <p className="text-slate-400">{s.user.role.replace(/_/g, ' ').toLowerCase()}{s.user.institution ? ` · ${s.user.institution.name}` : ''}</p>
                      </td>
                      <td className="py-2 pr-3">{PORTAL_LABEL[s.portal || 'UNKNOWN']}</td>
                      <td className="py-2 pr-3">{s.client === 'Unknown' ? '—' : `${s.client} · ${s.os}`}<p className="text-slate-400">{s.device === 'Unknown' ? '' : s.device}</p></td>
                      <td className="py-2 pr-3 font-mono">{s.ipAddress || '—'}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{new Date(s.createdAt).toLocaleString('en-IN')}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{ago(s.lastUsedAt)}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <button onClick={() => revoke(s)} disabled={busy === s.id} title="Sign this device out" className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-40">
                          {busy === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                        <button onClick={() => revokeUser(s)} disabled={busy === `u:${s.user.id}`} title="Sign this person out everywhere" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40">
                          <LogOut className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Page {meta.page} of {meta.totalPages} · {fmt(meta.total)} sessions</span>
                <div className="flex gap-2">
                  <button onClick={() => load(meta.page - 1)} disabled={meta.page <= 1} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40">Previous</button>
                  <button onClick={() => load(meta.page + 1)} disabled={meta.page >= meta.totalPages} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
            <p className="text-[11px] text-slate-400">"Older sign-in" rows are sessions from before device details were recorded; they end by themselves within 7 days. A revoke takes effect immediately on this server and within about a minute on others.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;
