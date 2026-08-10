import React from 'react';
import { mockAssignedClasses } from '../../data/mockStaffData';
import { Users, BookOpen, MapPin, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AssignedClassesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Assigned Classes & Subjects</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Classes where you act as Class Teacher or Subject Lecturer.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mockAssignedClasses.map((cls) => (
          <div
            key={cls.id}
            className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  {cls.section} Section
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">{cls.name}</h3>
              </div>
              {cls.isClassTeacher && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Class Teacher
                </span>
              )}
            </div>

            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-500" /> Subject: {cls.subject}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" /> {cls.studentsCount} Enrolled Students
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> {cls.room}
              </span>
            </div>

            {/* Syllabus progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[11px] font-medium mb-1">
                <span>Syllabus Covered</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{cls.syllabusProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{ width: `${cls.syllabusProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/staff/classes/details')}
                className="flex-1 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <span>View Class Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate('/staff/attendance/take')}
                className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                Attendance
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignedClassesPage;
