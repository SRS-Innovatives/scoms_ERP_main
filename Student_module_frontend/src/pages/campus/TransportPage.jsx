import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Bus, MapPin, Phone } from 'lucide-react';

export const TransportPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="College Transport & Bus Pass" subtitle="Vehicle route, assigned boarding stop, driver contacts, and live GPS status." />

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Bus Route No. 12 (Palayamkottai Express)</h3>
              <p className="text-xs text-slate-500">Vehicle No: TN-72-AZ-4012</p>
            </div>
          </div>
          <StatusBadge status="Active Pass" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <p className="text-slate-400 uppercase text-[10px]">Assigned Boarding Stop</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">Palayamkottai Bus Stand (08:15 AM)</p>
          </div>
          <div>
            <p className="text-slate-400 uppercase text-[10px]">Driver Contact</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">Mr. V. Murugan (+91 98421 11223)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportPage;
