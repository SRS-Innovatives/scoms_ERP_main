import React, { useEffect, useState } from 'react';
import { Loader2, Archive, ArchiveRestore, Copy, Link as LinkIcon, FileBarChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import reportManagementService from '../../services/reportManagementService';
import { useNotification } from '../../context/NotificationContext';

/** Super Admin — Report Catalog Management. Lists every report in the system (SYSTEM
 * defaults + INSTITUTION custom reports created from approved requests), with archive and
 * clone actions. This is the Layer 1 admin surface — assignment to institutions lives on
 * the Institution Report Assignment screen. */
export const ReportManagementPage = () => {
  const { error: showError, success } = useNotification();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    reportManagementService.getReports()
      .then((res) => setReports(res.data || []))
      .catch((err) => showError(`Failed to load reports: ${err.message}`))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleArchiveToggle = async (report) => {
    try {
      if (report.status === 'ARCHIVED') {
        await reportManagementService.updateReport(report.id, { status: 'ACTIVE' });
        success(`"${report.name}" restored to active.`);
      } else {
        await reportManagementService.archiveReport(report.id);
        success(`"${report.name}" archived.`);
      }
      load();
    } catch (err) {
      showError(`Failed: ${err.message}`);
    }
  };

  const handleClone = async (report) => {
    const code = window.prompt(`New unique code for the clone of "${report.name}":`, `${report.code}_COPY`);
    if (!code) return;
    try {
      await reportManagementService.cloneReport(report.id, { code });
      success(`Cloned as "${code}".`);
      load();
    } catch (err) {
      showError(`Failed to clone: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-amber-500" /> Report Catalog Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Every report defined in SCOMS — {reports.length} total.</p>
        </div>
        <Link to="/super-admin/reports/requests" className="text-xs font-semibold text-amber-600 hover:underline flex items-center gap-1">
          <LinkIcon className="w-3.5 h-3.5" /> Custom Report Requests
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800 uppercase text-[10px] font-semibold text-slate-500">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Visibility</th>
              <th className="p-3">Status</th>
              <th className="p-3">Institutions</th>
              <th className="p-3">Runs</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {reports.map((r) => (
              <tr key={r.id}>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{r.code}</td>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">{r.name}</td>
                <td className="p-3 text-slate-600 dark:text-slate-300">{r.category}</td>
                <td className="p-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.visibility === 'SYSTEM' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                    {r.visibility}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : r.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-300">{r._count.institutionReports}</td>
                <td className="p-3 text-slate-600 dark:text-slate-300">{r._count.runs}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => handleClone(r)} title="Clone" className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleArchiveToggle(r)} title={r.status === 'ARCHIVED' ? 'Restore' : 'Archive'} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg">
                      {r.status === 'ARCHIVED' ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportManagementPage;
