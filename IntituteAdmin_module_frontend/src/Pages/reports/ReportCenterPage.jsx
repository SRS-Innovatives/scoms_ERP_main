import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Sparkles, History, Bookmark, MessageSquarePlus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import reportService from '../../services/reportService';
import { useNotification } from '../../context/NotificationContext';
import ReportCatalog from '../../components/reports/ReportCatalog';
import ReportGenerator from '../../components/reports/ReportGenerator';
import ErrorState from '../../components/common/ErrorState';

/**
 * Reports Dashboard — the single entry point for the whole Dynamic Report Engine.
 * Browses the live catalog (Layer 1 ∩ Layer 2 institution configuration) and hands off to
 * the generic ReportGenerator for whichever report is selected. No per-report React page
 * exists anywhere in this codebase — adding report #11 needs zero frontend changes.
 */
export const ReportCenterPage = () => {
  const { error: showError } = useNotification();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCode, setSelectedCode] = useState(searchParams.get('report'));

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    reportService.getCatalog()
      .then((res) => setReports(res.data || []))
      .catch((err) => { showError(`Failed to load report catalog: ${err.message}`); setError(true); })
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" /> Reports Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {reports.length} report(s) available for your institution. Pick one, set your filters, and generate it live.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/reports/history" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50">
            <History className="w-3.5 h-3.5" /> History
          </Link>
          <Link to="/admin/reports/saved" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50">
            <Bookmark className="w-3.5 h-3.5" /> Saved Reports
          </Link>
          <Link to="/admin/reports/request" className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
            <MessageSquarePlus className="w-3.5 h-3.5" /> Request New Report
          </Link>
        </div>
      </div>

      {selectedCode ? (
        <ReportGenerator reportCode={selectedCode} onBack={() => setSelectedCode(null)} />
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-10 text-center text-xs text-slate-500">
          No reports have been enabled for your institution yet. Ask your Super Admin, or submit a Request New Report.
        </div>
      ) : (
        <ReportCatalog reports={reports} onSelect={setSelectedCode} />
      )}
    </div>
  );
};

export default ReportCenterPage;
