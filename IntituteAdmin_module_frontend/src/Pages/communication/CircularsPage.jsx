import React from 'react';
import DataTable from '../../components/common/DataTable';
import { FileText, Download } from 'lucide-react';

export const CircularsPage = () => {
  const circulars = [
    { refNo: 'CIR/2025/089', title: 'Independence Day Celebrations & Parade Flag Hoisting Protocol', date: '08-Aug-2026', signatory: 'Principal Dr. S. K. Rajan' },
    { refNo: 'CIR/2025/082', title: 'Revision of Bus Transport Pickup Timings for OMR Route', date: '01-Aug-2026', signatory: 'Transport Committee' }
  ];

  const columns = [
    { header: 'Circular Ref No', key: 'refNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Subject / Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Issue Date', key: 'date', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Issued By', key: 'signatory', render: (val) => <span className="font-semibold">{val}</span> },
    { header: 'PDF File', key: 'refNo', render: () => <button className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline"><Download className="w-3.5 h-3.5" /> Download PDF</button> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Official Circulars & Executive Notices</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Signed PDF circulars issued by Principal, HODs & Registrar Office</p>
      </div>

      <DataTable columns={columns} data={circulars} />
    </div>
  );
};

export default CircularsPage;
