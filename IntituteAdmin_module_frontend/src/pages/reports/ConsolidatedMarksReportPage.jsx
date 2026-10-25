import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReportConfigBox, { ReportCheckbox } from '../../components/common/ReportConfigBox';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { FileBarChart, Printer, Loader2, RefreshCw } from 'lucide-react';
import examService from '../../services/examService';
import sectionService from '../../services/sectionService';

const DEFAULT_THRESHOLDS = [
  { pct: 35, color: '#fecaca' }, // below 35% — red
  { pct: 60, color: '#fef08a' }, // below 60% — amber
  { pct: 75, color: '#bbf7d0' }, // below 75% — light green
];
const ABSENT_COLOR = '#e2e8f0';

const sectionLabel = (s) => `${s.semester?.course?.name || ''} — ${s.semester?.name || ''} — ${s.name}`;

const colorForPercentage = (pct, thresholds) => {
  if (pct === null || pct === undefined) return ABSENT_COLOR;
  const sorted = [...thresholds].sort((a, b) => a.pct - b.pct);
  for (const t of sorted) if (pct < t.pct) return t.color;
  return 'transparent';
};

export const ConsolidatedMarksReportPage = () => {
  const { notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [sections, setSections] = useState([]);
  const [examId, setExamId] = useState('');
  const [sectionId, setSectionId] = useState('');

  const [report, setReport] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [optionsError, setOptionsError] = useState(false);
  const [reportError, setReportError] = useState(false);

  // Column toggles
  const [showAdmissionNo, setShowAdmissionNo] = useState(true);
  const [showMaxMarks, setShowMaxMarks] = useState(true);
  const [showGrade, setShowGrade] = useState(true);
  const [showTotalMarks, setShowTotalMarks] = useState(true);
  const [showPercentage, setShowPercentage] = useState(true);
  const [showResult, setShowResult] = useState(true);
  const [colorCells, setColorCells] = useState(true);

  // Color thresholds
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  // Filters
  const [hideFailed, setHideFailed] = useState(false);
  const [minPct, setMinPct] = useState('');
  const [maxPct, setMaxPct] = useState('');

  // Signatures
  const [showParentSign, setShowParentSign] = useState(true);
  const [signatories, setSignatories] = useState('Class Teacher, Principal');

  const loadOptions = useCallback(() => {
    setLoadingOptions(true);
    setOptionsError(false);
    Promise.all([examService.getExams(), sectionService.getAll()])
      .then(([examRes, sectionRes]) => {
        setExams(examRes.data || []);
        setSections(sectionRes.data || []);
        if ((examRes.data || []).length > 0) setExamId(examRes.data[0].id);
      })
      .catch((err) => { notifyError(`Failed to load report options: ${err.message}`); setOptionsError(true); })
      .finally(() => setLoadingOptions(false));
  }, [notifyError]);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  const generate = useCallback(() => {
    if (!examId) return;
    setLoadingReport(true);
    setReportError(false);
    examService.getConsolidatedReport(examId, sectionId || undefined)
      .then((res) => setReport(res.data))
      .catch((err) => { notifyError(`Failed to generate report: ${err.message}`); setReportError(true); })
      .finally(() => setLoadingReport(false));
  }, [examId, sectionId, notifyError]);

  useEffect(() => { generate(); }, [generate]);

  const filteredRows = useMemo(() => {
    if (!report) return [];
    return report.rows.filter((r) => {
      if (hideFailed && r.result === 'FAIL') return false;
      if (minPct !== '' && (r.percentage === null || r.percentage < Number(minPct))) return false;
      if (maxPct !== '' && (r.percentage === null || r.percentage > Number(maxPct))) return false;
      return true;
    });
  }, [report, hideFailed, minPct, maxPct]);

  const updateThreshold = (idx, field, value) => {
    setThresholds((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  };

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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Complete Marks Report</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Consolidated, configurable class-wise marks report — one row per student, one column per subject</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <ReportConfigBox title="Class & Exam">
          <div>
            <label className="block text-slate-500 mb-1">Exam</label>
            <select value={examId} onChange={(e) => setExamId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <option value="">— Select Exam —</option>
              {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Section</label>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <option value="">All Sections</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{sectionLabel(s)}</option>)}
            </select>
          </div>
          <button onClick={generate} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
            <RefreshCw className="w-3.5 h-3.5" /> Generate
          </button>
        </ReportConfigBox>

        <ReportConfigBox title="View — Columns">
          <ReportCheckbox checked={showAdmissionNo} onChange={setShowAdmissionNo} label="Admission No." />
          <ReportCheckbox checked={showMaxMarks} onChange={setShowMaxMarks} label="Maximum Marks (per subject)" />
          <ReportCheckbox checked={showGrade} onChange={setShowGrade} label="Grade (per subject)" />
          <ReportCheckbox checked={showTotalMarks} onChange={setShowTotalMarks} label="Total Marks" />
          <ReportCheckbox checked={showPercentage} onChange={setShowPercentage} label="Total Percentage" />
          <ReportCheckbox checked={showResult} onChange={setShowResult} label="Result (Pass/Fail)" />
        </ReportConfigBox>

        <ReportConfigBox title="Colors & Filters">
          <ReportCheckbox checked={colorCells} onChange={setColorCells} label="Color-code by percentage" />
          {colorCells && thresholds.map((t, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-slate-500 shrink-0">If % less than</span>
              <input type="number" value={t.pct} onChange={(e) => updateThreshold(idx, 'pct', Number(e.target.value))} className="w-14 px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center" />
              <input type="color" value={t.color} onChange={(e) => updateThreshold(idx, 'color', e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-slate-200 dark:border-slate-700" />
            </div>
          ))}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-2">
            <ReportCheckbox checked={hideFailed} onChange={setHideFailed} label="Hide failed students" />
            <div className="flex items-center gap-2">
              <span className="text-slate-500 shrink-0">% between</span>
              <input type="number" placeholder="0" value={minPct} onChange={(e) => setMinPct(e.target.value)} className="w-14 px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center" />
              <span className="text-slate-400">and</span>
              <input type="number" placeholder="100" value={maxPct} onChange={(e) => setMaxPct(e.target.value)} className="w-14 px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center" />
            </div>
          </div>
        </ReportConfigBox>
      </div>

      <ReportConfigBox title="Signatures" className="no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReportCheckbox checked={showParentSign} onChange={setShowParentSign} label="Show Parent Signature column" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500 shrink-0">Signatories</span>
            <input type="text" value={signatories} onChange={(e) => setSignatories(e.target.value)} className="flex-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          </div>
        </div>
      </ReportConfigBox>

      {loadingReport ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : reportError ? (
        <ErrorState onRetry={generate} />
      ) : !report || report.subjects.length === 0 ? (
        <EmptyState title="No Exam Schedule Set Up" description="Set up subject-wise exam schedules with marks entered before generating this report." icon={FileBarChart} />
      ) : filteredRows.length === 0 ? (
        <EmptyState title="No Students Match These Filters" description="Try widening the percentage range or turning off 'Hide failed students'." icon={FileBarChart} />
      ) : (
        <div className="print-container bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-center">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">{report.exam?.name} — Complete Marks Report</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2 border border-slate-200 dark:border-slate-700">Roll No</th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700">Student Name</th>
                  {showAdmissionNo && <th className="p-2 border border-slate-200 dark:border-slate-700">Admission No</th>}
                  {report.subjects.map((subj) => (
                    <th key={subj.scheduleId} className="p-2 border border-slate-200 dark:border-slate-700">{subj.name}</th>
                  ))}
                  {showTotalMarks && <th className="p-2 border border-slate-200 dark:border-slate-700">Total</th>}
                  {showPercentage && <th className="p-2 border border-slate-200 dark:border-slate-700">%</th>}
                  {showResult && <th className="p-2 border border-slate-200 dark:border-slate-700">Result</th>}
                  <th className="p-2 border border-slate-200 dark:border-slate-700">Rank</th>
                  {showParentSign && <th className="p-2 border border-slate-200 dark:border-slate-700">Parent Sign</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.studentId}>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 font-mono font-bold text-indigo-600">{row.rollNumber || '—'}</td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white">{row.firstName} {row.lastName}</td>
                    {showAdmissionNo && <td className="p-2 border border-slate-200 dark:border-slate-700 font-mono">{row.admissionNumber}</td>}
                    {row.subjectMarks.map((sm) => {
                      const pct = sm.marksObtained !== null ? (sm.marksObtained / sm.maxMarks) * 100 : null;
                      const bg = colorCells ? colorForPercentage(pct, thresholds) : 'transparent';
                      return (
                        <td key={sm.scheduleId} className="p-2 border border-slate-200 dark:border-slate-700 text-center" style={{ backgroundColor: bg }}>
                          {sm.marksObtained === null ? 'AB' : (
                            <>
                              {sm.marksObtained}{showMaxMarks && <span className="text-slate-400">/{sm.maxMarks}</span>}
                              {showGrade && <span className="ml-1 font-bold">{sm.grade}</span>}
                            </>
                          )}
                        </td>
                      );
                    })}
                    {showTotalMarks && <td className="p-2 border border-slate-200 dark:border-slate-700 text-center font-mono">{row.totalMarks}/{row.totalMaxMarks}</td>}
                    {showPercentage && (
                      <td className="p-2 border border-slate-200 dark:border-slate-700 text-center font-bold" style={{ backgroundColor: colorCells ? colorForPercentage(row.percentage, thresholds) : 'transparent' }}>
                        {row.percentage === null ? '—' : `${row.percentage}%`}
                      </td>
                    )}
                    {showResult && (
                      <td className="p-2 border border-slate-200 dark:border-slate-700 text-center font-bold">
                        {row.result === 'PASS' ? <span className="text-emerald-600">PASS</span> : row.result === 'FAIL' ? <span className="text-rose-600">FAIL</span> : '—'}
                      </td>
                    )}
                    <td className="p-2 border border-slate-200 dark:border-slate-700 text-center font-mono">{row.rank || '—'}</td>
                    {showParentSign && <td className="p-2 border border-slate-200 dark:border-slate-700"></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {signatories && (
            <div className="p-6 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              {signatories.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                <span key={s} className="border-t border-slate-400 pt-1 px-8">{s}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsolidatedMarksReportPage;
