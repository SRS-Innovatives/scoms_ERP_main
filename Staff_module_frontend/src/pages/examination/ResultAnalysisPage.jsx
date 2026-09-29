import React, { useEffect, useState } from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';

const GRADE_ORDER = ['A+', 'A', 'B', 'C', 'D', 'F'];

export const ResultAnalysisPage = () => {
  const { error: showError } = useNotification();
  const [schedules, setSchedules] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const loadSchedules = () => {
    setLoading(true);
    setError(false);
    examService.getMySchedules()
      .then((res) => {
        const list = res.data || [];
        setSchedules(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch((err) => { showError(err.message || 'Failed to load exam duties', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(loadSchedules, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedId) return;
    setLoadingRoster(true);
    examService.getRoster(selectedId)
      .then((res) => setRoster(res.data?.roster || []))
      .catch((err) => showError(err.message || 'Failed to load results', 'Load Failed'))
      .finally(() => setLoadingRoster(false));
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={loadSchedules} />;
  }

  if (schedules.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        You have no exam duties assigned yet.
      </div>
    );
  }

  const selected = schedules.find((s) => s.id === selectedId);
  const marked = roster.filter((s) => s.mark);

  const gradeCounts = {};
  GRADE_ORDER.forEach((g) => { gradeCounts[g] = 0; });
  marked.forEach((s) => { if (gradeCounts[s.mark.grade] !== undefined) gradeCounts[s.mark.grade] += 1; });
  const gradeChartData = GRADE_ORDER.map((g) => ({ label: g, value: marked.length > 0 ? Math.round((gradeCounts[g] / marked.length) * 100) : 0 }));

  const classAvg = marked.length > 0
    ? Math.round(marked.reduce((sum, s) => sum + (s.mark.marksObtained / selected.maxMarks) * 100, 0) / marked.length)
    : 0;
  const passPct = selected ? Math.round((selected.passMarks / selected.maxMarks) * 100) : 0;
  const avgVsTargetData = marked.length > 0 ? [
    { label: 'Class Avg', value: classAvg },
    { label: 'Pass Mark', value: passPct },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Result Analysis & Grade Distribution</h2>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>{s.exam?.name} — {s.subject?.name}</option>
          ))}
        </select>
      </div>

      {loadingRoster ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-sky-600" /></div>
      ) : marked.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No marks entered yet for {selected?.subject?.name} — {selected?.exam?.name}.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart title={`${selected?.subject?.name} Grade Distribution (%)`} height={220} data={gradeChartData} periodLabel={`${marked.length} Students`} />
          <PerformanceChart title="Class Average vs Pass Mark (%)" height={220} data={avgVsTargetData} periodLabel={selected?.exam?.name} />
        </div>
      )}
    </div>
  );
};

export default ResultAnalysisPage;
