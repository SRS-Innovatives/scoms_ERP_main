import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { CreditCard, DollarSign, Receipt, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import feeService from '../../services/feeService';
import ErrorState from '../../components/common/ErrorState';

export const FeeOverviewPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    feeService.getFees()
      .then((res) => setAssignments(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load fee ledger', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const { totalFee, paidFee, pendingFee, nearestDueDate } = useMemo(() => {
    const totalFee = assignments.reduce((sum, a) => sum + a.totalAmount - a.discountAmount, 0);
    const paidFee = assignments.reduce((sum, a) => sum + a.paidAmount, 0);
    const pendingFee = assignments.reduce((sum, a) => sum + a.dueAmount, 0);
    const dueDates = assignments.filter((a) => a.dueAmount > 0).map((a) => new Date(a.feeStructure?.dueDate));
    const nearestDueDate = dueDates.length > 0 ? new Date(Math.min(...dueDates)) : null;
    return { totalFee, paidFee, pendingFee, nearestDueDate };
  }, [assignments]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Fee Ledger & Dues"
        subtitle="Fee structure breakdown, payments made, and outstanding balance."
        actionLabel="Pay Pending Fees Online"
        onAction={() => navigate('/student/fees/pay')}
        actionIcon={CreditCard}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Fee (Net of Discounts)" value={`₹${totalFee.toLocaleString()}`} icon={DollarSign} color="indigo" />
        <StatCard title="Paid Amount" value={`₹${paidFee.toLocaleString()}`} icon={Receipt} color="emerald" />
        <StatCard
          title="Pending Balance"
          value={`₹${pendingFee.toLocaleString()}`}
          subtitle={nearestDueDate ? `Due Date: ${nearestDueDate.toLocaleDateString('en-IN')}` : 'Nothing due'}
          icon={AlertCircle}
          color="amber"
          badgeText={pendingFee > 0 ? 'Action Due' : undefined}
        />
      </div>

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Itemized Fee Structure Breakdown</h3>
        {assignments.length === 0 ? (
          <p className="text-xs text-slate-500">No fee structures have been assigned to you yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {assignments.map((a) => (
              <div key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{a.feeStructure?.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Amount: ₹{a.totalAmount.toLocaleString()}{a.discountAmount > 0 ? ` (₹${a.discountAmount.toLocaleString()} scholarship applied)` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100">Balance: ₹{a.dueAmount.toLocaleString()}</p>
                  <StatusBadge status={a.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeOverviewPage;
