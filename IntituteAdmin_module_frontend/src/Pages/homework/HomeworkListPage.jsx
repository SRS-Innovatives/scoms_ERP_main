import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, Paperclip, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import homeworkService from '../../services/homeworkService';

/** Read-only, institution-wide view of every homework post — actual posting happens on
 * the Staff side per subject/section, same division as attendance oversight. */
export const HomeworkListPage = () => {
  const { error: showError } = useNotification();
  const navigate = useNavigate();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(() => {
    setLoading(true);
    homeworkService.getAll()
      .then((res) => setHomework(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load homework posts', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const columns = [
    {
      header: 'Homework',
      key: 'title',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{v}</p>
            <p className="text-[10px] text-slate-400">{row.subjectName}</p>
          </div>
          {row.hasAttachment && <Paperclip className="w-3.5 h-3.5 text-sky-500 shrink-0" title="Has attachment" />}
        </div>
      ),
    },
    { header: 'Class', key: 'className' },
    {
      header: 'Posted By',
      key: 'staff',
      render: (v) => v ? `${v.firstName} ${v.lastName}`.trim() || v.user?.email : '—',
    },
    { header: 'Due Date', key: 'dueDate', render: (v) => new Date(v).toLocaleDateString('en-IN') },
    {
      header: 'Submissions',
      key: 'submissionCount',
      render: (v, row) => (
        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
          {v} / {row.totalStudents ?? '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (v) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${v === 'PUBLISHED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
          {v}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Homework</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Every homework post from every teacher, institution-wide — with description, attachment, and submission tracking.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
          {homework.length} Posts
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : homework.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <ClipboardList className="w-8 h-8 text-slate-300" />
          No homework has been posted yet. Staff post homework from their own portal — it will show up here automatically.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={homework}
          searchPlaceholder="Search homework by title, class, subject..."
          onRowClick={(row) => navigate(`/admin/homework/${row.id}`)}
        />
      )}
    </div>
  );
};

export default HomeworkListPage;
