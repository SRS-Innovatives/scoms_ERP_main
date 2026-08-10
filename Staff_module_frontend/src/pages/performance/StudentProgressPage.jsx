import React from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';
import StudentTable from '../../components/common/StudentTable';
import { mockStudentsList } from '../../data/mockStaffData';

export const StudentProgressPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Student Academic Progress Tracker</h2>
          <p className="text-xs text-slate-500">Track student individual progress, attendance, and exam trajectories.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart title="Academic Progress Trajectory (Unit Tests & Mid-Term)" height={200} />
        <PerformanceChart title="Syllabus Completion & Student Mastery Rate" height={200} />
      </div>

      <StudentTable students={mockStudentsList} />
    </div>
  );
};

export default StudentProgressPage;
