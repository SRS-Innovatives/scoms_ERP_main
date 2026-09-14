import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import FormInput from '../common/FormInput';
import Select from '../common/Select';
import FileUpload from '../common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import leaveService from '../../services/leaveService';

export const ApplyLeaveModal = ({ isOpen, onClose, onSubmitted }) => {
  const { success, error: showError } = useNotification();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    leaveService.getLeaveTypes()
      .then((res) => {
        const types = res.data || [];
        setLeaveTypes(types);
        if (types.length > 0) setLeaveType(types[0].code);
      })
      .catch(() => {});
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await leaveService.apply({ type: leaveType, startDate: fromDate, endDate: toDate, reason });
      success('Leave request submitted to your Class Teacher for approval.', 'Leave Submitted');
      setFromDate('');
      setToDate('');
      setReason('');
      onSubmitted && onSubmitted();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to submit leave request', 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Student Absence / Leave Request">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <Select
          label="Leave Type"
          value={leaveType}
          onChange={setLeaveType}
          options={leaveTypes.map((t) => ({ value: t.code, label: t.label }))}
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

        <FileUpload label="Doctor Certificate / OD Approval (not yet stored — describe it in the reason above)" />

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ApplyLeaveModal;
