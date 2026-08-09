import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { useNotification } from '../../context/NotificationContext';

export const SectionSetupPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const sections = [
    { id: 'SEC-A', name: 'Section A', class: '3rd Year CSE', room: 'Main Building Block 3 - Room 304', advisor: 'Prof. S. Malathi', intake: 60 },
    { id: 'SEC-B', name: 'Section B', class: '3rd Year CSE', room: 'Main Building Block 3 - Room 305', advisor: 'Dr. K. Vignesh', intake: 60 },
    { id: 'SEC-C', name: 'Section A', class: '3rd Year AI&DS', room: 'Tech Block - Room 102', advisor: 'Dr. S. Sundar', intake: 60 }
  ];

  const columns = [
    { header: 'Section Name', key: 'name', render: (val) => <span className="font-bold text-indigo-600">{val}</span> },
    { header: 'Associated Course/Class', key: 'class', render: (val) => <span className="font-semibold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Classroom Venue', key: 'room' },
    { header: 'Class Advisor / Tutor', key: 'advisor', render: (val) => <span className="font-medium text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'Student Capacity', key: 'intake', render: (val) => `${val} Students` }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Section Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage class sections (A, B, C), room assignments, and class tutors</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Add Section" onAddClick={() => notifySuccess('Add Section Modal')} />
      <DataTable columns={columns} data={sections} />
    </div>
  );
};

export default SectionSetupPage;
