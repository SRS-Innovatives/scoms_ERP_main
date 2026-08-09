import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import SMSComposeModal from '../../components/modals/SMSComposeModal';
import { studentsList } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, CreditCard } from 'lucide-react';

export const PendingFeesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showSmsModal, setShowSmsModal] = useState(false);

  const pendingList = studentsList.filter((s) => s.feeStatus !== 'Paid');

  const columns = [
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-rose-600">{val}</span> },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Course & Dept', key: 'course' },
    { header: 'Pending Fee Amount (₹)', key: 'pendingFeeAmount', render: (val) => <span className="font-mono font-bold text-rose-600">₹{val.toLocaleString()}</span> },
    { header: 'Parent Phone (SMS Target)', key: 'parentPhone', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { header: 'Status', key: 'feeStatus', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions',
      key: 'id',
      render: (_, row) => (
        <button onClick={() => navigate('/admin/fee/collect')} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
          Collect Fee
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Pending Outstanding Fees Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Directory of defaulting students with overdue fee reminders</p>
        </div>

        <button onClick={() => setShowSmsModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-md">
          <MessageSquare className="w-4 h-4" />
          <span>Send Fee Reminder SMS</span>
        </button>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search defaulter name..." />
      <DataTable columns={columns} data={pendingList} />

      <SMSComposeModal isOpen={showSmsModal} onClose={() => setShowSmsModal(false)} defaultRecipientType="pending_fees" />
    </div>
  );
};

export default PendingFeesPage;
