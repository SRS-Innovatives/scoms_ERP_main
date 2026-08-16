import React from 'react';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockFeeLedger } from '../../data/mockStudentData';
import { CreditCard, DollarSign, Receipt, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FeeOverviewPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Fee Ledger & Dues"
        subtitle="Semester tuition, exam, library, and laboratory fee breakdown."
        actionLabel="Pay Pending Fees Online"
        onAction={() => navigate('/student/fees/pay')}
        actionIcon={CreditCard}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Semester Fee" value={`₹${mockFeeLedger.totalFee.toLocaleString()}`} icon={DollarSign} color="indigo" />
        <StatCard title="Paid Amount" value={`₹${mockFeeLedger.paidFee.toLocaleString()}`} icon={Receipt} color="emerald" />
        <StatCard title="Pending Balance" value={`₹${mockFeeLedger.pendingFee.toLocaleString()}`} subtitle={`Due Date: ${mockFeeLedger.dueDate}`} icon={AlertCircle} color="amber" badgeText="Action Due" />
      </div>

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Itemized Fee Structure Breakdown</h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
          {mockFeeLedger.breakdown.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{item.type}</p>
                <p className="text-[11px] text-slate-500">Amount: ₹{item.amount.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100">Balance: ₹{item.balance.toLocaleString()}</p>
                <StatusBadge status={item.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeeOverviewPage;
