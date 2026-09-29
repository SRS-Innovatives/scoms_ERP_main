import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReportConfigBox, { ReportCheckbox } from '../../components/common/ReportConfigBox';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { CalendarCheck, Printer, Loader2, RefreshCw } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import sectionService from '../../services/sectionService';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const now = new Date();

const STATUS_STYLE = {
  PRESENT: { label: 'P', bg: '#dcfce7', color: '#15803d' },
  ABSENT: { label: 'A', bg: '#fee2e2', color: '#b91c1c' },
  LATE: { label: 'L', bg: '#fef9c3', color: '#a16207' },
  HALF_DAY: { label: 'H', bg: '#fed7aa', color: '#c2410c' },
  LEAVE: { label: 'LV', bg: '#e0e7ff', color: '#4338ca' },
};

const sectionLabel = (s) => `${s.semester?.course?.name || ''} — ${s.semester?.name || ''} — ${s.name}`;

export const ConsolidatedAttendanceReportPage = () => {
  const { notifyError } = useNotification();
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [report, setReport] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [optionsError, setOptionsError] = useState(false);
  const [reportError, setReportError] = useState(false);

  const [showWeekday, setShowWeekday] = useState(true);
  const [minPct, setMinPct] = useState('');
  const [highlightBelow, setHighlightBelow] = useState(75);

  const loadOptions = useCallback(() => {
    setLoadingOptions(true);
    setOptionsError(false);
    sectionService.getAll()
      .then((res) => {
        setSections(res.data || []);
        if ((res.data || []).length > 0) setSectionId(res.data[0].id);
      })
      .catch((err) => { notifyError(`Failed to load sections: ${err.message}`); setOptionsError(true); })
      .finally(() => setLoadingOptions(false));
  }, [notifyError]);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  const generate = useCallback(() => {
    if (!sectionId) return;
    setLoadingReport(true);
    setReportError(false);
    attendanceService.getConsolidatedReport(sectionId, month, year)
      .then((res) => setReport(res.data))
      .catch((err) => { notifyError(`Failed to generate report: ${err.message}`); setReportError(true); })
      .finally(() => setLoadingReport(false));
  }, [sectionId, month, year, notifyError]);

  useEffect(() => { generate(); }, [generate]);

  const filteredRows = useMemo(() => {
    if (!report) return [];
    return report.rows.filter((r) => minPct === '' || (r.percentage !== null && r.percentage >= Number(minPct)));
  }, [report, minPct]);

  if (loadingOptions) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (optionsError) {
    return <ErrorState onRetry={loadOptions} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Consolidated Attendance Report</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Class-wise monthly attendance grid — one row per student, one column per day</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <ReportConfigBox title="Class & Period">
          <div>
            <label className="block text-slate-500 mb-1">Section</label>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              {sections.map((s) => <option key={s.id} value={s.id}>{sectionLabel(s)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-500 mb-1">Month</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Year</label>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
            </div>
          </div>
          <button onClick={generate} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
            <RefreshCw className="w-3.5 h-3.5" /> Generate
          </button>
        </ReportConfigBox>

        <ReportConfigBox title="View">
          <ReportCheckbox checked={showWeekday} onChange={setShowWeekday} label="Show weekday under date" />
          <div className="flex items-center gap-2 pt-1">
            <span className="text-slate-500 shrink-0">Highlight % below</span>
            <input type="number" value={highlightBelow} onChange={(e) => setHighlightBelow(Number(e.target.value))} className="w-14 px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center" />
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            {Object.entries(STATUS_STYLE).map(([key, s]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px]" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                <span className="text-slate-500">{key.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </ReportConfigBox>

        <ReportConfigBox title="Filters">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 shrink-0">Only show % ≥</span>
            <input type="number" placeholder="0" value={minPct} onChange={(e) => setMinPct(e.target.value)} className="w-16 px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center" />
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
            A day with no session recorded at all shows blank — it isn't counted as absent, and doesn't count toward the percentage.
          </p>
        </ReportConfigBox>
      </div>

      {loadingReport ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : reportError ? (
        <ErrorState onRetry={generate} />
      ) : !report || report.rows.length === 0 ? (
        <EmptyState title="No Students in This Section" icon={CalendarCheck} />
      ) : filteredRows.length === 0 ? (
        <EmptyState title="No Students Match This Filter" description="Try lowering the minimum percentage." icon={CalendarCheck} />
      ) : (
        <div className="print-container bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-center">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              {sections.find((s) => s.id === sectionId) && sectionLabel(sections.find((s) => s.id === sectionId))} — {MONTHS[month - 1]} {year} Attendance
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase">
                <tr>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-800">Roll No</th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 sticky left-12 bg-slate-100 dark:bg-slate-800">Student Name</th>
                  {report.days.map((d) => (
                    <th key={d.day} className="p-1 border border-slate-200 dark:border-slate-700 text-center w-8">
                      {d.day}{showWeekday && <div className="font-normal normal-case text-[9px] text-slate-400">{d.weekday}</div>}
                    </th>
                  ))}
                  <th className="p-2 border border-slate-200 dark:border-slate-700">Present</th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700">%</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.studentId}>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 font-mono font-bold text-indigo-600 sticky left-0 bg-white dark:bg-slate-900">{row.rollNumber || '—'}</td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white sticky left-12 bg-white dark:bg-slate-900 whitespace-nowrap">{row.firstName} {row.lastName}</td>
                    {row.attendance.map((status, idx) => {
                      const style = status ? STATUS_STYLE[status] : null;
                      return (
                        <td key={idx} className="border border-slate-200 dark:border-slate-700 text-center font-bold" style={style ? { backgroundColor: style.bg, color: style.color } : {}}>
                          {style ? style.label : ''}
                        </td>
                      );
                    })}
                    <td className="p-2 border border-slate-200 dark:border-slate-700 text-center font-mono">{row.presentDays}/{row.markedDays}</td>
                    <td
                      className="p-2 border border-slate-200 dark:border-slate-700 text-center font-bold"
                      style={row.percentage !== null && row.percentage < highlightBelow ? { backgroundColor: '#fee2e2', color: '#b91c1c' } : {}}
                    >
                      {row.percentage === null ? '—' : `${row.percentage}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsolidatedAttendanceReportPage;
