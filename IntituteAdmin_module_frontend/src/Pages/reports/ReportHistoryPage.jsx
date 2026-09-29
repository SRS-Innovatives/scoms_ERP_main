import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, History, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import reportService from '../../services/reportService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

export const ReportHistoryPage = () => {
  const { error: showError } = useNotification();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    reportService.getHistory()
      .then((res) => setRuns(res.data || []))
      .catch((err) => { showError(`Failed to load report history: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" /> Report History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Every report generated or exported for your institution.</p>
        </div>
        <Link to="/admin/reports/center" className="text-xs font-semibold text-indigo-600 hover:underline">← Back to Reports</Link>
      </div>

      {runs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-10 text-center text-xs text-slate-500">
          No reports have been generated yet.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 uppercase text-[10px] font-semibold text-slate-500">
              <tr>
                <th className="p-3">Report</th>
                <th className="p-3">Format</th>
                <th className="p-3">Rows</th>
                <th className="p-3">Status</th>
                <th className="p-3">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{r.report?.name || r.report?.code}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{r.format}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{r.rowCount ?? '—'}</td>
                  <td className="p-3">
                    {r.status === 'SUCCESS' ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Success</span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-600 font-bold" title={r.errorMessage}><XCircle className="w-3.5 h-3.5" /> Failed</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500">{new Date(r.startedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportHistoryPage;
