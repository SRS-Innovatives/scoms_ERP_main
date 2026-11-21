import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { HardDrive, FolderOpen, Database, PieChart, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import infraService, { formatBytes } from '../../services/infraService';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

/**
 * Storage — SCOMS keeps uploaded files (photos, logos, documents, attachments) inside the
 * database itself, so this shows exactly what is stored, by kind, and how much of the
 * database it takes. Measured live (and kept for 5 minutes, since it reads those tables).
 */
export const StorageManagementPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback((refresh = false) => {
    setLoading(true);
    setError('');
    infraService.getStorage(refresh)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message || 'Could not measure storage'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (error) {
    return (
      <div className="glass-card p-10 rounded-2xl border border-rose-200 dark:border-rose-900 text-center space-y-3 text-xs">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-slate-700 dark:text-slate-300">{error}</p>
        <button onClick={() => load(true)} className="px-3.5 py-2 font-semibold text-white bg-indigo-600 rounded-xl">Try again</button>
      </div>
    );
  }

  const share = data.databaseBytes ? Math.round((data.totalBytes / data.databaseBytes) * 1000) / 10 : 0;
  const kinds = [...data.kinds].sort((a, b) => b.bytes - a.bytes);
  const maxBytes = kinds[0]?.bytes || 1;

  return (
    <div className="space-y-6">
      <PageHeader title="Storage" subtitle="Uploaded files — profile photos, logos, documents and attachments. SCOMS keeps them inside the database, so they are backed up with it." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Files stored" value={fmt(data.totalFiles)} subtitle="Across every institution" icon={FolderOpen} color="indigo" />
        <StatCard title="Space used by files" value={formatBytes(data.totalBytes)} subtitle="Inside the database" icon={HardDrive} color="indigo" />
        <StatCard title="Database size" value={formatBytes(data.databaseBytes)} subtitle="Files + all other records" icon={Database} color="emerald" />
        <StatCard title="Files' share" value={`${share}%`} subtitle="Of the whole database" icon={PieChart} color="emerald" />
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">By kind of file</h3>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Measured {new Date(data.measuredAt).toLocaleTimeString('en-IN')}</span>
            <button onClick={() => load(true)} disabled={loading} title="Measure again" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
            <tr><th className="py-2 pr-3">Kind</th><th className="py-2 pr-3 text-right">Files</th><th className="py-2 pr-3 text-right">Stored here</th><th className="py-2 pr-3 text-right">Links</th><th className="py-2 w-1/3">Space</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {kinds.map((k) => (
              <tr key={`${k.table}.${k.column}`}>
                <td className="py-1.5 pr-3 font-semibold text-slate-800 dark:text-slate-200">{k.label}</td>
                <td className="py-1.5 pr-3 text-right">{fmt(k.files)}</td>
                <td className="py-1.5 pr-3 text-right">{fmt(k.embedded)}</td>
                <td className="py-1.5 pr-3 text-right">{fmt(k.linked)}</td>
                <td className="py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${k.bytes ? Math.max(2, (k.bytes / maxBytes) * 100) : 0}%` }} /></div>
                    <span className="w-16 text-right">{formatBytes(k.bytes)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-slate-400">"Stored here" are files uploaded into SCOMS; "Links" point to files kept elsewhere (e.g. a shared drive link), which take almost no space here. Upload size limits are set per screen (e.g. photos and logos up to a few MB).</p>
      </div>
    </div>
  );
};

export default StorageManagementPage;
