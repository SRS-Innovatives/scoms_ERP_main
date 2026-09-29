import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { Loader2, CheckCircle2, XCircle, X, ListChecks } from 'lucide-react';
import admissionFieldService from '../../services/admissionFieldService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

const FIELD_TYPE_LABEL = { TEXT: 'Text', NUMBER: 'Number', DATE: 'Date', EMAIL: 'Email', PHONE: 'Phone', TEXTAREA: 'Paragraph', SELECT: 'Dropdown', CHECKBOX: 'Checkbox' };

const RejectModal = ({ field, onClose, onConfirm, submitting }) => {
  const [reason, setReason] = useState('');
  if (!field) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Reject "{field.label}"</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Reason (shown to the institution)</label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. This overlaps with an existing standard field — please clarify what data it should capture."
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium"
        />
        <div className="flex items-center justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={submitting || !reason.trim()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50"
          >
            {submitting ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdmissionFieldApprovalsPage = () => {
  const { success, error: showError } = useNotification();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    admissionFieldService.getPending()
      .then((res) => setFields(res.data || []))
      .catch((err) => { showError(err.message, 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApprove = async (field) => {
    setBusyId(field.id);
    try {
      const res = await admissionFieldService.approve(field.id);
      success(res.data?.message || 'Field approved', 'Approved');
      fetchAll();
    } catch (err) {
      showError(err.message, 'Approve Failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (reason) => {
    setBusyId(rejecting.id);
    try {
      await admissionFieldService.reject(rejecting.id, reason);
      success(`"${rejecting.label}" rejected`, 'Rejected');
      setRejecting(null);
      fetchAll();
    } catch (err) {
      showError(err.message, 'Reject Failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkApprove = async (selectedIds) => {
    try {
      const res = await admissionFieldService.bulkReview(selectedIds, 'APPROVED');
      success(`${res.data?.updated ?? selectedIds.length} field(s) approved`, 'Approved');
      fetchAll();
    } catch (err) {
      showError(err.message, 'Bulk Approve Failed');
    }
  };

  const columns = [
    {
      header: 'Institution', key: 'institution', sortable: false,
      render: (v) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{v?.name}</p>
          <p className="text-[10px] font-mono text-slate-400">{v?.code}</p>
        </div>
      ),
    },
    {
      header: 'Form', key: 'entityType', sortable: false,
      render: (v) => {
        const styles = {
          STAFF_PROFILE: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400',
          TRANSPORT_ENROLLMENT: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
          HOSTEL_ALLOCATION: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400',
          FEE_ASSIGNMENT: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
          LIBRARY_MEMBERSHIP: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400',
        };
        const labels = { STAFF_PROFILE: 'Staff Registration', TRANSPORT_ENROLLMENT: 'Transport Enrollment', HOSTEL_ALLOCATION: 'Hostel Allocation', FEE_ASSIGNMENT: 'Fee Assignment', LIBRARY_MEMBERSHIP: 'Library Membership' };
        return (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${styles[v] || 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'}`}>
            {labels[v] || 'Admission Form'}
          </span>
        );
      },
    },
    {
      header: 'Field', key: 'label',
      render: (v, row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{v}</p>
          <p className="text-[10px] text-slate-400">{row.section} · {FIELD_TYPE_LABEL[row.fieldType] || row.fieldType}{row.required ? ' · Required' : ''}</p>
          {row.fieldType === 'SELECT' && row.options?.length > 0 && (
            <p className="text-[10px] text-slate-400 mt-0.5">Options: {row.options.join(', ')}</p>
          )}
        </div>
      ),
    },
    { header: 'Submitted', key: 'submittedAt', render: (v) => v ? new Date(v).toLocaleString() : '—' },
    {
      header: 'Decision', key: 'actions', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleApprove(row)}
            disabled={busyId === row.id}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
          </button>
          <button
            onClick={() => setRejecting(row)}
            disabled={busyId === row.id}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 rounded-lg font-semibold text-[11px] disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admission Field Approvals"
        subtitle="Extra admission-form fields institutions have submitted — nothing here renders on a real form until you decide"
      />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={fetchAll} />
      ) : fields.length === 0 ? (
        <EmptyState icon={ListChecks} title="Nothing Pending" message="No institution currently has a custom admission field awaiting your review." />
      ) : (
        <DataTable columns={columns} data={fields} onBulkAction={handleBulkApprove} bulkActionLabel="Approve Selected" />
      )}

      <RejectModal field={rejecting} onClose={() => setRejecting(null)} onConfirm={handleReject} submitting={busyId === rejecting?.id} />
    </div>
  );
};

export default AdmissionFieldApprovalsPage;
