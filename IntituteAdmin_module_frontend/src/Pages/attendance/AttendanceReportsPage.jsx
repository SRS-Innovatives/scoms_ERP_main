import React from 'react';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';
import { chartData, studentsList } from '../../data/mockData';

export const AttendanceReportsPage = () => {
  const columns = [
    { header: 'Student', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Total Classes', key: 'id', render: () => '120' },
    { header: 'Attended', key: 'id', render: () => '114' },
    { header: 'Attendance %', key: 'id', render: () => <span className="font-mono font-bold text-emerald-600">95.0%</span> },
    { header: 'Condonation Status', key: 'id', render: () => <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">ELIGIBLE FOR EXAM</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Attendance Analytics & Condonation Reports</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Semester-end attendance percentage calculation for university exam eligibility (Min 75%)</p>
      </div>

      <ChartCard title="Weekly Attendance Trend" subtitle="Across all Engineering & Arts Departments" type="line" data={chartData.attendanceTrend} />
      <DataTable columns={columns} data={studentsList} />
    </div>
  );
};

export default AttendanceReportsPage;
