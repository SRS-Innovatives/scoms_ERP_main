import React, { useState, useEffect } from 'react';
import PrintHeader from '../../components/common/PrintHeader';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useAcademic } from '../../context/InstitutionContext';
import examService from '../../services/examService';
import studentService from '../../services/studentService';
import { Printer, Loader2, Search, FileText } from 'lucide-react';

/** A real progress report: one student's attendance + marks for the chosen exam (or all). */
export const ProgressReportPage = () => {
  const academic = useAcademic();
  const { notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [student, setStudent] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    examService.getExams().then((res) => setExams(res.data || [])).catch(() => {});
  }, []);

  // Student search (name, admission or roll number)
  useEffect(() => {
    if (query.trim().length < 2) { setMatches([]); return undefined; }
    const t = setTimeout(() => {
      studentService.getAll({ search: query.trim(), limit: 8 })
        .then((res) => setMatches(res.data || []))
        .catch(() => setMatches([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    examService.getProgressReport(student.id, examId || undefined)
      .then((res) => setReport(res.data))
      .catch((err) => { notifyError(`Failed to load the report: ${err.message}`); setReport(null); })
      .finally(() => setLoading(false));
  }, [student, examId, notifyError]);

  const s = report?.student;
  const resultTone = (r) => (r === 'PASS' ? 'text-emerald-700' : r === 'FAIL' ? 'text-rose-700' : 'text-slate-500');

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Progress Report</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Attendance and marks for one student — print and send to parents</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 text-xs no-print">
        <div className="relative w-72">
          <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Student</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, admission or roll number" className="flex-1 bg-transparent outline-none" />
          </div>
          {matches.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
              {matches.map((m) => (
                <button key={m.id} onClick={() => { setStudent(m); setQuery(`${m.firstName} ${m.lastName}`); setMatches([]); }} className="block w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="font-semibold">{m.firstName} {m.lastName}</span>
                  <span className="text-slate-400 ml-2">{m.admissionNumber}{m.section?.name ? ` · ${m.section.name}` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Exam</label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
            <option value="">All exams</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <button onClick={() => window.print()} disabled={!report} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50">
          <Printer className="w-4 h-4" /> Print Report
        </button>
      </div>

      {!student ? (
        <EmptyState icon={FileText} title="Choose a student" description="Search by name, admission number or roll number to build their report." />
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : report && (
        <div className="print-container bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 max-w-3xl">
          <PrintHeader title="STUDENT PROGRESS REPORT" subtitle={report.exam?.name || 'All examinations'} documentNo={s.admissionNumber} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mb-5">
            <p><span className="text-slate-500">Student:</span> <b>{s.name}</b></p>
            <p><span className="text-slate-500">Roll No:</span> <b>{s.rollNumber || '—'}</b></p>
            <p><span className="text-slate-500">{academic.label('course')}:</span> <b>{s.className || '—'}</b></p>
            <p><span className="text-slate-500">{academic.label('section')}:</span> <b>{s.section || '—'}</b></p>
            <p><span className="text-slate-500">Parent / Guardian:</span> <b>{s.parentName || '—'}</b></p>
            <p><span className="text-slate-500">Attendance:</span> <b>{report.attendance.percent === null ? 'Not recorded yet' : `${report.attendance.percent}% (${report.attendance.present}/${report.attendance.sessions} sessions)`}</b></p>
          </div>
          {report.subjects.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No marks recorded{report.exam ? ' for this exam' : ''} yet.</p>
          ) : (
            <table className="w-full text-xs border border-slate-300">
              <thead className="bg-slate-100">
                <tr>
                  {!report.exam && <th className="p-2 text-left border-b">Exam</th>}
                  <th className="p-2 text-left border-b">Subject</th>
                  <th className="p-2 text-right border-b">Marks</th>
                  <th className="p-2 text-right border-b">Max</th>
                  <th className="p-2 text-center border-b">Grade</th>
                  <th className="p-2 text-center border-b">Result</th>
                </tr>
              </thead>
              <tbody>
                {report.subjects.map((r, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    {!report.exam && <td className="p-2">{r.exam}</td>}
                    <td className="p-2">{r.subject}{r.code ? <span className="text-slate-400"> ({r.code})</span> : null}</td>
                    <td className="p-2 text-right font-semibold">{r.absent ? 'AB' : r.marksObtained}</td>
                    <td className="p-2 text-right">{r.maxMarks}</td>
                    <td className="p-2 text-center">{r.grade || '—'}</td>
                    <td className={`p-2 text-center font-bold ${resultTone(r.result)}`}>{r.result}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold">
                <tr>
                  <td className="p-2" colSpan={report.exam ? 1 : 2}>Total</td>
                  <td className="p-2 text-right">{report.totals.obtained}</td>
                  <td className="p-2 text-right">{report.totals.max}</td>
                  <td className="p-2 text-center" colSpan={2}>{report.totals.percent === null ? '—' : `${report.totals.percent}%`}</td>
                </tr>
              </tfoot>
            </table>
          )}
          <div className="flex justify-between mt-10 text-[11px] text-slate-600">
            <p className="border-t border-slate-400 pt-1 w-40 text-center">{academic.label('classTeacher')}</p>
            <p className="border-t border-slate-400 pt-1 w-40 text-center">Parent / Guardian</p>
            <p className="border-t border-slate-400 pt-1 w-40 text-center">Principal</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressReportPage;
