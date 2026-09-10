import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import visitorService from '../../services/visitorService';
import { UserCheck, LogOut } from 'lucide-react';

const emptyForm = { visitorName: '', phone: '', purpose: '', whomToMeet: '', idProofType: '', idProofNumber: '' };

export const VisitorManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await visitorService.getAll(showActiveOnly ? { active: 'true' } : {});
      setLogs(res.data || []);
    } catch (error) {
      notifyError(`Failed to load visitor logs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError, showActiveOnly]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await visitorService.checkIn(form);
      notifySuccess(`${form.visitorName} checked in successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to check in visitor: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (row) => {
    try {
      await visitorService.checkOut(row.id);
      notifySuccess(`${row.visitorName} checked out`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to check out: ${error.message}`);
    }
  };

  const columns = [
    { header: 'Visitor', key: 'visitorName', render: (val, row) => (
      <div>
        <p className="font-bold text-slate-900 dark:text-white">{val}</p>
        {row.phone && <p className="text-[10px] text-slate-400">{row.phone}</p>}
      </div>
    ) },
    { header: 'Purpose', key: 'purpose' },
    { header: 'Whom to Meet', key: 'whomToMeet', render: (val) => val || '—' },
    { header: 'Check-In', key: 'checkInTime', render: (val) => new Date(val).toLocaleString() },
    {
      header: 'Status', key: 'checkOutTime', sortable: false,
      render: (val, row) => val
        ? <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Checked out {new Date(val).toLocaleTimeString()}</span>
        : (
          <button onClick={() => handleCheckOut(row)} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 hover:opacity-80">
            <LogOut className="w-3 h-3" /> On Campus — Check Out
          </button>
        ),
    },
  ];

  const filtered = logs.filter((l) => l.visitorName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Visitor / Gate Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Log front-gate visitor check-in and check-out</p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SearchFilterBar
          searchQuery={search}
          onSearchChange={setSearch}
          placeholder="Search by visitor name..."
          addLabel="Check In Visitor"
          onAddClick={() => setModalOpen(true)}
          onRefreshClick={fetchAll}
        />
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" checked={showActiveOnly} onChange={(e) => setShowActiveOnly(e.target.checked)} />
          On campus only
        </label>
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Visitor Logs" description="Check in a visitor at the front gate to start the log." actionLabel="Check In Visitor" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Check In Visitor"
        icon={UserCheck}
        submitLabel="Check In"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'visitorName', label: 'Visitor Name', required: true },
          { name: 'phone', label: 'Phone' },
          { name: 'purpose', label: 'Purpose of Visit', required: true, span: 'full' },
          { name: 'whomToMeet', label: 'Whom to Meet' },
          { name: 'idProofType', label: 'ID Proof Type' },
          { name: 'idProofNumber', label: 'ID Proof Number' },
        ]}
      />
    </div>
  );
};

export default VisitorManagementPage;
