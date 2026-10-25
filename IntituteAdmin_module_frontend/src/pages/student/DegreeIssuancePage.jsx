import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import degreeService from '../../services/degreeService';
import studentService from '../../services/studentService';
import { Award, CheckCircle, Ban, Trash2 } from 'lucide-react';

const emptyForm = { studentId: '', degreeName: '', convocationDate: '' };
const emptyIssueForm = { degreeNumber: '', issuedDate: new Date().toISOString().slice(0, 10) };

export const DegreeIssuancePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [degrees, setDegrees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [issueTarget, setIssueTarget] = useState(null);
  const [issueForm, setIssueForm] = useState(emptyIssueForm);
  const [issuing, setIssuing] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [degreeRes, studentRes] = await Promise.all([degreeService.getAll(), studentService.getAll({ limit: 500 })]);
      setDegrees(degreeRes.data || []);
      setStudents(studentRes.data || []);
    } catch (error) {
      notifyError(`Failed to load degree records: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAddModal = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await degreeService.create(form);
      notifySuccess('Degree record created — issue it once the convocation is confirmed.');
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to create degree record: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openIssueModal = (row) => {
    setIssueTarget(row);
    setIssueForm({ degreeNumber: '', issuedDate: new Date().toISOString().slice(0, 10) });
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!issueTarget) return;
    setIssuing(true);
    try {
      await degreeService.issue(issueTarget.id, issueForm);
      notifySuccess(`${issueTarget.degreeName} issued to ${issueTarget.student?.firstName} ${issueTarget.student?.lastName}.`);
      setIssueTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to issue degree: ${error.message}`);
    } finally {
      setIssuing(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await degreeService.revoke(revokeTarget.id);
      notifySuccess('Degree revoked.');
      setRevokeTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to revoke: ${error.message}`);
      setRevokeTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await degreeService.remove(deleteTarget.id);
      notifySuccess('Degree record deleted.');
      setDeleteTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      header: 'Student', key: 'student', sortable: false,
      render: (val) => val ? (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{val.firstName} {val.lastName}</p>
          <p className="text-[10px] text-slate-400 font-mono">{val.admissionNumber}</p>
        </div>
      ) : '—',
    },
    { header: 'Degree', key: 'degreeName', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'Registry No.', key: 'degreeNumber', render: (val) => val ? <span className="font-mono text-indigo-600">{val}</span> : '—' },
    { header: 'Issuing Authority', key: 'issuingInstitution', sortable: false, render: (val) => val ? <span className="font-semibold text-slate-700 dark:text-slate-300">{val.name}</span> : <span className="text-slate-400">Self</span> },
    { header: 'Convocation', key: 'convocationDate', render: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '—' },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val === 'ISSUED' ? 'Issued' : val === 'REVOKED' ? 'Revoked' : 'Pending'} size="sm" /> },
    {
      header: 'Actions', key: 'actions', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.status === 'PENDING' && (
            <button onClick={() => openIssueModal(row)} title="Issue Degree" className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950">
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {row.status === 'ISSUED' && (
            <button onClick={() => setRevokeTarget(row)} title="Revoke Degree" className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950">
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => setDeleteTarget(row)} title="Delete Record" className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filtered = degrees.filter((d) =>
    `${d.student?.firstName} ${d.student?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    d.degreeName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Convocation & Degree Issuance</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Formal degree records with registry number and convocation date — separate from TC/bonafide certificates</p>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search by student or degree name..."
        addLabel="Add Degree Record"
        onAddClick={openAddModal}
        onRefreshClick={fetchAll}
      />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Degree Records Found" description="Create a degree record for a graduating student, then issue it once convocation is confirmed." actionLabel="Add Degree Record" onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Add Degree Record"
        subtitle="Created as Pending — issue it separately once convocation is confirmed"
        icon={Award}
        submitLabel="Create Record"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'studentId', label: 'Student', type: 'select', required: true, span: 'full', options: students.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` })) },
          { name: 'degreeName', label: 'Degree Name (e.g. Bachelor of Technology in CSE)', required: true, span: 'full' },
          { name: 'convocationDate', label: 'Convocation Date', type: 'date' },
        ]}
      />

      <FormModal
        isOpen={!!issueTarget}
        title={`Issue Degree — ${issueTarget?.student?.firstName || ''} ${issueTarget?.student?.lastName || ''}`}
        subtitle={issueTarget?.degreeName}
        icon={CheckCircle}
        submitLabel="Confirm Issue"
        isSubmitting={issuing}
        onClose={() => setIssueTarget(null)}
        onSubmit={handleIssue}
        values={issueForm}
        onChange={(name, value) => setIssueForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'degreeNumber', label: 'Registry / Degree Number', span: 'full' },
          { name: 'issuedDate', label: 'Issued Date', type: 'date', required: true },
        ]}
      />

      <ConfirmDialog
        isOpen={!!revokeTarget}
        title="Revoke Degree"
        message={`Are you sure you want to revoke "${revokeTarget?.degreeName}" for ${revokeTarget?.student?.firstName} ${revokeTarget?.student?.lastName}?`}
        confirmText="Revoke"
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Degree Record"
        message={`Are you sure you want to permanently delete this degree record? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default DegreeIssuancePage;
