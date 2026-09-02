import React, { useEffect, useState, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import EvaluateSubmissionModal from '../../components/modals/EvaluateSubmissionModal';
import { Loader2, Inbox } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import assignmentService from '../../services/assignmentService';

export const StudentSubmissionsPage = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const { error: showError } = useNotification();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const load = useCallback(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    assignmentService.getSubmissions(id)
      .then((res) => {
        setAssignment(res.data.assignment);
        setSubmissions(res.data.submissions || []);
      })
      .catch((err) => showError(err.message || 'Failed to load submissions', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [id, showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Student Homework Submissions</h3>
          <p className="text-xs text-slate-500">Assignment: {assignment?.title || '—'}</p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-500 flex flex-col items-center gap-2">
          <Inbox className="w-8 h-8 text-slate-300" /> No submissions received yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Roll No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Submitted On</th>
                <th className="p-3">Answer</th>
                <th className="p-3">Status</th>
                <th className="p-3">Marks</th>
                <th className="p-3 text-right">Evaluate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold">{sub.student?.rollNumber || '—'}</td>
                  <td className="p-3 font-semibold">{sub.student?.firstName} {sub.student?.lastName}</td>
                  <td className="p-3 text-slate-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                  <td className="p-3 text-sky-600 font-medium max-w-[220px] truncate">{sub.fileUrl || sub.content || '—'}</td>
                  <td className="p-3"><StatusBadge status={sub.status} size="sm" /></td>
                  <td className="p-3 font-bold">{sub.marksObtained !== null && sub.marksObtained !== undefined ? `${sub.marksObtained} / ${assignment?.totalMarks}` : '-'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg"
                    >
                      Grade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EvaluateSubmissionModal
        isOpen={Boolean(selectedSubmission)}
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onSaved={load}
      />
    </div>
  );
};

export default StudentSubmissionsPage;
