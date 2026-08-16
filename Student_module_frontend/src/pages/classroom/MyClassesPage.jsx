import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { mockTodaySchedule } from '../../data/mockStudentData';
import { Video, BookOpen, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MyClassesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader title="Virtual Classrooms & Lecture Links" subtitle="Connect to online lectures via Google Meet, Zoom, or Microsoft Teams." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockTodaySchedule.map((cls) => (
          <div key={cls.period} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                  {cls.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{cls.subject}</h3>
                <p className="text-xs text-slate-500">{cls.teacher} • {cls.startTime} - {cls.endTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <a
                href={cls.onlineLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Video className="w-4 h-4" /> Join Google Meet
              </a>
              <button
                onClick={() => navigate('/student/materials')}
                className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Materials
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyClassesPage;
