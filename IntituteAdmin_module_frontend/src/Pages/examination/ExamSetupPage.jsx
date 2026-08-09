import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';

export const ExamSetupPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const exams = [
    { id: 'EXM-2025-EVEN', title: 'Even Semester End Examinations 2025', type: 'End Semester (Theory & Practical)', session: 'AY 2025-26', status: 'Scheduled', startDate: '15-Sep-2025', endDate: '05-Oct-2025' },
    { id: 'EXM-2025-CAT1', title: 'Continuous Assessment Test 1 (CAT-1)', type: 'Internal Assessment', session: 'AY 2025-26', status: 'Completed', startDate: '10-Jul-2025', endDate: '18-Jul-2025' }
  ];

  const columns = [
    { header: 'Exam ID', key: 'id', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Exam Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Assessment Category', key: 'type' },
    { header: 'Start Date', key: 'startDate', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'End Date', key: 'endDate', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Examination Setup Master</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure End Semester Exams, Internal Assessment Tests (CAT/IA), and Lab Vivas</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Create New Exam" onAddClick={() => notifySuccess('Create Exam Modal')} />
      <DataTable columns={columns} data={exams} />
    </div>
  );
};

export default ExamSetupPage;
