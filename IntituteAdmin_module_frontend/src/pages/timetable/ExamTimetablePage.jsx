import React from 'react';
import DataTable from '../../components/common/DataTable';
import { Calendar, Printer } from 'lucide-react';

export const ExamTimetablePage = () => {
  const schedule = [
    { code: 'CS8601', title: 'Mobile Computing', date: '15-Sep-2025', session: 'FN (09:30 AM - 12:30 PM)', dept: 'CSE / AIDS' },
    { code: 'CS8602', title: 'Compiler Design', date: '17-Sep-2025', session: 'FN (09:30 AM - 12:30 PM)', dept: 'CSE' },
    { code: 'CS8603', title: 'Artificial Intelligence', date: '19-Sep-2025', session: 'FN (09:30 AM - 12:30 PM)', dept: 'AIDS' },
    { code: 'CS8691', title: 'Cloud Computing Laboratory', date: '22-Sep-2025', session: 'AN (01:30 PM - 04:30 PM)', dept: 'CSE' }
  ];

  const columns = [
    { header: 'Course Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Course Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Department', key: 'dept' },
    { header: 'Date of Exam', key: 'date', render: (val) => <span className="font-mono font-bold text-slate-900">{val}</span> },
    { header: 'Session & Timing', key: 'session', render: (val) => <span className="font-medium text-purple-600">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">University Semester End Examination Schedule</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Anna University / Autonomous end semester exam timetable schedule</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          <Printer className="w-4 h-4" />
          <span>Print Schedule</span>
        </button>
      </div>

      <DataTable columns={columns} data={schedule} />
    </div>
  );
};

export default ExamTimetablePage;
