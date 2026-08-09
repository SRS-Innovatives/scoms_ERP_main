import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { useNotification } from '../../context/NotificationContext';

export const SubjectSetupPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const subjects = [
    { code: 'CS8601', title: 'Mobile Computing', dept: 'CSE', type: 'Theory', credits: 3, semester: 'Semester 6' },
    { code: 'CS8602', title: 'Compiler Design', dept: 'CSE', type: 'Theory', credits: 4, semester: 'Semester 6' },
    { code: 'CS8603', title: 'Artificial Intelligence', dept: 'AIDS', type: 'Theory', credits: 3, semester: 'Semester 6' },
    { code: 'CS8691', title: 'Cloud Computing Laboratory', dept: 'CSE', type: 'Practical / Lab', credits: 2, semester: 'Semester 6' }
  ];

  const columns = [
    { header: 'Subject Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Subject Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Department', key: 'dept' },
    { header: 'Type', key: 'type', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{val}</span> },
    { header: 'Credits', key: 'credits', render: (val) => <span className="font-bold font-mono">{val} Credits</span> },
    { header: 'Semester', key: 'semester' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Subject Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure Theory, Practical, Elective subjects and University syllabus credits</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search subjects..." addLabel="Add Subject" onAddClick={() => notifySuccess('Add Subject')} />
      <DataTable columns={columns} data={subjects.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))} />
    </div>
  );
};

export default SubjectSetupPage;
