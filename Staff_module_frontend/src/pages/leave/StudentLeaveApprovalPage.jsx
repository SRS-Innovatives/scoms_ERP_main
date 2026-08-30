import React, { useEffect, useState, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle, XCircle, Loader2, Inbox } from 'lucide-react';
import studentLeaveService from '../../services/studentLeaveService';

const TYPE_LABELS = { MEDICAL: 'Medical Leave', CASUAL: 'Casual / Personal Leave', DUTY: 'On Duty (OD)', EARNED: 'Earned Leave' };

const daysBetween = (start, end) => Math.round((new Date(end) - new Date(start)) / 86400000) + 1;

export const StudentLeaveApprovalPage = () => {
  const { success, error: showError } = useNotification();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    studentLeaveService.getStudentLeaves()
      .then((res) => setLeaves(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load leave requests', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleDecision = async (leave, status) => {
    setActing(leave.id);
    try {
      await studentLeaveService.updateStatus(leave.id, status);
      success(`Leave request ${status.toLowerCase()}.`, 'Leave Updated');
      load();
    } catch (err) {
      showError(err.message || 'Failed to update leave request', 'Update Failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Student Leave Approvals</h3>
        <p className="text-xs text-slate-500">Requests from students in the sections you teach.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-500 flex flex-col items-center gap-2">
          <Inbox className="w-8 h-8 text-slate-300" /> No student leave requests to review.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Section</th>
                <th className="p-3">Type</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {leaves.map((lv) => (
                <tr key={lv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-semibold">{lv.student?.firstName} {lv.student?.lastName} <span className="text-slate-400 font-normal">#{lv.student?.rollNumber}</span></td>
                  <td className="p-3 text-slate-500">{lv.student?.section?.name || '—'}</td>
                  <td className="p-3">{TYPE_LABELS[lv.type] || lv.type}</td>
                  <td className="p-3 text-slate-500">{new Date(lv.startDate).toLocaleDateString()} – {new Date(lv.endDate).toLocaleDateString()} ({daysBetween(lv.startDate, lv.endDate)}d)</td>
                  <td className="p-3 max-w-[220px] truncate">{lv.reason}</td>
                  <td className="p-3"><StatusBadge status={lv.status} size="sm" /></td>
                  <td className="p-3 text-right">
                    {lv.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDecision(lv, 'APPROVED')}
                          disabled={acting === lv.id}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg disabled:opacity-50"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDecision(lv, 'REJECTED')}
                          disabled={acting === lv.id}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentLeaveApprovalPage;
