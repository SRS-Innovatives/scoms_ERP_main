import React, { useEffect, useState } from 'react';
import AssignmentCard from '../../components/common/AssignmentCard';
import { Plus, Loader2, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import assignmentService from '../../services/assignmentService';

const toCardShape = (a) => ({
  id: a.id,
  class: a.className,
  subject: a.subjectName,
  status: a.status,
  title: a.title,
  dueDate: a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—',
  maxMarks: a.totalMarks,
  totalSubmissions: a._count?.submissions || 0,
  totalStudents: a._count?.submissions || 0, // no roster-count endpoint yet — shown as submissions received
});

export const AssignmentListPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assignmentService.getAssignments()
      .then((res) => setAssignments(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load assignments', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Class Assignments Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage active, evaluating, and archived student homework.</p>
        </div>
        <button
          onClick={() => navigate('/staff/assignments/create')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Assignment
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>
      ) : assignments.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <ClipboardList className="w-8 h-8 text-slate-300" />
          No assignments created yet. Click "Create Assignment" to publish your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assignments.map((asn) => (
            <AssignmentCard
              key={asn.id}
              assignment={toCardShape(asn)}
              onEvaluateClick={(a) => navigate(`/staff/assignments/evaluate?id=${a.id}`)}
              onViewDetails={(a) => navigate(`/staff/assignments/details?id=${a.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentListPage;
