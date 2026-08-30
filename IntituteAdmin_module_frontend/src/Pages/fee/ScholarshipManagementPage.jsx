import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Award, Edit3, Loader2 } from 'lucide-react';
import feeService from '../../services/feeService';

const emptyForm = { discountAmount: '', scholarshipName: '', scholarshipRef: '' };

export const ScholarshipManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [scholarships, setScholarships] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [form, setForm] = useState(emptyForm);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([feeService.getScholarships(), feeService.getAssignments()])
      .then(([scholRes, assignRes]) => {
        setScholarships(scholRes.data || []);
        setAllAssignments(assignRes.data || []);
      })
      .catch((err) => notifyError(`Failed to load scholarships: ${err.message}`))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openModal = (assignment) => {
    setTargetId(assignment.id);
    setForm({
      discountAmount: String(assignment.discountAmount || ''),
      scholarshipName: assignment.scholarshipName || '',
      scholarshipRef: assignment.scholarshipRef || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await feeService.applyScholarship(targetId, form);
      notifySuccess('Scholarship / concession applied successfully!');
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to apply scholarship: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Student', key: 'student', sortable: false, render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.firstName} {val?.lastName}</span> },
    { header: 'Roll No', key: 'student2', sortable: false, render: (_, row) => <span className="font-mono font-bold text-indigo-600">{row.student?.rollNumber}</span> },
    { header: 'Scholarship Scheme', key: 'scholarshipName', render: (val) => <span className="font-semibold text-indigo-600">{val || '—'}</span> },
    { header: 'Reference No', key: 'scholarshipRef', render: (val) => <span className="font-mono text-xs">{val || '—'}</span> },
    { header: 'Fee Structure', key: 'feeStructure', sortable: false, render: (val) => val?.name },
    { header: 'Concession Amount (₹)', key: 'discountAmount', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (_, row) => (
        <button onClick={() => openModal(row)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Scholarship & Concession Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Apply fee concessions and scholarship waivers against a student's fee assignment</p>
        </div>
      </div>

      {allAssignments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">Apply a new concession to any fee assignment:</p>
          <select
            onChange={(e) => e.target.value && openModal(allAssignments.find((a) => a.id === e.target.value))}
            value=""
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
          >
            <option value="">Select a student fee assignment...</option>
            {allAssignments.map((a) => (
              <option key={a.id} value={a.id}>{a.student?.rollNumber} — {a.student?.firstName} {a.student?.lastName} ({a.feeStructure?.name})</option>
            ))}
          </select>
        </div>
      )}

      {scholarships.length === 0 ? (
        <EmptyState title="No Scholarships Applied Yet" description="Select a fee assignment above to apply the first concession." icon={Award} />
      ) : (
        <DataTable columns={columns} data={scholarships} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Apply Scholarship / Concession"
        icon={Award}
        submitLabel="Save Concession"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'discountAmount', label: 'Concession Amount (₹)', type: 'number', required: true, span: 'full' },
          { name: 'scholarshipName', label: 'Scholarship Scheme Name' },
          { name: 'scholarshipRef', label: 'Govt Sanction / Reference No' },
        ]}
      />
    </div>
  );
};

export default ScholarshipManagementPage;
