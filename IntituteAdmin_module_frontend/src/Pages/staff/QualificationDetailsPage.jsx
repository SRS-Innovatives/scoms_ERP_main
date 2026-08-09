import React from 'react';
import DataTable from '../../components/common/DataTable';
import FormSection from '../../components/common/FormSection';
import { Award, GraduationCap } from 'lucide-react';

export const QualificationDetailsPage = () => {
  const qualifications = [
    { degree: 'Ph.D. in Computer Science', university: 'IIT Madras', year: '2012', grade: 'Commended' },
    { degree: 'M.E. Computer Science & Engg', university: 'Anna University, Guindy', year: '2007', grade: 'First Class with Distinction' },
    { degree: 'B.E. Computer Science & Engg', university: 'Madras University', year: '2004', grade: 'First Class' }
  ];

  const columns = [
    { header: 'Degree / Diploma', key: 'degree', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><GraduationCap className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'University / Board', key: 'university' },
    { header: 'Year of Passing', key: 'year', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Grade / Class', key: 'grade', render: (val) => <span className="font-semibold text-emerald-700">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Faculty Qualification Master</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Academic degrees, Ph.D. research publications & UGC/NET qualification records</p>
      </div>

      <DataTable columns={columns} data={qualifications} />
    </div>
  );
};

export default QualificationDetailsPage;
