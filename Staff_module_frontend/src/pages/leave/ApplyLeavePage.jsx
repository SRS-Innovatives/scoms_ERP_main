import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Calendar, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import profileService from '../../services/profileService';

export const ApplyLeavePage = () => {
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    profileService.getLeaveTypes()
      .then((res) => {
        const types = res.data || [];
        setLeaveTypes(types);
        if (types.length > 0) setType(types[0].code);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await profileService.applyLeave({ type, startDate, endDate, reason });
      success('Leave application submitted to Principal & HOD for approval!', 'Leave Submitted');
      navigate('/staff/leave/balance');
    } catch (err) {
      showError(err.message || 'Failed to submit leave application', 'Submit Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-sky-500" /> Apply For Staff Leave
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Leave Category</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
            {leaveTypes.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">From Date</label>
            <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">To Date</label>
            <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason for Leave</label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Specify reason for leave..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          ></textarea>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50">
            <Save className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplyLeavePage;
