import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import alumniService from '../../services/alumniService';
import { GraduationCap, Edit, Trash2, Link2, Mail } from 'lucide-react';

const emptyForm = {
  studentId: '', fullName: '', graduationYear: new Date().getFullYear(), courseName: '',
  currentEmployer: '', currentDesignation: '', email: '', phone: '', linkedinUrl: '', testimonial: '',
};

export const AlumniManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [alumni, setAlumni] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [alumniRes, studentsRes] = await Promise.all([alumniService.getAll(), alumniService.getEligibleStudents()]);
      setAlumni(alumniRes.data || []);
      setEligibleStudents(studentsRes.data || []);
    } catch (error) {
      notifyError(`Failed to load alumni: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingId(row.id);
    setForm({
      studentId: row.studentId || '',
      fullName: row.fullName,
      graduationYear: row.graduationYear,
      courseName: row.courseName || '',
      currentEmployer: row.currentEmployer || '',
      currentDesignation: row.currentDesignation || '',
      email: row.email || '',
      phone: row.phone || '',
      linkedinUrl: row.linkedinUrl || '',
      testimonial: row.testimonial || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await alumniService.update(editingId, form);
        notifySuccess(`Alumni record for ${form.fullName} updated successfully!`);
      } else {
        await alumniService.create(form);
        notifySuccess(`Alumni record for ${form.fullName} added successfully!`);
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save alumni record: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await alumniService.remove(deleteTarget.id);
      notifySuccess(`Alumni record for ${deleteTarget.fullName} deleted.`);
      setDeleteTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      header: 'Alumni Name', key: 'fullName',
      render: (val, row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{val}</p>
          {row.student?.admissionNumber && <p className="text-[10px] text-slate-400 font-mono">{row.student.admissionNumber}</p>}
        </div>
      ),
    },
    { header: 'Graduation Year', key: 'graduationYear', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Course', key: 'courseName', render: (val) => val || '—' },
    { header: 'Current Employer', key: 'currentEmployer', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val || '—'}</span> },
    { header: 'Designation', key: 'currentDesignation', render: (val) => val || '—' },
    {
      header: 'Contact', key: 'email', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.email && <a href={`mailto:${row.email}`} title={row.email} onClick={(e) => e.stopPropagation()}><Mail className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600" /></a>}
          {row.linkedinUrl && <a href={row.linkedinUrl} target="_blank" rel="noreferrer" title="LinkedIn" onClick={(e) => e.stopPropagation()}><Link2 className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600" /></a>}
          {!row.email && !row.linkedinUrl && <span className="text-slate-400">—</span>}
        </div>
      ),
    },
    {
      header: 'Actions', key: 'actions', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(row)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filtered = alumni.filter((a) =>
    a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    a.currentEmployer?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Alumni Network Directory</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Track graduated students, current employer, and alumni mentorship contact</p>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search alumni by name or employer..."
        addLabel="Register Alumni"
        onAddClick={openAddModal}
        onRefreshClick={fetchAll}
      />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Alumni Records Found" description="Register a graduated student to start building your alumni network." actionLabel="Register Alumni" onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Alumni Record' : 'Register Alumni'}
        subtitle="Link to a real student, or enter manually for alumni who predate SCOMS"
        icon={GraduationCap}
        submitLabel={editingId ? 'Save Changes' : 'Register Alumni'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => {
          if (name === 'studentId' && value) {
            const s = eligibleStudents.find((es) => es.id === value);
            if (s) {
              setForm((prev) => ({ ...prev, studentId: value, fullName: `${s.firstName} ${s.lastName}`, courseName: s.course?.name || prev.courseName }));
              return;
            }
          }
          setForm((prev) => ({ ...prev, [name]: value }));
        }}
        fields={[
          {
            name: 'studentId', label: 'Link to Existing Student (optional)', type: 'select', span: 'full',
            placeholder: '— Manual entry —',
            options: eligibleStudents.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` })),
            disabled: !!editingId,
          },
          { name: 'fullName', label: 'Full Name', required: true },
          { name: 'graduationYear', label: 'Graduation Year', type: 'number', required: true },
          { name: 'courseName', label: 'Course / Degree' },
          { name: 'currentEmployer', label: 'Current Employer' },
          { name: 'currentDesignation', label: 'Current Designation' },
          { name: 'email', label: 'Email' },
          { name: 'phone', label: 'Phone' },
          { name: 'linkedinUrl', label: 'LinkedIn URL', span: 'full' },
          { name: 'testimonial', label: 'Testimonial / Message to Juniors', type: 'textarea', span: 'full' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Alumni Record"
        message={`Are you sure you want to delete the alumni record for "${deleteTarget?.fullName}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AlumniManagementPage;
