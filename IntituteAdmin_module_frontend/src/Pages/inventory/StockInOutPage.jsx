import React from 'react';
import DataTable from '../../components/common/DataTable';

export const StockInOutPage = () => {
  const stocks = [
    { item: 'A4 Printing Paper Reams', category: 'Stationery', qty: 150, location: 'Central Admin Store', status: 'In Stock' },
    { item: 'HDMI Display Cables (2m)', category: 'AV Accessories', qty: 40, location: 'IT Helpdesk Store', status: 'In Stock' }
  ];

  const columns = [
    { header: 'Item Description', key: 'item', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Category', key: 'category' },
    { header: 'Current Stock Qty', key: 'qty', render: (val) => <span className="font-mono font-bold text-indigo-600">{val} Units</span> },
    { header: 'Store Location', key: 'location' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Store Consumables & Stock Register</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Stationery, printing paper, toner cartridges, lab consumables & cleaning supplies</p>
      </div>

      <DataTable columns={columns} data={stocks} />
    </div>
  );
};

export default StockInOutPage;
