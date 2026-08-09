import React from 'react';
import DataTable from '../../components/common/DataTable';
import { CreditCard, DollarSign } from 'lucide-react';
import { staffList } from '../../data/mockData';

export const SalaryStructurePage = () => {
  const columns = [
    { header: 'Emp ID', key: 'empId', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Staff Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Role', key: 'role' },
    { header: 'Department', key: 'dept' },
    { header: 'Basic Pay', key: 'salary', render: (val) => <span className="font-mono">₹{Math.round(val * 0.5).toLocaleString()}</span> },
    { header: 'HRA / DA / Allowances', key: 'salary', render: (val) => <span className="font-mono text-emerald-600">+₹{Math.round(val * 0.5).toLocaleString()}</span> },
    { header: 'Gross Salary (Monthly)', key: 'salary', render: (val) => <span className="font-mono font-bold text-slate-900 dark:text-white">₹{val.toLocaleString()}</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Salary Structure & Payroll Matrix</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">7th Pay Commission / Institutional scale breakdown (Basic, HRA, DA, PF, ESI)</p>
      </div>

      <DataTable columns={columns} data={staffList} />
    </div>
  );
};

export default SalaryStructurePage;
