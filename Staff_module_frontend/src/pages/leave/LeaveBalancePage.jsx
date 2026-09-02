import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import profileService from '../../services/profileService';

const TYPE_LABELS = { CASUAL: 'Casual Leave (CL)', EARNED: 'Earned Leave (EL)', MEDICAL: 'Medical Leave (ML)', DUTY: 'Duty Leave (DL)' };

export const LeaveBalancePage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [leaves, setLeaves] = useState([]);
  const [usedByType, setUsedByType] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileService.getMyLeaves()
      .then((res) => {
        setLeaves(res.data.leaves || []);
        setUsedByType(res.data.usedByType || {});
      })
      .catch((err) => showError(err.message || 'Failed to load leave records', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Staff Leave Applications & History</h2>
          <p className="text-xs text-slate-500">Days used this year, by leave category (approved applications only)</p>
        </div>
        <button
          onClick={() => navigate('/staff/leave/apply')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl"
        >
          <Calendar className="w-4 h-4" /> Apply For Leave
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <div key={key} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 font-bold uppercase">{label}</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{usedByType[key] || 0} Days Used</h3>
            <p className="text-[11px] text-slate-400 mt-1">This calendar year, approved only</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
          Past Leave Applications & Approval Log
        </h3>
        {leaves.length === 0 ? (
          <p className="text-xs text-slate-400">No leave applications submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Approved By</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold">{TYPE_LABELS[l.type] || l.type}</td>
                    <td className="p-3">{new Date(l.startDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3">{new Date(l.endDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 text-slate-500">{l.reason}</td>
                    <td className="p-3 font-semibold">{l.approvedBy || '—'}</td>
                    <td className="p-3 text-right"><StatusBadge status={l.status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveBalancePage;
