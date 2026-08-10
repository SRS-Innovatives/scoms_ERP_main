import React, { useState } from 'react';
import { mockInstitutions } from '../../data/mockInstitutionsData';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import { mockUsers } from '../../data/mockUsersData';
import { mockInvoices } from '../../data/mockBillingData';
import { mockAuditLogs } from '../../data/mockAuditLogs';
import { useNotification } from '../../context/NotificationContext';
import { Building2, Users, GraduationCap, Briefcase, CreditCard, Receipt, Layers, FileText, Activity, Settings, Check } from 'lucide-react';
import { useParams } from 'react-router-dom';

export const InstitutionDetailPage = () => {
  const { id } = useParams();
  const { success } = useNotification();
  const inst = mockInstitutions.find(i => i.id === id) || mockInstitutions[0];
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = [
    'Overview',
    'Users',
    'Students',
    'Staff',
    'Subscription',
    'Billing',
    'Modules',
    'Documents',
    'Activity',
    'Settings'
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={inst.logo} alt={inst.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                {inst.code}
              </span>
              <StatusBadge status={inst.status} size="sm" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{inst.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{inst.type} • {inst.city}, {inst.state}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => success(`Status of ${inst.name} toggled cleanly.`, 'Status Updated')}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
          >
            Manage Institution
          </button>
        </div>
      </div>

      {/* 10 Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all shrink-0 ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b pb-2">Institutional Master Info</h3>
              <p><span className="text-slate-500">Affiliation:</span> <span className="font-semibold">{inst.affiliation}</span></p>
              <p><span className="text-slate-500">Registration Number:</span> <span className="font-mono font-semibold">{inst.regNo}</span></p>
              <p><span className="text-slate-500">Official Email:</span> <span className="font-semibold">{inst.email}</span></p>
              <p><span className="text-slate-500">Phone:</span> <span className="font-semibold">{inst.phone}</span></p>
              <p><span className="text-slate-500">Established Year:</span> <span className="font-semibold">{inst.establishedYear}</span></p>
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b pb-2">Location & Leadership</h3>
              <p><span className="text-slate-500">Address:</span> <span className="font-semibold">{inst.address}, {inst.city}, {inst.state} - {inst.pincode}</span></p>
              <p><span className="text-slate-500">Principal / Director:</span> <span className="font-semibold">{inst.principal}</span></p>
              <p><span className="text-slate-500">Contact Person:</span> <span className="font-semibold">{inst.contactPerson}</span></p>
              <p><span className="text-slate-500">Active Subscription:</span> <span className="font-bold text-indigo-600">{inst.plan}</span></p>
            </div>
          </div>
        )}

        {activeTab === 'Users' && (
          <DataTable
            columns={[
              { header: 'Name', key: 'name' },
              { header: 'Role', key: 'role' },
              { header: 'Email', key: 'email' },
              { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} size="sm" /> }
            ]}
            data={mockUsers}
          />
        )}

        {activeTab === 'Modules' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b pb-2">Enabled Module Access Control</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {inst.modulesEnabled.map((m, idx) => (
                <div key={idx} className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200">
                  <Check className="w-4 h-4 text-emerald-600" /> {m}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Billing' && (
          <DataTable
            columns={[
              { header: 'Invoice No', key: 'invoiceNo' },
              { header: 'Date', key: 'invoiceDate' },
              { header: 'Total (GST Incl.)', key: 'totalAmount', render: (v) => `₹${v.toLocaleString()}` },
              { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} size="sm" /> }
            ]}
            data={mockInvoices}
          />
        )}

        {activeTab === 'Activity' && (
          <DataTable
            columns={[
              { header: 'Timestamp', key: 'timestamp' },
              { header: 'User', key: 'user' },
              { header: 'Action', key: 'action' },
              { header: 'IP', key: 'ip' }
            ]}
            data={mockAuditLogs}
          />
        )}

        {['Students', 'Staff', 'Subscription', 'Documents', 'Settings'].includes(activeTab) && (
          <div className="text-xs text-slate-500 py-4">
            <p className="font-bold text-slate-800 dark:text-slate-200">{activeTab} Panel for {inst.name}</p>
            <p className="mt-1">Tenant isolated data loaded cleanly for Super Admin inspection.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionDetailPage;
