import React, { useState } from 'react';
import FileUpload from '../../components/common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { Calendar, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ApplyLeavePage = () => {
  const { success } = useNotification();
  const navigate = useNavigate();

  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [substituteTeacher, setSubstituteTeacher] = useState('Prof. V. K. Menon');

  const handleSubmit = (e) => {
    e.preventDefault();
    success('Leave application submitted to Principal & HOD for approval!', 'Leave Submitted');
    navigate('/staff/leave/balance');
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-sky-500" /> Apply For Staff Leave
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Leave Category</label>
          <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
            <option value="Casual Leave">Casual Leave (CL)</option>
            <option value="Earned Leave">Earned Leave (EL)</option>
            <option value="Medical Leave">Medical Leave (ML)</option>
            <option value="Duty Leave">Duty Leave (DL)</option>
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
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nominated Substitute Teacher for Classes</label>
          <select value={substituteTeacher} onChange={(e) => setSubstituteTeacher(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <option value="Prof. V. K. Menon">Prof. V. K. Menon (Physics)</option>
            <option value="Dr. S. K. Roy">Dr. S. K. Roy (Mathematics)</option>
            <option value="Mrs. Anita Rao">Mrs. Anita Rao (Chemistry)</option>
          </select>
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

        <FileUpload label="Attach Medical Certificate / Supporting Document (Optional)" />

        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
            <Save className="w-4 h-4" /> Submit Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplyLeavePage;
