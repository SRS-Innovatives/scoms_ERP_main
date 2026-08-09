import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { useNotification } from '../../context/NotificationContext';
import { Award, Briefcase, Mail, Phone } from 'lucide-react';

export const AlumniManagementPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const alumni = [
    { name: 'R. Vigneshwar', passoutBatch: '2020-2024', course: 'B.E. CSE', employer: 'TCS Innovation Labs', designation: 'Systems Engineer', city: 'Bengaluru', phone: '+91 98401 99887' },
    { name: 'Deepika S. Nair', passoutBatch: '2019-2023', course: 'B.E. ECE', employer: 'Qualcomm India', designation: 'Hardware Design Engineer', city: 'Hyderabad', phone: '+91 97910 22334' },
    { name: 'K. Arvind Swamy', passoutBatch: '2018-2022', course: 'B.Tech AI&DS', employer: 'Zoho Corporation', designation: 'Senior AI Specialist', city: 'Chennai', phone: '+91 94441 55667' }
  ];

  const columns = [
    { header: 'Alumni Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Passout Batch', key: 'passoutBatch', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Degree / Branch', key: 'course' },
    { header: 'Current Employer', key: 'employer', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'Designation', key: 'designation' },
    { header: 'City', key: 'city' },
    { header: 'Contact', key: 'phone', render: (val) => <span className="font-mono text-xs">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Alumni Network Directory</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Track graduated students, current employer, placement records & alumni mentorship</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search alumni..." addLabel="Register Alumni" onAddClick={() => notifySuccess('Register Alumni')} />
      <DataTable columns={columns} data={alumni} />
    </div>
  );
};

export default AlumniManagementPage;
