import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Home, Utensils } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const HostelPage = () => {
  const { success } = useNotification();

  return (
    <div className="space-y-6">
      <PageHeader title="Hostel Management & Mess Services" subtitle="Block room allotment, warden contacts, mess menu, and outing gate pass." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Kaveri Boys Hostel Block-B</h3>
              <p className="text-xs text-slate-500">Room No. 304 (3-Sharing Non-AC)</p>
            </div>
            <StatusBadge status="Allotted" />
          </div>

          <div className="text-xs space-y-1">
            <p><span className="text-slate-400">Warden:</span> <span className="font-bold">Prof. K. Sundaram (+91 94421 99001)</span></p>
          </div>

          <button
            onClick={() => success('Outing gate pass requested for approval.', 'Pass Requested')}
            className="w-full py-2 font-bold text-white bg-indigo-600 rounded-xl text-xs"
          >
            Apply Weekend Outing Pass
          </button>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-indigo-500" /> Today Mess Menu
          </h3>
          <p><span className="font-bold">Breakfast:</span> Idli, Sambar, Vadai, Chutney, Tea/Coffee</p>
          <p><span className="font-bold">Lunch:</span> South Indian Meals, Rice, Sambar, Poriyal, Curd</p>
          <p><span className="font-bold">Dinner:</span> Chapati, Paneer Butter Masala, Rice, Milk</p>
        </div>
      </div>
    </div>
  );
};

export default HostelPage;
