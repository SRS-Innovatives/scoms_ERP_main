import React from 'react';
import DataTable from '../../components/common/DataTable';
import { Briefcase } from 'lucide-react';

export const ExperienceDetailsPage = () => {
  const experiences = [
    { institution: 'Sri Ramakrishna College of Engg', role: 'Professor & HOD', period: '2018 - Present', duration: '7 Years' },
    { institution: 'SSN College of Engineering', role: 'Associate Professor', period: '2012 - 2018', duration: '6 Years' },
    { institution: 'Vel Tech R&D Institute', role: 'Assistant Professor', period: '2007 - 2012', duration: '5 Years' }
  ];

  const columns = [
    { header: 'Institution / Company', key: 'institution', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Role Held', key: 'role', render: (val) => <span className="font-semibold text-indigo-600">{val}</span> },
    { header: 'Service Period', key: 'period', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Duration', key: 'duration', render: (val) => <span className="font-mono font-bold">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Faculty Experience & Service History</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Prior teaching, industrial & research experience records</p>
      </div>

      <DataTable columns={columns} data={experiences} />
    </div>
  );
};

export default ExperienceDetailsPage;
