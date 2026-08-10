import React from 'react';
import StatusBadge from './StatusBadge';
import { Calendar, Users, FileText, CheckCircle } from 'lucide-react';

export const AssignmentCard = ({ assignment, onEvaluateClick, onViewDetails }) => {
  const submissionPercent = Math.round((assignment.totalSubmissions / assignment.totalStudents) * 100);

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            {assignment.class} • {assignment.subject}
          </span>
          <StatusBadge status={assignment.status} size="sm" />
        </div>

        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 line-clamp-1">
          {assignment.title}
        </h4>

        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Due: {assignment.dueDate}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Max: {assignment.maxMarks} Marks
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Submissions
            </span>
            <span className="text-slate-900 dark:text-slate-100 font-semibold">
              {assignment.totalSubmissions} / {assignment.totalStudents} ({submissionPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                submissionPercent >= 80 ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
              style={{ width: `${submissionPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => onEvaluateClick && onEvaluateClick(assignment)}
          className="flex-1 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Evaluate</span>
        </button>

        <button
          onClick={() => onViewDetails && onViewDetails(assignment)}
          className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
        >
          Details
        </button>
      </div>
    </div>
  );
};

export default AssignmentCard;
