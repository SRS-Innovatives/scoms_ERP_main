import React, { useState, useEffect, useCallback } from 'react';
import ReportConfigBox from '../../components/common/ReportConfigBox';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { CalendarDays, Printer, Loader2, RefreshCw, Check, X, Clock } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import sectionService from '../../services/sectionService';

const sectionLabel = (s) => `${s.semester?.course?.name || ''} — ${s.semester?.name || ''} — ${s.name}`;

const STATUS_META = {
  PRESENT: { label: 'Present', icon: Check, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  LATE: { label: 'Late', icon: Clock, className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  ABSENT: { label: 'Absent', icon: X, className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' },
  LEAVE: { label: 'Leave', icon: Clock, className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
  HALF_DAY: { label: 'Half Day', icon: Clock, className: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400' },
  NOT_MARKED: { label: 'Not Marked', icon: Clock, className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
};

export const DateWiseAttendanceReportPage = () => {
  const { notifyError } = useNotification();
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [report, setReport] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    sectionService.getAll()
      .then((res) => {
        setSections(res.data || []);
        if ((res.data || []).length > 0) setSectionId(res.data[0].id);
      })
      .catch((err) => notifyError(`Failed to load sections: ${err.message}`))
      .finally(() => setLoadingOptions(false));
  }, [notifyError]);

  const generate = useCallback(() => {
    if (!sectionId || !date) return;
    setLoadingReport(true);
    attendanceService.getDateWiseReport(sectionId, date)
      .then((res) => setReport(res.data))
      .catch((err) => notifyError(`Failed to generate report: ${err.message}`))
      .finally(() => setLoadingReport(false));
  }, [sectionId, date, notifyError]);

  useEffect(() => { generate(); }, [generate]);

  const filteredRows = report ? report.rows.filter((r) => statusFilter === 'ALL' || r.status === statusFilter) : [];
  const selectedSection = sections.find((s) => s.id === sectionId);

  if (loadingOptions) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Date-wise Attendance Report</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">One class, one date — every student's status for that day</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
        <ReportConfigBox title="Class & Date">
          <div>
            <label className="block text-slate-500 mb-1">Section</label>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              {sections.map((s) => <option key={s.id} value={s.id}>{sectionLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          </div>
          <button onClick={generate} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
            <RefreshCw className="w-3.5 h-3.5" /> Generate
          </button>
        </ReportConfigBox>

        <ReportConfigBox title="Filter">
          <div>
            <label className="block text-slate-500 mb-1">Show only</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <option value="ALL">All Students</option>
              {Object.entries(STATUS_META).map(([key, m]) => <option key={key} value={key}>{m.label} only</option>)}
            </select>
          </div>
          {report && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {Object.entries(report.summary).filter(([, count]) => count > 0).map(([status, count]) => (
                <div key={status} className={`px-2 py-1.5 rounded-lg text-center font-bold ${STATUS_META[status]?.className}`}>
                  <div className="text-sm">{count}</div>
                  <div className="text-[9px] uppercase">{STATUS_META[status]?.label}</div>
                </div>
              ))}
            </div>
          )}
        </ReportConfigBox>
      </div>

      {loadingReport ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : !report || report.rows.length === 0 ? (
        <EmptyState title="No Students in This Section" icon={CalendarDays} />
      ) : filteredRows.length === 0 ? (
        <EmptyState title="No Students Match This Filter" icon={CalendarDays} />
      ) : (
        <div className="print-container bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              {selectedSection && sectionLabel(selectedSection)} — {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
            {report.percentage !== null && (
              <span className="text-xs font-bold text-indigo-600">{report.percentage}% Present ({report.totalStudents - report.summary.NOT_MARKED} marked of {report.totalStudents})</span>
            )}
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Roll No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Admission No</th>
                <th className="p-3">Status</th>
                <th className="p-3">Periods Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.map((row) => {
                const meta = STATUS_META[row.status] || STATUS_META.NOT_MARKED;
                const Icon = meta.icon;
                return (
                  <tr key={row.studentId}>
                    <td className="p-3 font-mono font-bold text-indigo-600">{row.rollNumber || '—'}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{row.firstName} {row.lastName}</td>
                    <td className="p-3 font-mono text-slate-500">{row.admissionNumber}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${meta.className}`}>
                        <Icon className="w-3 h-3" /> {meta.label}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{row.sessionsRecorded}</td>
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

export default DateWiseAttendanceReportPage;
