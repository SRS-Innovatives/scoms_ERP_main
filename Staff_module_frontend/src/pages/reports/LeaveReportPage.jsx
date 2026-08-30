import React, { useEffect, useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { Loader2, Inbox } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import studentLeaveService from '../../services/studentLeaveService';

const TYPE_LABELS = { MEDICAL: 'Medical', CASUAL: 'Casual', DUTY: 'On Duty', EARNED: 'Earned' };

export const LeaveReportPage = () => {
  const { error: showError } = useNotification();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentLeaveService.getStudentLeaves()
      .then((res) => setLeaves(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load leave report', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Student Leave Report</h2>
      <p className="text-xs text-slate-500 -mt-4">Leave requests from students in your assigned sections.</p>

      {leaves.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <Inbox className="w-8 h-8 text-slate-300" /> No student leave requests yet.
        </div>
      ) : (
        <div className="overflow-x-auto glass-card rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Section</th>
                <th className="p-3">Type</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {leaves.map((lv) => (
                <tr key={lv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-semibold">{lv.student?.firstName} {lv.student?.lastName}</td>
                  <td className="p-3">{lv.student?.section?.name}</td>
                  <td className="p-3">{TYPE_LABELS[lv.type] || lv.type}</td>
                  <td className="p-3">{new Date(lv.startDate).toLocaleDateString()} – {new Date(lv.endDate).toLocaleDateString()}</td>
                  <td className="p-3"><StatusBadge status={lv.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveReportPage;
