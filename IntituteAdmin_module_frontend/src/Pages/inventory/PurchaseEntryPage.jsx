import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const PurchaseEntryPage = () => {
  const orders = [
    { poNo: 'PO/2025/089', vendor: 'Dell India Pvt Ltd', items: '60x OptiPlex 7090 Desktop PCs', totalAmount: 4200000, date: '15-Nov-2023', status: 'Delivered' }
  ];

  const columns = [
    { header: 'PO Number', key: 'poNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Vendor Name', key: 'vendor', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Purchased Items', key: 'items' },
    { header: 'Order Value (₹)', key: 'totalAmount', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'PO Date', key: 'date', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Purchase Orders & Inward Entry</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Quotations, Purchase Orders (PO), Goods Received Note (GRN) & invoice billing</p>
      </div>

      <DataTable columns={columns} data={orders} />
    </div>
  );
};

export default PurchaseEntryPage;
