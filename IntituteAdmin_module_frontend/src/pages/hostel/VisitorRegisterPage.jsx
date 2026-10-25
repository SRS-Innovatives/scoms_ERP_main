import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { UserCheck, LogOut } from 'lucide-react';
import hostelService from '../../services/hostelService';
import studentService from '../../services/studentService';

const emptyForm = { studentId: '', visitorName: '', relationship: '' };

export const VisitorRegisterPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([hostelService.getVisitors(), studentService.getAll()])
      .then(([visitorRes, studentRes]) => {
        setVisitors(visitorRes.data || []);
        setStudents(studentRes.data || []);
      })
      .catch((err) => { notifyError(`Failed to load visitor register: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await hostelService.checkInVisitor(form);
      notifySuccess(`Visitor checked in — Gate Pass ${res.data.gatePassNo} issued.`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to check in visitor: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (id) => {
    setBusyId(id);
    try {
      await hostelService.checkOutVisitor(id);
      notifySuccess('Visitor checked out.');
      fetchAll();
    } catch (error) {
      notifyError(`Failed to check out visitor: ${error.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    { header: 'Gate Pass No', key: 'gatePassNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Visitor Name', key: 'visitorName', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Relationship', key: 'relationship', render: (val) => val || '—' },
    { header: 'Visiting Student', key: 'student', sortable: false, render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val?.firstName} {val?.lastName} ({val?.rollNumber})</span> },
    { header: 'In Time', key: 'checkInAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> },
    { header: 'Out Time', key: 'checkOutAt', render: (val) => val ? <span className="font-mono">{new Date(val).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> : '—' },
    { header: 'Gate Status', key: 'checkOutAt2', sortable: false, render: (_, row) => <StatusBadge status={row.checkOutAt ? 'Completed' : 'Active'} text={row.checkOutAt ? 'CHECKED OUT' : 'ON PREMISES'} /> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (id, row) => !row.checkOutAt && (
        <button onClick={() => handleCheckOut(id)} disabled={busyId === id} className="flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg text-xs font-semibold disabled:opacity-50">
          <LogOut className="w-3.5 h-3.5" /> Check Out
        </button>
      ),
    },
  ];

  if (error) {
    return <ErrorState onRetry={fetchAll} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Visitor & Parent Gate Pass Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Security gate entry log for visiting parents & local guardians</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
          <UserCheck className="w-4 h-4" /> Check In Visitor
        </button>
      </div>

      {!loading && visitors.length === 0 ? (
        <EmptyState title="No Visitor Entries Yet" description="Check in the first visitor to start the gate register." actionLabel="Check In Visitor" onAction={() => setModalOpen(true)} icon={UserCheck} />
      ) : (
        <DataTable columns={columns} data={visitors} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Check In Visitor"
        icon={UserCheck}
        submitLabel="Check In"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCheckIn}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'studentId', label: 'Visiting Student (must be a hosteler)', type: 'select', required: true, span: 'full', options: students.map((s) => ({ value: s.id, label: `${s.rollNumber} — ${s.firstName} ${s.lastName}` })) },
          { name: 'visitorName', label: 'Visitor Name', required: true },
          { name: 'relationship', label: 'Relationship (e.g. Father, Guardian)' },
        ]}
      />
    </div>
  );
};

export default VisitorRegisterPage;
