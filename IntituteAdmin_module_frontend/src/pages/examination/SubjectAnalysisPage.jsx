import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { useAcademic } from '../../context/InstitutionContext';
import examService from '../../services/examService';
import { Loader2, BarChart3 } from 'lucide-react';

/** Pass/fail per subject for one exam, calculated from the real marks entered. */
export const SubjectAnalysisPage = () => {
  const academic = useAcademic();
  const { notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [rows, setRows] = useState([]);
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
    examService.getSubjectAnalysis(examId)
      .then((res) => setRows(res.data?.rows || []))
      .catch((err) => { notifyError(`Failed to load the analysis: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [examId, notifyError]);

  const pctTone = (v) => (v === null ? 'text-slate-400' : v >= 75 ? 'text-emerald-600' : v >= 50 ? 'text-amber-600' : 'text-rose-600');

  const columns = [
    { header: 'Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val || '—'}</span> },
    { header: 'Subject', key: 'subject', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: academic.label('course'), key: 'className' },
    { header: `${academic.label('teacher')} In-charge`, key: 'teachers', sortable: false, render: (val) => (val?.length ? val.join(', ') : <span className="text-slate-400">Not assigned</span>) },
    { header: 'Appeared', key: 'appeared' },
    { header: 'Absent', key: 'absent' },
    { header: 'Passed', key: 'passed', render: (val) => <span className="font-bold text-emerald-600">{val}</span> },
    { header: 'Failed', key: 'failed', render: (val) => <span className="font-bold text-rose-600">{val}</span> },
    { header: 'Average', key: 'average', render: (val, row) => (val === null ? '—' : `${val} / ${row.maxMarks}`) },
    { header: 'Pass %', key: 'passPct', render: (val) => <span className={`font-bold ${pctTone(val)}`}>{val === null ? 'No marks yet' : `${val}%`}</span> },
  ];

  if (error) return <ErrorState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Subject-wise Result Analysis</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pass percentage per subject, from the marks entered for the selected exam</p>
        </div>
        <select value={examId} onChange={(e) => setExamId(e.target.value)} className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
          {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : !rows.length ? (
        <EmptyState icon={BarChart3} title="Nothing to analyse yet" description={exams.length ? 'This exam has no schedule yet. Add subjects under Examination → Exam Schedule.' : 'Create an exam first under Examination → Exam Setup.'} />
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  );
};

export default SubjectAnalysisPage;
