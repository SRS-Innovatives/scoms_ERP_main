import React, { useEffect, useState } from 'react';
import { Loader2, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import reportManagementService from '../../services/reportManagementService';
import institutionService from '../../services/institutionService';
import { useNotification } from '../../context/NotificationContext';

/** Super Admin — assigns/enables the report catalog per institution (Layer 2). Proves the
 * per-tenant configuration: two institutions can have a different set of reports enabled,
 * driven entirely by database rows, never by separate frontend builds. */
export const InstitutionReportAssignmentPage = () => {
  const { error: showError, success } = useNotification();
  const [institutions, setInstitutions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [reports, setReports] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    institutionService.getInstitutions({ limit: 200 })
      .then((res) => {
        const list = res.data || [];
        setInstitutions(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch((err) => showError(`Failed to load institutions: ${err.message}`))
      .finally(() => setLoadingInstitutions(false));
  }, [showError]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingReports(true);
    reportManagementService.getInstitutionReports(selectedId)
      .then((res) => setReports(res.data || []))
      .catch((err) => showError(`Failed to load report configuration: ${err.message}`))
      .finally(() => setLoadingReports(false));
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async (report) => {
    const nextEnabled = !report.enabled;
    setReports((prev) => prev.map((r) => (r.reportId === report.reportId ? { ...r, enabled: nextEnabled } : r)));
    try {
      await reportManagementService.updateInstitutionReport(selectedId, report.reportId, { enabled: nextEnabled });
      success(`${report.name} ${nextEnabled ? 'enabled' : 'disabled'} for this institution.`);
    } catch (err) {
      showError(`Failed: ${err.message}`);
      setReports((prev) => prev.map((r) => (r.reportId === report.reportId ? { ...r, enabled: !nextEnabled } : r)));
    }
  };

  if (loadingInstitutions) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" /> Institution Report Assignment
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Which reports each institution can see and generate.</p>
        </div>
        <Link to="/super-admin/reports" className="text-xs font-semibold text-amber-600 hover:underline">← Back to Report Catalog</Link>
      </div>

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
      >
        {institutions.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
      </select>

      {loadingReports ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-amber-600" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r) => (
            <div key={r.reportId} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{r.displayName || r.name}</p>
                <p className="text-[11px] text-slate-500">{r.category} • {r.visibility}</p>
              </div>
              <button
                onClick={() => handleToggle(r)}
                className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${r.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${r.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstitutionReportAssignmentPage;
