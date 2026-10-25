import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { AlertTriangle } from 'lucide-react';
import feeService from '../../services/feeService';

export const StudentFeeAssignmentPage = () => {
  const navigate = useNavigate();
  const { notifyError } = useNotification();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const assignRes = await feeService.getAssignments();
      setAssignments(assignRes.data || []);
    } catch (error) {
      notifyError(`Failed to load fee assignments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const columns = [
    { header: 'Roll No', key: 'student', sortable: false, render: (val) => <span className="font-mono font-bold text-indigo-600">{val?.rollNumber}</span> },
    { header: 'Student Name', key: 'student2', sortable: false, render: (_, row) => <span className="font-bold text-slate-900 dark:text-white">{row.student?.firstName} {row.student?.lastName}</span> },
    { header: 'Course', key: 'student3', sortable: false, render: (_, row) => row.student?.course?.name },
    { header: 'Fee Structure', key: 'feeStructure', sortable: false, render: (val) => val?.name },
    { header: 'Total (₹)', key: 'totalAmount', render: (val) => <span className="font-mono">₹{val.toLocaleString()}</span> },
    { header: 'Scholarship / Discount (₹)', key: 'discountAmount', render: (val) => <span className="font-semibold text-emerald-700">{val > 0 ? `₹${val.toLocaleString()}` : '—'}</span> },
    { header: 'Net Payable (₹)', key: 'dueAmount', render: (val, row) => <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(row.totalAmount - row.discountAmount).toLocaleString()}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Fee Assignment (Legacy)</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Existing individual fee assignments — view only</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-300">
          This legacy fee system no longer accepts new assignments. Existing assignments below remain viewable and collectible.
          To assign a fee to a student, publish a structure in{' '}
          <button onClick={() => navigate('/admin/fee/structure-builder')} className="font-bold underline">Fee Structure Builder</button> and assign it from there.
        </p>
      </div>

      {!loading && assignments.length === 0 ? (
        <EmptyState title="No Legacy Fee Assignments" description="No individual fee assignments were ever created with the classic fee system for this institution." />
      ) : (
        <DataTable columns={columns} data={assignments} loading={loading} />
      )}
    </div>
  );
};

export default StudentFeeAssignmentPage;
