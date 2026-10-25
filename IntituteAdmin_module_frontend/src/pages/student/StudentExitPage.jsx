import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { LogOut, X, CheckCircle2, XCircle, ArrowRightCircle } from 'lucide-react';
import studentService from '../../services/studentService';
import studentExitService from '../../services/studentExitService';

const EXIT_TYPES = [{ value: 'WITHDRAWAL', label: 'Withdrawal' }, { value: 'TRANSFER', label: 'Transfer to Another Institution' }];
const emptyForm = { studentId: '', exitType: 'WITHDRAWAL', reason: '', transferToInstitution: '' };

const ClearanceModal = ({ record: initialRecord, onClose, onRefresh }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [record, setRecord] = useState(initialRecord);
  const [computed, setComputed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearanceError, setClearanceError] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchClearance = useCallback(() => {
    setLoading(true);
    setClearanceError(false);
    studentExitService.getClearanceStatus(record.id)
      .then((res) => setComputed(res.data))
      .catch((err) => { notifyError(err.message); setClearanceError(true); })
      .finally(() => setLoading(false));
  }, [record.id, notifyError]);

  useEffect(() => { fetchClearance(); }, [fetchClearance]);

  const toggleClearance = async (field, value) => {
    setBusy(true);
    try {
      const res = await studentExitService.updateClearance(record.id, { [field]: value });
      setRecord(res.data);
      notifySuccess('Clearance updated');
      onRefresh();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      await studentExitService.approveExit(record.id);
      notifySuccess('Exit approved — ready to complete');
      onRefresh();
      onClose();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    setBusy(true);
    try {
      const res = await studentExitService.completeExit(record.id);
      notifySuccess(res.message || 'Exit completed');
      onRefresh();
      onClose();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this exit request?')) return;
    setBusy(true);
    try {
      await studentExitService.cancelExit(record.id);
      notifySuccess('Exit request cancelled');
      onRefresh();
      onClose();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{record.student?.firstName} {record.student?.lastName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{record.exitType} — {record.reason}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>

        {clearanceError ? (
          <ErrorState onRetry={fetchClearance} />
        ) : loading || !computed ? (
          <p className="text-xs text-slate-400 py-8 text-center">Loading real clearance status...</p>
        ) : (
          <div className="space-y-3 text-xs">
            {[
              { field: 'libraryCleared', label: 'Library', info: computed.library.cleared ? 'No books outstanding' : `${computed.library.outstandingBooks} book(s) not returned`, ok: computed.library.cleared },
              { field: 'feesCleared', label: 'Fees', info: computed.fees.cleared ? 'No dues' : `₹${computed.fees.totalDue.toLocaleString('en-IN')} due (${computed.fees.outstandingAssignments} assignment(s))`, ok: computed.fees.cleared },
              { field: 'hostelCleared', label: 'Hostel', info: computed.hostel.cleared ? 'No bed allocated' : 'Bed currently allocated', ok: computed.hostel.cleared },
            ].map((item) => (
              <div key={item.field} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                  <p className={`text-[11px] ${item.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{item.info}</p>
                </div>
                <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={!!record[item.field]}
                    disabled={busy || ['COMPLETED', 'CANCELLED'].includes(record.status)}
                    onChange={(e) => toggleClearance(item.field, e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  Cleared
                </label>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          {!['COMPLETED', 'CANCELLED'].includes(record.status) && (
            <button onClick={handleCancel} disabled={busy} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" />Cancel Request</button>
          )}
          {['REQUESTED', 'CLEARANCE_PENDING'].includes(record.status) && (
            <button onClick={handleApprove} disabled={busy} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"><CheckCircle2 className="w-3.5 h-3.5" />Approve</button>
          )}
          {record.status === 'APPROVED' && (
            <button onClick={handleComplete} disabled={busy} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"><ArrowRightCircle className="w-3.5 h-3.5" />Complete Exit</button>
          )}
        </div>
      </div>
    </div>
  );
};

export const StudentExitPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [activeRecord, setActiveRecord] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    studentExitService.getExitRecords()
      .then((res) => setRecords(res.data || []))
      .catch((err) => { notifyError(`Failed to load exit records: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => {
    fetchAll();
    studentService.getAll({ limit: 200 }).then((res) => setStudents(res.data || [])).catch(() => {});
  }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await studentExitService.requestExit(form);
      notifySuccess('Exit request created successfully!');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to create exit request: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Student', key: 'student', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.firstName} {val?.lastName}</span> },
    { header: 'Adm. No.', key: 'student', sortable: false, render: (val) => <span className="font-mono">{val?.admissionNumber}</span> },
    { header: 'Type', key: 'exitType' },
    { header: 'Reason', key: 'reason', render: (val) => <span className="truncate max-w-xs block">{val}</span> },
    { header: 'Requested', key: 'requestedDate', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString()}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, row) => <button onClick={() => setActiveRecord(row)} className="text-indigo-600 font-semibold hover:underline">Manage</button>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Withdrawal / Transfer</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real exit workflow with clearance computed against library, fee and hostel records</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md">
          <LogOut className="w-4 h-4" /><span>New Exit Request</span>
        </button>
      </div>

      {error ? (
        <ErrorState onRetry={fetchAll} />
      ) : !loading && records.length === 0 ? (
        <EmptyState title="No Exit Requests" description="Create the first withdrawal or transfer request." actionLabel="New Exit Request" onAction={() => setModalOpen(true)} icon={LogOut} />
      ) : (
        <DataTable columns={columns} data={records} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="New Exit Request"
        icon={LogOut}
        submitLabel="Create Request"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'studentId', label: 'Student', type: 'select', required: true, span: 'full', options: students.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` })) },
          { name: 'exitType', label: 'Type', type: 'select', required: true, options: EXIT_TYPES },
          ...(form.exitType === 'TRANSFER' ? [{ name: 'transferToInstitution', label: 'Transferring To' }] : []),
          { name: 'reason', label: 'Reason', type: 'textarea', required: true, span: 'full' },
        ]}
      />

      {activeRecord && <ClearanceModal record={activeRecord} onClose={() => setActiveRecord(null)} onRefresh={fetchAll} />}
    </div>
  );
};

export default StudentExitPage;
