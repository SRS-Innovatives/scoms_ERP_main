import React, { useEffect, useState, useCallback } from 'react';
import { FileText, Calendar, Users, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import assignmentService from '../../services/assignmentService';
import ErrorState from '../../components/common/ErrorState';

export const AssignmentDetailsPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [asn, setAsn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    assignmentService.getAssignmentById(id)
      .then((res) => setAsn(res.data))
      .catch((err) => { showError(err.message || 'Failed to load assignment', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [id, showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (!asn) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-3xl text-center text-xs text-slate-500">
        Assignment not found. Go back to the assignments list and select one again.
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
            {asn.className} • {asn.subjectName}
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{asn.title}</h2>
          {asn.description && <p className="text-xs text-slate-500 mt-1">{asn.description}</p>}
        </div>
        <button
          onClick={() => navigate(`/staff/assignments/evaluate?id=${asn.id}`)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl shrink-0"
        >
          <CheckCircle className="w-4 h-4" /> Start Evaluation
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-xs">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <span className="text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due Date</span>
          <p className="font-bold text-slate-900 dark:text-slate-100">{new Date(asn.dueDate).toLocaleDateString()}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <span className="text-slate-500 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Max Marks</span>
          <p className="font-bold text-slate-900 dark:text-slate-100">{asn.totalMarks} Marks</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Submissions</span>
          <p className="font-bold text-emerald-600 dark:text-emerald-400">{asn._count?.submissions ?? 0}</p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailsPage;
