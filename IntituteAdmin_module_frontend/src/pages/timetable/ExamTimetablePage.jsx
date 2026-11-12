import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import PrintHeader from '../../components/common/PrintHeader';
import { useNotification } from '../../context/NotificationContext';
import { useAcademic } from '../../context/InstitutionContext';
import examService from '../../services/examService';
import { Printer, Loader2, CalendarDays } from 'lucide-react';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' });

/** Exam timetable straight from the real exam schedules — filter by exam and class, print. */
export const ExamTimetablePage = () => {
  const academic = useAcademic();
  const { notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    examService.getExams()
      .then((res) => {
        const list = res.data || [];
        setExams(list);
        if (list.length) setExamId(list[0].id);
        else setLoading(false);
      })
      .catch((err) => { notifyError(`Failed to load exams: ${err.message}`); setError(true); setLoading(false); });
  }, [notifyError]);

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    setError(false);
    examService.getSchedules(examId)
      .then((res) => { setSchedules(res.data || []); setClassName(''); })
      .catch((err) => { notifyError(`Failed to load the exam schedule: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [examId, notifyError]);

  const classes = useMemo(() => [...new Set(schedules.map((s) => s.course?.name).filter(Boolean))], [schedules]);
  const rows = schedules
    .filter((s) => !className || s.course?.name === className)
    .map((s) => ({ ...s, code: s.subject?.code, title: s.subject?.name, cls: s.course?.name, venue: s.roomNumber || '—' }));
  const exam = exams.find((e) => e.id === examId);

  const columns = [
    { header: 'Date', key: 'examDate', render: (val) => <span className="font-semibold text-slate-900 dark:text-white">{fmtDate(val)}</span> },
    { header: 'Time', key: 'startTime', render: (val, row) => `${val} – ${row.endTime}` },
    { header: academic.label('course'), key: 'cls' },
    { header: 'Subject Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val || '—'}</span> },
    { header: 'Subject', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Max / Pass', key: 'maxMarks', render: (val, row) => `${val} / ${row.passMarks}` },
    { header: 'Venue', key: 'venue' },
  ];

  if (error) return <ErrorState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Exam Timetable</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">The schedule set under Examination → Exam Schedule, by exam and {academic.label('course').toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select value={className} onChange={(e) => setClassName(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
            <option value="">All {academic.label('course').toLowerCase()}s</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => window.print()} disabled={!rows.length} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : !exams.length ? (
        <EmptyState icon={CalendarDays} title="No exams yet" description="Create an exam and its schedule under Examination → Exam Setup / Exam Schedule." />
      ) : !rows.length ? (
        <EmptyState icon={CalendarDays} title="No schedule for this exam yet" description="Add subjects, dates and times under Examination → Exam Schedule." />
      ) : (
        <div className="print-container">
          <div className="hidden print:block">
            <PrintHeader title={`${exam?.name || 'Examination'} — Timetable`} subtitle={className || undefined} />
          </div>
          <DataTable columns={columns} data={rows} />
        </div>
      )}
    </div>
  );
};

export default ExamTimetablePage;
