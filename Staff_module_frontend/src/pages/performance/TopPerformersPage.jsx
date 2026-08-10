import React from 'react';
import StudentTable from '../../components/common/StudentTable';
import { mockStudentsList } from '../../data/mockStaffData';
import { Award } from 'lucide-react';

export const TopPerformersPage = () => {
  const toppers = mockStudentsList.filter(s => s.lastMarks >= 85);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <Award className="w-5 h-5" />
        <h2 className="text-lg font-bold">Class Rankers & Top Performers</h2>
      </div>
      <p className="text-xs text-slate-500">Students scoring above 85% in recent Physics assessments.</p>
      <StudentTable students={toppers} />
    </div>
  );
};

export default TopPerformersPage;
