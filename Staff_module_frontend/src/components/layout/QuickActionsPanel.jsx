import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, PlusCircle, BookOpen, Clock, FilePlus, Send } from 'lucide-react';

export const QuickActionsPanel = ({ onOpenCompose }) => {
  const actions = [
    { label: 'Take Attendance', icon: CheckSquare, path: '/staff/attendance/take', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800' },
    { label: 'Create Assignment', icon: PlusCircle, path: '/staff/assignments/create', color: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800' },
    { label: 'Add Question', icon: FilePlus, path: '/staff/exams/create-q', color: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800' },
    { label: 'Apply Leave', icon: Clock, path: '/staff/leave/apply', color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800' },
    { label: 'Upload Material', icon: BookOpen, path: '/staff/materials/upload', color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800' }
  ];

  return (
    <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        Quick Staff Operations
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <Link
              key={idx}
              to={act.path}
              className={`p-3 rounded-xl border font-semibold text-xs flex flex-col items-center justify-center gap-2 text-center transition-all hover:scale-105 ${act.color}`}
            >
              <Icon className="w-5 h-5" />
              <span>{act.label}</span>
            </Link>
          );
        })}
        <button
          onClick={onOpenCompose}
          className="p-3 rounded-xl border font-semibold text-xs flex flex-col items-center justify-center gap-2 text-center transition-all hover:scale-105 bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800"
        >
          <Send className="w-5 h-5" />
          <span>Send Notice</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActionsPanel;
