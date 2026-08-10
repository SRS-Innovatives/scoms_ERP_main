import React from 'react';
import { mockLeaveBalance } from '../../data/mockStaffData';
import StatusBadge from '../../components/common/StatusBadge';
import { Clock, Calendar, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LeaveBalancePage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Staff Leave Balance & Quota</h2>
          <p className="text-xs text-slate-500">Casual Leave (CL), Earned Leave (EL), Medical Leave (ML) quotas.</p>
        </div>
        <button
          onClick={() => navigate('/staff/leave/apply')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl"
        >
          <Calendar className="w-4 h-4" /> Apply For Leave
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-slate-500 font-bold uppercase">Casual Leave (CL)</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{mockLeaveBalance.casualLeave.remaining} Days Remaining</h3>
          <p className="text-[11px] text-slate-400 mt-1">Used: {mockLeaveBalance.casualLeave.used} / {mockLeaveBalance.casualLeave.total}</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-slate-500 font-bold uppercase">Earned Leave (EL)</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{mockLeaveBalance.earnedLeave.remaining} Days Remaining</h3>
          <p className="text-[11px] text-slate-400 mt-1">Used: {mockLeaveBalance.earnedLeave.used} / {mockLeaveBalance.earnedLeave.total}</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-slate-500 font-bold uppercase">Medical Leave (ML)</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{mockLeaveBalance.medicalLeave.remaining} Days Remaining</h3>
          <p className="text-[11px] text-slate-400 mt-1">Used: {mockLeaveBalance.medicalLeave.used} / {mockLeaveBalance.medicalLeave.total}</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-slate-500 font-bold uppercase">Duty Leave (DL)</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{mockLeaveBalance.dutyLeave.remaining} Days Remaining</h3>
          <p className="text-[11px] text-slate-400 mt-1">Used: {mockLeaveBalance.dutyLeave.used} / {mockLeaveBalance.dutyLeave.total}</p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
          Past Leave Applications & Approval Log
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Type</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3">Days</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Approved By</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {mockLeaveBalance.history.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold">{l.type}</td>
                  <td className="p-3">{l.startDate}</td>
                  <td className="p-3">{l.endDate}</td>
                  <td className="p-3 font-semibold">{l.days} Days</td>
                  <td className="p-3 text-slate-500">{l.reason}</td>
                  <td className="p-3 font-semibold">{l.approvedBy}</td>
                  <td className="p-3 text-right"><StatusBadge status={l.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalancePage;
