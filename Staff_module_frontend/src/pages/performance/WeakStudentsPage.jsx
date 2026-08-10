import React from 'react';
import StudentTable from '../../components/common/StudentTable';
import { mockStudentsList } from '../../data/mockStaffData';
import { AlertCircle } from 'lucide-react';

export const WeakStudentsPage = () => {
  const weakStudents = mockStudentsList.filter(s => s.lastMarks < 60 || s.attendancePercent < 75);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
        <AlertCircle className="w-5 h-5" />
        <h2 className="text-lg font-bold">Remedial Action Needed - At-Risk / Weak Students</h2>
      </div>
      <p className="text-xs text-slate-500">Students with low attendance (&lt;75%) or low assessment scores (&lt;60 marks).</p>
      <StudentTable students={weakStudents} />
    </div>
  );
};

export default WeakStudentsPage;
