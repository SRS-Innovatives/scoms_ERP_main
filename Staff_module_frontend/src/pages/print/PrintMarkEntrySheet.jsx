import React, { useEffect, useState, useCallback } from 'react';
import PrintLayout from '../../components/print/PrintLayout';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';

export const PrintMarkEntrySheet = () => {
  const { error: showError } = useNotification();
  const [schedules, setSchedules] = useState([]);
  const [scheduleId, setScheduleId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    examService.getMySchedules()
      .then((res) => {
        const list = res.data || [];
        setSchedules(list);
        if (list.length > 0) setScheduleId(list[0].id);
      })
      .catch((err) => { showError(err.message || 'Failed to load exam duties', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!scheduleId) return;
    setLoadingDetail(true);
    examService.getRoster(scheduleId)
      .then((res) => setDetail(res.data))
      .catch((err) => showError(err.message || 'Failed to load roster', 'Load Failed'))
      .finally(() => setLoadingDetail(false));
  }, [scheduleId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (schedules.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        You have no exam duties assigned yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex justify-end">
        <select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          {schedules.map((s) => <option key={s.id} value={s.id}>{s.exam?.name} — {s.subject?.name}</option>)}
        </select>
      </div>

      {loadingDetail || !detail ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-sky-600" /></div>
      ) : (
        <PrintLayout title="EXAMINATION MARKS ENTRY BROADSHEET" documentNo={`MRK-BS-${detail.schedule.id.slice(0, 8).toUpperCase()}`}>
          <div className="text-xs space-y-4">
            <div className="flex justify-between font-bold border-b border-slate-300 pb-2">
              <span>Exam: {detail.schedule.exam?.name}</span>
              <span>Subject: {detail.schedule.subject?.name}</span>
              <span>Max Marks: {detail.schedule.maxMarks}</span>
            </div>

            <table className="w-full text-left border border-slate-400">
              <thead className="bg-slate-200 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-2 border border-slate-400">Roll No</th>
                  <th className="p-2 border border-slate-400">Student Name</th>
                  <th className="p-2 border border-slate-400">Marks ({detail.schedule.maxMarks})</th>
                  <th className="p-2 border border-slate-400">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {detail.roster.map((s) => (
                  <tr key={s.id}>
                    <td className="p-2 border border-slate-300 font-bold">{s.rollNumber}</td>
                    <td className="p-2 border border-slate-300 font-semibold">{s.firstName} {s.lastName}</td>
                    <td className="p-2 border border-slate-300 font-bold">{s.mark ? s.mark.marksObtained : '-'}</td>
                    <td className="p-2 border border-slate-300 font-bold">{s.mark?.grade || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PrintLayout>
      )}
    </div>
  );
};

export default PrintMarkEntrySheet;
