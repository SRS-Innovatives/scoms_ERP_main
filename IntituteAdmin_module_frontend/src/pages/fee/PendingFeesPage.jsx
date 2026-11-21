import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { CreditCard, BellRing } from 'lucide-react';
import feeService from '../../services/feeService';
import feePolicyService from '../../services/feePolicyService';
import { useAcademic } from '../../context/InstitutionContext';

export const PendingFeesPage = () => {
  const academic = useAcademic();
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [withSms, setWithSms] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    feeService.getPendingFees()
      .then((res) => setPending(res.data || []))
      .catch((err) => { notifyError(`Failed to load pending fees: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const filtered = pending.filter((p) => {
    const name = `${p.student?.firstName} ${p.student?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || p.student?.rollNumber?.toLowerCase().includes(search.toLowerCase());
  });

  const toggle = (id) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allShown = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleAll = () => setSelected(allShown ? new Set() : new Set(filtered.map((p) => p.id)));
  // "Send reminder now" — in-app/phone notification to the student and parents (Fee Policy), once a day per fee
  const sendReminders = async () => {
    setSending(true);
    try {
      const res = await feePolicyService.sendReminders([...selected], withSms);
      notifySuccess(res.message);
      setSelected(new Set());
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSending(false);
    }
  };

  const columns = [
    { header: <input type="checkbox" checked={allShown} onChange={toggleAll} className="w-4 h-4 rounded" aria-label="Select all" />, key: 'select', sortable: false, render: (_, row) => <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} className="w-4 h-4 rounded" aria-label="Select" /> },
    { header: 'Roll No', key: 'student', sortable: false, render: (val) => <span className="font-mono font-bold text-rose-600">{val?.rollNumber}</span> },
    { header: 'Student Name', key: 'student2', sortable: false, render: (_, row) => <span className="font-bold text-slate-900 dark:text-white">{row.student?.firstName} {row.student?.lastName}</span> },
    { header: academic.label('course'), key: 'student3', sortable: false, render: (_, row) => row.student?.course?.name },
    { header: 'Fee Structure', key: 'feeStructure', sortable: false, render: (val) => val?.name },
    { header: 'Due Date', key: 'feeStructure2', sortable: false, render: (_, row) => <span className="font-mono">{new Date(row.feeStructure?.dueDate).toLocaleDateString('en-IN')}</span> },
    { header: 'Pending Amount (₹)', key: 'dueAmount', render: (val) => <span className="font-mono font-bold text-rose-600">₹{val.toLocaleString()}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: () => (
        <button onClick={() => navigate('/admin/fee/collect')} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
          Collect Fee
        </button>
      ),
    },
  ];

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Pending Outstanding Fees Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Directory of students with overdue or partially paid fee assignments</p>
        </div>
        <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300" title="Text the parent / student too — uses SMS credits">
          <input type="checkbox" checked={withSms} onChange={(e) => setWithSms(e.target.checked)} className="w-4 h-4 rounded" /> Also send SMS
        </label>
        <button onClick={sendReminders} disabled={sending || selected.size === 0} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">
          <BellRing className="w-3.5 h-3.5" /> {sending ? 'Sending…' : `Send reminder${selected.size ? ` (${selected.size})` : ''}`}
        </button>
        </div>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search defaulter name or roll no..." />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Pending Dues" description="Every student's fee assignment is fully paid." icon={CreditCard} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}
    </div>
  );
};

export default PendingFeesPage;
