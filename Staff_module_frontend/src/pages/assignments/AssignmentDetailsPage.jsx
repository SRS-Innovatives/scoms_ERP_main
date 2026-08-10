import React from 'react';
import { mockAssignments } from '../../data/mockStaffData';
import { FileText, Calendar, Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AssignmentDetailsPage = () => {
  const navigate = useNavigate();
  const asn = mockAssignments[0];

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
            {asn.class} • {asn.subject}
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{asn.title}</h2>
        </div>
        <button
          onClick={() => navigate('/staff/assignments/evaluate')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl"
        >
          <CheckCircle className="w-4 h-4" /> Start Evaluation
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-xs">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <span className="text-slate-500">Due Date</span>
          <p className="font-bold text-slate-900 dark:text-slate-100">{asn.dueDate}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <span className="text-slate-500">Max Marks</span>
          <p className="font-bold text-slate-900 dark:text-slate-100">{asn.maxMarks} Marks</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <span className="text-slate-500">Submissions</span>
          <p className="font-bold text-emerald-600 dark:text-emerald-400">{asn.totalSubmissions} / {asn.totalStudents}</p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailsPage;
