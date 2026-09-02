import React, { useEffect, useState } from 'react';
import PrintLayout from '../../components/print/PrintLayout';
import assignmentService from '../../services/assignmentService';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';

export const PrintAssignmentEvaluation = () => {
  const { error: showError } = useNotification();
  const [assignments, setAssignments] = useState([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    assignmentService.getAssignments()
      .then((res) => {
        const list = res.data || [];
        setAssignments(list);
        if (list.length > 0) setAssignmentId(list[0].id);
      })
      .catch((err) => showError(err.message || 'Failed to load assignments', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => {
    if (!assignmentId) return;
    setLoadingDetail(true);
    assignmentService.getSubmissions(assignmentId)
      .then((res) => setDetail(res.data))
      .catch((err) => showError(err.message || 'Failed to load submissions', 'Load Failed'))
      .finally(() => setLoadingDetail(false));
  }, [assignmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (assignments.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        You have no assignments created yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex justify-end">
        <select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          {assignments.map((a) => <option key={a.id} value={a.id}>{a.title} ({a.className})</option>)}
        </select>
      </div>

      {loadingDetail || !detail ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-sky-600" /></div>
      ) : (
        <PrintLayout title="ASSIGNMENT EVALUATION SHEET" documentNo={`ASN-EVAL-${detail.assignment.id.slice(0, 8).toUpperCase()}`}>
          <div className="text-xs space-y-4">
            <div className="flex justify-between font-bold border-b border-slate-300 pb-2">
              <span>Subject: {detail.assignment.subjectName}</span>
              <span>Class: {detail.assignment.className}</span>
              <span>Max Marks: {detail.assignment.totalMarks}</span>
            </div>

            {detail.submissions.length === 0 ? (
              <p className="text-slate-500 text-center py-6">No submissions received for this assignment yet.</p>
            ) : (
              <table className="w-full text-left border border-slate-400">
                <thead className="bg-slate-200 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-2 border border-slate-400">Roll No</th>
                    <th className="p-2 border border-slate-400">Student Name</th>
                    <th className="p-2 border border-slate-400">Marks ({detail.assignment.totalMarks})</th>
                    <th className="p-2 border border-slate-400">Evaluator Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {detail.submissions.map((s) => (
                    <tr key={s.id}>
                      <td className="p-2 border border-slate-300 font-bold">{s.student?.rollNumber}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{s.student?.firstName} {s.student?.lastName}</td>
                      <td className="p-2 border border-slate-300 font-bold">{s.marksObtained !== null ? `${s.marksObtained} / ${detail.assignment.totalMarks}` : 'Pending'}</td>
                      <td className="p-2 border border-slate-300">{s.feedback || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </PrintLayout>
      )}
    </div>
  );
};

export default PrintAssignmentEvaluation;
