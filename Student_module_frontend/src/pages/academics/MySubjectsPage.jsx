import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockStudentSubjects } from '../../data/mockStudentData';
import { BookOpen, User, Award, CheckCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MySubjectsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader title="Enrolled Academic Subjects" subtitle="Semester 4 Course Roster & Performance Overview" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockStudentSubjects.map((sub) => (
          <div
            key={sub.code}
            onClick={() => navigate(`/student/subjects/${sub.code}`)}
            className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950">
                {sub.code}
              </span>
              <StatusBadge status={sub.grade} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                {sub.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-500" /> Faculty: <span className="font-semibold text-slate-700 dark:text-slate-300">{sub.faculty}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100 dark:border-slate-800 text-center text-xs">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Credits</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{sub.credits}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Attendance</p>
                <p className={`font-bold ${sub.attendance < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>{sub.attendance}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Internal</p>
                <p className="font-bold text-indigo-600">{sub.internalMarks} / {sub.totalMarks}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 pt-1">
              <span>View Subject Materials & Notes</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MySubjectsPage;
