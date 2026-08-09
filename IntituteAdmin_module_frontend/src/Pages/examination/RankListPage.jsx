import React from 'react';
import DataTable from '../../components/common/DataTable';
import { Award, Trophy } from 'lucide-react';
import { studentsList } from '../../data/mockData';

export const RankListPage = () => {
  const ranks = [
    { rank: 1, name: 'Kavitha R. Sharma', rollNo: '21CS101', dept: 'CSE', cgpa: '9.85', status: 'GOLD MEDALIST' },
    { rank: 2, name: 'Aditya V. Karthik', rollNo: '21CS102', dept: 'CSE', cgpa: '9.62', status: 'SILVER MEDALIST' },
    { rank: 3, name: 'Priyanka M. Sundaram', rollNo: '21AD015', dept: 'AIDS', cgpa: '9.45', status: 'BRONZE MEDALIST' }
  ];

  const columns = [
    {
      header: 'Rank',
      key: 'rank',
      render: (val) => (
        <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center font-mono">
          #{val}
        </span>
      )
    },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Department', key: 'dept' },
    { header: 'Overall CGPA', key: 'cgpa', render: (val) => <span className="font-mono font-bold text-emerald-600 text-sm">{val} / 10.0</span> },
    { header: 'Honors', key: 'status', render: (val) => <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Department Rank Holders & Gold Medalist List</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Top academic rank holders for Convocation & Gold Medal awards</p>
      </div>

      <DataTable columns={columns} data={ranks} />
    </div>
  );
};

export default RankListPage;
