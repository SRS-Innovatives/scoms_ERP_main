import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { Trophy, Loader2, BarChart3 } from 'lucide-react';
import examService from '../../services/examService';

export const RankListPage = () => {
  const { notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [rankList, setRankList] = useState([]);
  const [subjectAnalysis, setSubjectAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    examService.getExams()
      .then((res) => {
        setExams(res.data || []);
        if ((res.data || []).length > 0) setExamId(res.data[0].id);
      })
      .catch((err) => { notifyError(`Failed to load exams: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  const fetchRankList = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    setError(false);
    try {
      const res = await examService.getRankList(examId);
      setRankList(res.data.rankList || []);
      setSubjectAnalysis(res.data.subjectAnalysis || []);
    } catch (error) {
      notifyError(`Failed to load rank list: ${error.message}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [examId, notifyError]);

  useEffect(() => {
    fetchRankList();
  }, [fetchRankList]);

  const honorFor = (rank) => (rank === 1 ? 'GOLD MEDALIST' : rank === 2 ? 'SILVER MEDALIST' : rank === 3 ? 'BRONZE MEDALIST' : null);

  const columns = [
    {
      header: 'Rank',
      key: 'rank',
      render: (val) => (
        <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center font-mono">
          #{val}
        </span>
      ),
    },
    { header: 'Student Name', key: 'student', sortable: false, render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.firstName} {val?.lastName}</span> },
    { header: 'Roll No', key: 'student2', sortable: false, render: (_, row) => <span className="font-mono font-bold text-indigo-600">{row.student?.rollNumber}</span> },
    { header: 'Section', key: 'student3', sortable: false, render: (_, row) => row.student?.section?.name || '—' },
    { header: 'Total', key: 'total', sortable: false, render: (_, row) => <span className="font-mono">{row.total} / {row.maxTotal}</span> },
    { header: 'Percentage', key: 'percentage', render: (val) => <span className="font-mono font-bold text-emerald-600 text-sm">{val}%</span> },
    {
      header: 'Honors',
      key: 'rank2',
      sortable: false,
      render: (_, row) => {
        const honor = honorFor(row.rank);
        return honor ? <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs">{honor}</span> : '—';
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Rank List & Subject Analysis</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Ranked by overall percentage across all published + entered marks for the exam</p>
        </div>
        <select value={examId} onChange={(e) => setExamId(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200">
          {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={fetchRankList} />
      ) : rankList.length === 0 ? (
        <EmptyState title="No Marks Entered Yet" message="Rank list will appear once marks are entered for at least one subject." icon={Trophy} />
      ) : (
        <>
          <DataTable columns={columns} data={rankList} />

          {subjectAnalysis.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Subject-wise Class Average</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Class Average</th>
                    <th className="p-3">Max Marks</th>
                    <th className="p-3">Students Appeared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {subjectAnalysis.map((s) => (
                    <tr key={s.subject}>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{s.subject}</td>
                      <td className="p-3 font-mono font-bold text-indigo-600">{s.average}</td>
                      <td className="p-3 font-mono text-slate-500">{s.maxMarks}</td>
                      <td className="p-3 text-slate-500">{s.studentsAppeared}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RankListPage;
