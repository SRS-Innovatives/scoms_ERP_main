import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import { useInstitution } from '../../context/InstitutionContext';
import ErrorState from '../../components/common/ErrorState';
import { Printer, Award, Loader2 } from 'lucide-react';

const RESULT_STYLE = { PASS: 'text-emerald-600', FAIL: 'text-rose-600', ABSENT: 'text-slate-500' };

/**
 * Published results as an exam-wise marksheet: per subject marks, grade, grade point and
 * result, with SGPA (this exam), CGPA (all published exams) and classification — the same
 * calculation the Institute Admin's marksheet uses. Only published subjects ever appear.
 */
export const StudentResultsPage = () => {
  const { error: showError } = useNotification();
  const { institution } = useInstitution();
  const [results, setResults] = useState([]); // every published subject mark (all exams)
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [error, setError] = useState(false);

  // Exams that have at least one published result, newest first
  const loadExams = useCallback(() => {
    setLoading(true);
    setError(false);
    examService.getResults()
      .then((res) => {
        setResults(res.data || []);
        const seen = new Map();
        (res.data || []).forEach((r) => {
          const e = r.examSchedule?.exam;
          if (e?.id && !seen.has(e.id)) seen.set(e.id, e);
        });
        const list = [...seen.values()];
        setExams(list);
        setExamId((current) => current || list[0]?.id || '');
      })
      .catch((err) => { showError(err.message || 'Failed to load results', 'Load Failed'); setError(err.message || true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { loadExams(); }, [loadExams]);

  useEffect(() => {
    if (!examId) { setSheet(null); return; }
    setSheetLoading(true);
    examService.getMarksheet(examId)
      .then((res) => setSheet(res.data))
      .catch((err) => { showError(err.message || 'Failed to load marksheet', 'Load Failed'); setSheet(null); })
      .finally(() => setSheetLoading(false));
  }, [examId, showError]);

  // The institution may keep the formal mark card hidden (Result Publish → "Student Mark
  // Card", off by default) — then only the published subject marks are shown.
  const markCardHidden = sheet?.marksheetEnabled === false;
  const examResults = useMemo(() => results.filter((r) => r.examSchedule?.exam?.id === examId), [results, examId]);

  const totals = useMemo(() => {
    const sat = (sheet?.subjects || []).filter((s) => s.result !== 'ABSENT');
    const obtained = sat.reduce((sum, s) => sum + s.marksObtained, 0);
    const max = sat.reduce((sum, s) => sum + s.maxMarks, 0);
    return { obtained, max, percentage: max > 0 ? Number(((obtained / max) * 100).toFixed(2)) : null };
  }, [sheet]);
  // An External exam combined with internals: per-subject internal / external / final %
  const combined = (sheet?.subjects || []).some((s) => s.finalPercent !== undefined);
  const combinedWeight = (sheet?.subjects || []).find((s) => s.internalWeight !== undefined)?.internalWeight;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  // a fee hold (Fee Policy) comes back as a plain message — show it, not a generic failure
  if (error) return /on hold because of unpaid fees/.test(String(error))
    ? <ErrorState title="Results on hold" message={error} onRetry={loadExams} />
    : <ErrorState onRetry={loadExams} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Results & Marksheet</h1>
          <p className="text-xs text-slate-500 mt-1">Marks appear here only after your institution publishes them</p>
        </div>
        {exams.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
            >
              {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            {!markCardHidden && sheet?.subjects?.length > 0 && (
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs">
                <Printer className="w-4 h-4" /> Print / Save Marksheet PDF
              </button>
            )}
          </div>
        )}
      </div>

      {exams.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No published results yet. Check back once your exams are graded and published.</p>
        </div>
      ) : sheetLoading || !sheet ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : markCardHidden ? (
        // Mark card not released by the institution: published subject marks only
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center">Marks</th>
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {examResults.map((r) => {
                  const result = r.isAbsent ? 'ABSENT' : r.marksObtained >= r.examSchedule.passMarks ? 'PASS' : 'FAIL';
                  return (
                    <tr key={r.id}>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{r.examSchedule.subject.name}</td>
                      <td className="p-3 text-center font-mono">{r.isAbsent ? 'AB' : `${r.marksObtained} / ${r.examSchedule.maxMarks}`}</td>
                      <td className="p-3 text-center font-bold text-indigo-600">{r.isAbsent ? 'AB' : (r.grade || '—')}</td>
                      <td className={`p-3 text-right font-bold ${RESULT_STYLE[result]}`}>{result}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 bg-white dark:bg-slate-900 print-container">
          <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{institution?.name}</h2>
              <p className="text-xs text-slate-500">Statement of Marks · {sheet.exam?.name}{sheet.exam?.academicYear?.yearName ? ` · ${sheet.exam.academicYear.yearName}` : ''}</p>
              <p className="text-xs text-slate-500">{[sheet.student?.className, sheet.student?.section].filter(Boolean).join(' - ')}</p>
            </div>
            <div className="text-right text-xs space-y-1">
              <p><span className="text-slate-500">Name:</span> <span className="font-bold">{sheet.student?.name}</span></p>
              <p><span className="text-slate-500">Register No:</span> <span className="font-mono font-bold">{sheet.student?.registerNumber || sheet.student?.admissionNumber}</span></p>
              {sheet.student?.rollNumber && <p><span className="text-slate-500">Roll No:</span> <span className="font-mono font-bold">{sheet.student.rollNumber}</span></p>}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center">Credits</th>
                  <th className="p-3 text-center">Marks</th>
                  {combined && <th className="p-3 text-center">Internal % (×{combinedWeight}%)</th>}
                  {combined && <th className="p-3 text-center">External %</th>}
                  {combined && <th className="p-3 text-center">Final %</th>}
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3 text-center">Grade Point</th>
                  <th className="p-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {sheet.subjects.map((s, i) => (
                  <tr key={`${s.code}-${i}`}>
                    <td className="p-3 font-mono text-slate-500">{s.code || '—'}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{s.title}</td>
                    <td className="p-3 text-center">{s.credit ?? '—'}</td>
                    <td className="p-3 text-center font-mono">{s.result === 'ABSENT' ? 'AB' : `${s.marksObtained} / ${s.maxMarks}`}</td>
                    {combined && <td className="p-3 text-center font-mono">{s.internalPercent ?? '—'}</td>}
                    {combined && <td className="p-3 text-center font-mono">{s.externalPercent ?? '—'}</td>}
                    {combined && <td className="p-3 text-center font-mono font-bold">{s.finalPercent ?? '—'}</td>}
                    <td className="p-3 text-center font-bold text-indigo-600">{s.grade || '—'}</td>
                    <td className="p-3 text-center">{s.gradePoint ?? '—'}</td>
                    <td className={`p-3 text-right font-bold ${RESULT_STYLE[s.result] || ''}`}>{s.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              ['SGPA', sheet.sgpa ?? '—', 'This exam'],
              ['CGPA', sheet.cgpa ?? '—', 'All published exams'],
              ['Percentage', totals.percentage !== null ? `${totals.percentage}%` : '—', `${totals.obtained} / ${totals.max} (absent excluded)`],
            ].map(([label, value, hint]) => (
              <div key={label} className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
                <p className="text-slate-500">{label}</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{value}</p>
                <p className="text-[10px] text-slate-400">{hint}</p>
              </div>
            ))}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <p className="text-slate-500">Classification</p>
              <div className="mt-1.5">{sheet.classification ? <StatusBadge status={sheet.classification} /> : <span className="text-slate-400">—</span>}</div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            Grade points follow your institution&apos;s grade scale; SGPA and CGPA are credit-weighted, and absent subjects are not counted.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentResultsPage;
