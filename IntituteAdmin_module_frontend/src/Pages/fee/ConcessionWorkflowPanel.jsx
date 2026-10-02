import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Award, Plus, Edit3, Trash2, Loader2, FilePlus } from 'lucide-react';
import feeService from '../../services/feeService';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const btn = 'px-3 py-1.5 text-xs font-bold rounded-lg disabled:opacity-50';
const emptyScheme = { code: '', name: '', type: 'SCHOLARSHIP', valueType: 'PERCENT', value: '', maxAmount: '', description: '', isActive: true };
const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  REVOKED: 'bg-slate-200 text-slate-600',
};

export const ConcessionSchemesPanel = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | scheme
  const [form, setForm] = useState(emptyScheme);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    feeService.getConcessionSchemes()
      .then((res) => setSchemes(res.data || []))
      .catch((err) => notifyError(`Failed to load schemes: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const open = (scheme) => {
    setForm(scheme ? {
      code: scheme.code, name: scheme.name, type: scheme.type, valueType: scheme.valueType,
      value: String(scheme.value), maxAmount: scheme.maxAmount ? String(scheme.maxAmount) : '',
      description: scheme.description || '', isActive: scheme.isActive,
    } : emptyScheme);
    setModal(scheme || 'new');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, value: Number(form.value), maxAmount: form.maxAmount === '' ? null : Number(form.maxAmount) };
      if (modal === 'new') await feeService.createConcessionScheme(payload);
      else await feeService.updateConcessionScheme(modal.id, payload);
      notifySuccess(modal === 'new' ? 'Scheme created' : 'Scheme updated');
      setModal(null);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (scheme) => {
    if (!window.confirm(`Delete scheme ${scheme.name}?`)) return;
    try {
      await feeService.deleteConcessionScheme(scheme.id);
      notifySuccess('Scheme deleted');
      load();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const columns = [
    { header: 'Code', key: 'code', render: (v) => <span className="font-mono font-bold text-indigo-600">{v}</span> },
    { header: 'Scheme', key: 'name', render: (v) => <span className="font-bold text-slate-900 dark:text-white">{v}</span> },
    { header: 'Type', key: 'type' },
    { header: 'Value', key: 'value', render: (v, row) => (row.valueType === 'PERCENT' ? `${v}%${row.maxAmount ? ` (max ${inr(row.maxAmount)})` : ''}` : inr(v)) },
    { header: 'Used', key: '_count', sortable: false, render: (v) => v?.applications ?? 0 },
    { header: 'Status', key: 'isActive', render: (v) => <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${v ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{v ? 'ACTIVE' : 'INACTIVE'}</span> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={() => open(row)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
          <button onClick={() => remove(row)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => open(null)} className={`${btn} flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white`}><Plus className="w-4 h-4" /> New Scheme</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
      ) : schemes.length === 0 ? (
        <EmptyState title="No Concession Schemes" description="Create reusable schemes like Merit 50%, Sports Quota or Staff Ward." icon={Award} />
      ) : (
        <DataTable columns={columns} data={schemes} />
      )}
      <FormModal
        isOpen={Boolean(modal)}
        title={modal === 'new' ? 'New Concession Scheme' : 'Edit Concession Scheme'}
        icon={Award}
        values={form}
        onChange={(name, value) => setForm((p) => ({ ...p, [name]: value }))}
        onSubmit={save}
        onClose={() => setModal(null)}
        isSubmitting={saving}
        submitLabel="Save Scheme"
        fields={[
          { name: 'code', label: 'Code', required: true },
          { name: 'name', label: 'Scheme Name', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: ['SCHOLARSHIP', 'CONCESSION', 'WAIVER'].map((v) => ({ value: v, label: v })) },
          { name: 'valueType', label: 'Value Type', type: 'select', required: true, options: [{ value: 'PERCENT', label: 'Percentage of fee' }, { value: 'FIXED', label: 'Fixed amount (₹)' }] },
          { name: 'value', label: form.valueType === 'PERCENT' ? 'Percentage (%)' : 'Amount (₹)', type: 'number', required: true },
          ...(form.valueType === 'PERCENT' ? [{ name: 'maxAmount', label: 'Maximum Amount (₹, optional)', type: 'number' }] : []),
          { name: 'description', label: 'Eligibility / Description', type: 'textarea', span: 'full' },
          { name: 'isActive', label: 'Active', type: 'checkbox' },
        ]}
      />
    </div>
  );
};

export const ConcessionRequestsPanel = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [status, setStatus] = useState('PENDING');
  const [rows, setRows] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ feeAssignmentId: '', schemeId: '', amount: '', referenceNo: '', reason: '' });
  const [remarksFor, setRemarksFor] = useState(null); // { id, kind: 'reject' | 'revoke' }
  const [remarks, setRemarks] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    feeService.getConcessions(status)
      .then((res) => setRows(res.data || []))
      .catch((err) => notifyError(`Failed to load requests: ${err.message}`))
      .finally(() => setLoading(false));
  }, [status, notifyError]);

  useEffect(() => { load(); }, [load]);

  const openRequest = async () => {
    setRequestForm({ feeAssignmentId: '', schemeId: '', amount: '', referenceNo: '', reason: '' });
    setRequestOpen(true);
    try {
      const [s, a] = await Promise.all([feeService.getConcessionSchemes(), feeService.getAssignments()]);
      setSchemes((s.data || []).filter((x) => x.isActive));
      setAssignments(a.data || []);
    } catch (err) {
      notifyError(err.message);
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setBusyId('request');
    try {
      await feeService.requestConcession({ ...requestForm, amount: requestForm.amount === '' ? undefined : Number(requestForm.amount) });
      notifySuccess('Concession request submitted for approval');
      setRequestOpen(false);
      setStatus('PENDING');
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const act = async (id, fn, msg) => {
    setBusyId(id);
    try {
      await fn();
      notifySuccess(msg);
      setRemarksFor(null);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const submitRemarks = (e) => {
    e.preventDefault();
    if (!remarks.trim()) { notifyError('Remarks are required'); return; }
    const { id, kind } = remarksFor;
    if (kind === 'reject') act(id, () => feeService.reviewConcession(id, 'REJECT', remarks), 'Concession rejected');
    else act(id, () => feeService.revokeConcession(id, remarks), 'Concession revoked — fee due restored');
  };

  const columns = [
    { header: 'Student', key: 'student', sortable: false, render: (v) => <span className="font-bold text-slate-900 dark:text-white">{v?.firstName} {v?.lastName} <span className="font-mono text-indigo-600">{v?.rollNumber || v?.admissionNumber}</span></span> },
    { header: 'Scheme', key: 'scheme', sortable: false, render: (v) => v?.name },
    { header: 'Fee', key: 'feeAssignment', sortable: false, render: (v) => <span>{v?.feeStructure?.name} · {inr(v?.totalAmount)}</span> },
    { header: 'Amount', key: 'amount', render: (v) => <span className="font-mono font-bold text-emerald-600">{inr(v)}</span> },
    { header: 'Reason', key: 'reason', render: (v, row) => <span title={row.reviewRemarks || ''}>{v}{row.referenceNo ? ` (Ref ${row.referenceNo})` : ''}</span> },
    { header: 'Status', key: 'status', render: (v) => <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${STATUS_STYLES[v]}`}>{v}</span> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, row) => (
        <div className="flex gap-1">
          {row.status === 'PENDING' && (
            <>
              <button disabled={busyId === row.id} onClick={() => act(row.id, () => feeService.reviewConcession(row.id, 'APPROVE'), 'Concession approved and applied')} className={`${btn} bg-emerald-600 hover:bg-emerald-700 text-white`}>Approve</button>
              <button disabled={busyId === row.id} onClick={() => { setRemarks(''); setRemarksFor({ id: row.id, kind: 'reject' }); }} className={`${btn} bg-rose-600 hover:bg-rose-700 text-white`}>Reject</button>
            </>
          )}
          {row.status === 'APPROVED' && (
            <button disabled={busyId === row.id} onClick={() => { setRemarks(''); setRemarksFor({ id: row.id, kind: 'revoke' }); }} className={`${btn} bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200`}>Revoke</button>
          )}
        </div>
      ),
    },
  ];

  const selectedAssignment = assignments.find((a) => a.id === requestForm.feeAssignmentId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'].map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`${btn} ${status === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>{s}</button>
          ))}
        </div>
        <button onClick={openRequest} className={`${btn} flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white`}><FilePlus className="w-4 h-4" /> Request Concession</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
      ) : rows.length === 0 ? (
        <EmptyState title={`No ${status.toLowerCase()} requests`} description="Concession requests move here as they are reviewed." icon={Award} />
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      <FormModal
        isOpen={requestOpen}
        title="Request Concession"
        subtitle={selectedAssignment ? `Total ${inr(selectedAssignment.totalAmount)} · already conceded ${inr(selectedAssignment.discountAmount)}` : 'Needs approval by the Principal / Institute Admin'}
        icon={FilePlus}
        values={requestForm}
        onChange={(name, value) => setRequestForm((p) => ({ ...p, [name]: value }))}
        onSubmit={submitRequest}
        onClose={() => setRequestOpen(false)}
        isSubmitting={busyId === 'request'}
        submitLabel="Submit for Approval"
        fields={[
          {
            name: 'feeAssignmentId', label: 'Student Fee', type: 'select', required: true, span: 'full', placeholder: 'Select a student fee assignment',
            options: assignments.map((a) => ({ value: a.id, label: `${a.student?.rollNumber || ''} ${a.student?.firstName || ''} ${a.student?.lastName || ''} — ${a.feeStructure?.name || ''}` })),
          },
          { name: 'schemeId', label: 'Scheme', type: 'select', required: true, placeholder: 'Select a scheme', options: schemes.map((x) => ({ value: x.id, label: `${x.name} (${x.valueType === 'PERCENT' ? `${x.value}%` : inr(x.value)})` })) },
          { name: 'amount', label: 'Amount (₹, blank = scheme amount)', type: 'number' },
          { name: 'referenceNo', label: 'Sanction / Reference No' },
          { name: 'reason', label: 'Reason / Eligibility', type: 'textarea', required: true, span: 'full' },
        ]}
      />

      <FormModal
        isOpen={Boolean(remarksFor)}
        title={remarksFor?.kind === 'revoke' ? 'Revoke Concession' : 'Reject Concession'}
        values={{ remarks }}
        onChange={(_, v) => setRemarks(v)}
        onSubmit={submitRemarks}
        onClose={() => setRemarksFor(null)}
        isSubmitting={Boolean(busyId)}
        submitLabel={remarksFor?.kind === 'revoke' ? 'Revoke' : 'Reject'}
        fields={[{ name: 'remarks', label: 'Remarks', type: 'textarea', required: true, span: 'full' }]}
      />
    </div>
  );
};
