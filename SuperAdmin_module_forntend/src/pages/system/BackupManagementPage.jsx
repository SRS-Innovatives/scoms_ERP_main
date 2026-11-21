import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { Database, HardDrive, Layers, Activity, ShieldCheck, ExternalLink, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import infraService, { formatBytes } from '../../services/infraService';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

/**
 * Database & Backups — the live database's real size, biggest tables, connections and
 * migrations. Backups are taken by the database host (Supabase), not by SCOMS, so this page
 * says where to find them instead of offering pretend download / restore buttons.
 */
export const BackupManagementPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    infraService.getDatabase()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message || 'Could not read the database'))
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

  const maxBytes = data.largestTables[0]?.bytes || 1;
  return (
    <div className="space-y-6">
      <PageHeader title="Database & Backups" subtitle="The live database behind every institution — its real size, largest tables and connections, and where its backups are kept." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Database size" value={formatBytes(data.sizeBytes)} subtitle={`${data.provider} · PostgreSQL ${data.postgresVersion.split(' ')[0]}`} icon={Database} color="indigo" />
        <StatCard title="Tables" value={fmt(data.tableCount)} subtitle={`${fmt(data.migrations.applied)} migrations applied`} icon={Layers} color="indigo" />
        <StatCard title="Connections" value={fmt(data.connections.total)} subtitle={`${fmt(data.connections.active)} running a query now`} icon={Activity} color="emerald" />
        <StatCard title="Backups" value={data.backups.managedBy || 'Your host'} subtitle="Taken by the database host" icon={ShieldCheck} color="emerald" />
      </div>

      <div className="glass-card p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs space-y-2">
        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-600" /> Backups &amp; restore</p>
        <p className="text-slate-700 dark:text-slate-300">{data.backups.note}</p>
        {data.backups.dashboardUrl && (
          <a href={data.backups.dashboardUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
            Open the Supabase dashboard <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2"><HardDrive className="w-4 h-4 text-indigo-500" /> Largest tables</h3>
            <button onClick={load} title="Refresh" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw className="w-4 h-4" /></button>
          </div>
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr><th className="py-2 pr-3">Table</th><th className="py-2 pr-3 w-1/2">Size (with indexes)</th><th className="py-2 text-right">≈ Rows</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.largestTables.map((t) => (
                <tr key={t.name}>
                  <td className="py-1.5 pr-3 font-mono">{t.name}</td>
                  <td className="py-1.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.max(2, (t.bytes / maxBytes) * 100)}%` }} /></div>
                      <span className="w-16 text-right">{formatBytes(t.bytes)}</span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right">{fmt(t.rows)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-slate-400">Row counts are PostgreSQL's own estimates (exact counts would slow the database down).</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-500" /> Latest database changes</h3>
          <ul className="space-y-2">
            {data.migrations.latest.map((m) => (
              <li key={m.name}>
                <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all">{m.name.replace(/^\d+_/, '').replace(/_/g, ' ')}</p>
                <p className="text-slate-400">{new Date(m.finishedAt).toLocaleString('en-IN')}</p>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-400">{fmt(data.migrations.applied)} migrations applied in total.</p>
        </div>
      </div>
    </div>
  );
};

export default BackupManagementPage;
