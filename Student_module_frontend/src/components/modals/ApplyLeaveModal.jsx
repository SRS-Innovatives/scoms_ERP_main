import React, { useState } from 'react';
import Modal from './Modal';
import FormInput from '../common/FormInput';
import Select from '../common/Select';
import FileUpload from '../common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { Calendar } from 'lucide-react';

export const ApplyLeaveModal = ({ isOpen, onClose }) => {
  const { success } = useNotification();
  const [leaveType, setLeaveType] = useState('Medical Leave');
  const [fromDate, setFromDate] = useState('2026-08-20');
  const [toDate, setToDate] = useState('2026-08-21');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    success('Leave request submitted to Class Teacher Dr. Malathi S. for approval.', 'Leave Submitted');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Student Absence / Leave Request">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <Select
          label="Leave Type"
          value={leaveType}
          onChange={setLeaveType}
          options={[
            { value: 'Medical Leave', label: 'Medical Leave' },
            { value: 'Casual Leave', label: 'Casual / Personal Leave' },
            { value: 'On Duty (OD)', label: 'On Duty (OD) - Sports / Symposium' }
          ]}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput label="From Date" type="date" required value={fromDate} onChange={setFromDate} />
          <FormInput label="To Date" type="date" required value={toDate} onChange={setToDate} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reason for Absence</label>
          <textarea
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Specify illness or OD event details..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
          ></textarea>
        </div>

        <FileUpload label="Upload Doctor Certificate / OD Approval PDF" />

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">
            Cancel
          </button>
          <button type="submit" className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs">
            Submit Leave Request
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ApplyLeaveModal;
