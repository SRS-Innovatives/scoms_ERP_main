import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ChallanTemplate from '../../components/print/ChallanTemplate';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { FileText, Plus } from 'lucide-react';
import feeService from '../../services/feeService';
import studentService from '../../services/studentService';

const emptyForm = { studentId: '', amount: '', dueDate: '', bankName: 'State Bank of India' };

export const ChallanGenerationPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [challans, setChallans] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [previewChallan, setPreviewChallan] = useState(null);
  const [error, setError] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    Promise.all([feeService.getChallans(), studentService.getAll()])
      .then(([challanRes, studentRes]) => {
        setChallans(challanRes.data || []);
        setStudents(studentRes.data || []);
      })
      .catch((err) => { notifyError(`Failed to load challans: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await feeService.createChallan(form);
      notifySuccess('Bank challan generated successfully!');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
      const s = res.data.student;
      setPreviewChallan({
        challanNo: res.data.challanNumber,
        issueDate: new Date(res.data.createdAt).toISOString().split('T')[0],
        dueDate: new Date(res.data.dueDate).toISOString().split('T')[0],
        studentName: `${s.firstName} ${s.lastName}`,
        rollNo: s.rollNumber,
        regNo: '',
        course: '',
        bankName: res.data.bankName,
        branch: '',
        accountName: '',
        accountNo: '',
        ifscCode: '',
        items: [{ feeHead: 'Fee Payment', amount: res.data.amount }],
        totalAmount: res.data.amount,
      });
    } catch (error) {
      notifyError(`Failed to generate challan: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Challan No', key: 'challanNumber', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Student', key: 'student', sortable: false, render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.firstName} {val?.lastName}</span> },
    { header: 'Amount (₹)', key: 'amount', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'Due Date', key: 'dueDate', render: (val) => <span className="font-mono text-rose-600">{new Date(val).toLocaleDateString('en-IN')}</span> },
    { header: 'Bank', key: 'bankName' },
    { header: 'Status', key: 'status' },
  ];

  if (error) {
    return <ErrorState onRetry={fetchAll} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Offline Payment Bank Challan Generator</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Generate 3-Fold Bank Challan (Bank Copy, Institute Copy & Student Copy)</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
          <Plus className="w-4 h-4" /> Generate Challan
        </button>
      </div>

      <DataTable columns={columns} data={challans} loading={loading} />

      {previewChallan && (
        <div className="pt-6 border-t-2 border-dashed border-indigo-300">
          <ChallanTemplate challanData={previewChallan} />
        </div>
      )}

      <FormModal
        isOpen={modalOpen}
        title="Generate Bank Challan"
        icon={FileText}
        submitLabel="Generate"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'studentId', label: 'Student', type: 'select', required: true, span: 'full', options: students.map((s) => ({ value: s.id, label: `${s.rollNumber} — ${s.firstName} ${s.lastName}` })) },
          { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
          { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
          { name: 'bankName', label: 'Bank Name' },
        ]}
      />
    </div>
  );
};

export default ChallanGenerationPage;
