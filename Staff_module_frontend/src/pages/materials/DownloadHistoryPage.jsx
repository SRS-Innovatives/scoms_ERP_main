import React, { useState, useEffect, useCallback } from 'react';
import { Download, Loader2, ChevronLeft, Users, Eye, EyeOff, Search } from 'lucide-react';
import materialService from '../../services/materialService';
import ErrorState from '../../components/common/ErrorState';

const when = (d) => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const nameOf = (s) => [s.firstName, s.lastName].filter(Boolean).join(' ');

/** One material: who opened it and who hasn't. */
const MaterialDetail = ({ id, onBack }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('opened');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await materialService.getMaterialDownloads(id);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-10"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>;

  const term = q.trim().toLowerCase();
  const match = (s) => !term || nameOf(s).toLowerCase().includes(term) || String(s.rollNumber || '').toLowerCase().includes(term) || String(s.admissionNumber || '').toLowerCase().includes(term);
  const rows = (view === 'opened' ? data.opened : data.notOpened).filter(match);
  const total = data.opened.length + data.notOpened.length;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
        <ChevronLeft className="w-4 h-4" /> All materials
      </button>
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{data.material.title}</h4>
        <p className="text-[11px] text-slate-500">{data.material.subject || 'General'} · shared {when(data.material.sharedAt)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setView('opened')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold ${view === 'opened' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
          <Eye className="w-3.5 h-3.5" /> Opened ({data.opened.length})
        </button>
        <button onClick={() => setView('not')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold ${view === 'not' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
          <EyeOff className="w-3.5 h-3.5" /> Not opened yet ({data.notOpened.length})
        </button>
        {total > 0 && <span className="text-[11px] text-slate-500">{Math.round((data.opened.length / total) * 100)}% of {total} students</span>}
        <div className="relative ml-auto">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or roll no." className="pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200" />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">
          {view === 'opened' ? (term ? 'No match.' : 'No student has opened this material yet.') : (term ? 'No match.' : 'Every student has opened it.')}
        </p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Student</th>
                <th className="text-left px-3 py-2 font-semibold">Roll no.</th>
                <th className="text-left px-3 py-2 font-semibold">Section</th>
                {view === 'opened' && <>
                  <th className="text-right px-3 py-2 font-semibold">Times</th>
                  <th className="text-left px-3 py-2 font-semibold">First opened</th>
                  <th className="text-left px-3 py-2 font-semibold">Last opened</th>
                </>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 font-medium">{nameOf(s)}</td>
                  <td className="px-3 py-2">{s.rollNumber || s.admissionNumber || '—'}</td>
                  <td className="px-3 py-2">{s.section?.name || '—'}</td>
                  {view === 'opened' && <>
                    <td className="px-3 py-2 text-right">{s.openCount}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{when(s.firstOpenedAt)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{when(s.lastOpenedAt)}</td>
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const DownloadHistoryPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await materialService.getDownloadHistory();
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Download className="w-5 h-5 text-sky-500" /> Student Material Download Activity
      </h3>
      <p className="text-[11px] text-slate-500 mb-4">Which of your students opened each material you shared, and when. Counted when a student opens it in the Student portal.</p>

      {openId ? (
        <MaterialDetail id={openId} onBack={() => { setOpenId(null); load(); }} />
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-10"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">You haven't shared any study material yet — once you do, you'll see here who opened it.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Material</th>
                <th className="text-left px-3 py-2 font-semibold">Subject</th>
                <th className="text-left px-3 py-2 font-semibold">Opened by</th>
                <th className="text-right px-3 py-2 font-semibold">Total opens</th>
                <th className="text-left px-3 py-2 font-semibold">Last opened</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {rows.map((m) => {
                const pct = m.students ? Math.round((m.openedBy / m.students) * 100) : null;
                return (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{m.title}</p>
                      <p className="text-[10px] text-slate-400">{m.fileType} · shared {new Date(m.sharedAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-3 py-2">{m.subject || '—'}</td>
                    <td className="px-3 py-2 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{m.openedBy}{m.students != null ? ` / ${m.students}` : ''}</span>
                        {pct != null && (
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">{m.totalOpens}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{when(m.lastOpenedAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => setOpenId(m.id)} className="flex items-center gap-1 ml-auto px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold text-[11px] hover:bg-sky-100">
                        <Users className="w-3.5 h-3.5" /> Students
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DownloadHistoryPage;
