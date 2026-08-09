import React from 'react';
import DataTable from '../../components/common/DataTable';

export const VendorManagementPage = () => {
  const vendors = [
    { vendorName: 'Dell India Pvt Ltd', category: 'IT Hardware & PC Servers', gstNo: '33AAACD9401P1Z5', phone: '+91 80 2506 8000', email: 'education@dell.com' },
    { vendorName: 'Epson India Pvt Ltd', category: 'Projectors & AV Systems', gstNo: '33AABCE1928K1Z2', phone: '+91 80 4567 8900', email: 'sales@epson.co.in' }
  ];

  const columns = [
    { header: 'Vendor Name', key: 'vendorName', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Supply Category', key: 'category' },
    { header: 'GSTIN Number', key: 'gstNo', render: (val) => <span className="font-mono text-xs font-bold">{val}</span> },
    { header: 'Phone', key: 'phone', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Email', key: 'email' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Vendor & Supplier Directory</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Approved vendor master directory, GSTIN numbers & contact info</p>
      </div>

      <DataTable columns={columns} data={vendors} />
    </div>
  );
};

export default VendorManagementPage;
