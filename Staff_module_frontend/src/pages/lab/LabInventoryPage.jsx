import React from 'react';
import { mockLabInventory } from '../../data/mockStaffData';
import StatusBadge from '../../components/common/StatusBadge';
import { FlaskConical, Plus } from 'lucide-react';

export const LabInventoryPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-500" /> Physics Laboratory Asset & Equipment Register
          </h3>
          <p className="text-xs text-slate-500">Track equipment count, working condition, and defective units.</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl">
          <Plus className="w-4 h-4" /> Add Equipment
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
            <tr>
              <th className="p-3">Asset Code</th>
              <th className="p-3">Equipment Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Total Qty</th>
              <th className="p-3">Available</th>
              <th className="p-3">Defective</th>
              <th className="p-3 text-right">Condition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {mockLabInventory.map((eq) => (
              <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-3 font-mono font-bold">{eq.code}</td>
                <td className="p-3 font-semibold">{eq.name}</td>
                <td className="p-3 text-slate-500">{eq.category}</td>
                <td className="p-3 font-bold">{eq.totalQty}</td>
                <td className="p-3 font-bold text-emerald-600">{eq.availableQty}</td>
                <td className="p-3 font-bold text-rose-600">{eq.defectiveQty}</td>
                <td className="p-3 text-right"><StatusBadge status={eq.condition} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabInventoryPage;
