import React from 'react';
import StudentTable from '../../components/common/StudentTable';
import { mockStudentsList } from '../../data/mockStaffData';
import { Users, Award, BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ClassDetailsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
            Class Teacher: Dr. Rajesh Sharma
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">Class 12-A • Physics & Science Stream</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Room Hall B • 40 Students Enrolled • Academic Year 2026-2027</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/staff/attendance/take')}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
          >
            Take Class Attendance
          </button>
        </div>
      </div>

      <StudentTable
        students={mockStudentsList}
        onViewProfile={(s) => navigate('/staff/performance/progress')}
        onContactParent={(s) => navigate('/staff/communication/parent-messages')}
      />
    </div>
  );
};

export default ClassDetailsPage;
