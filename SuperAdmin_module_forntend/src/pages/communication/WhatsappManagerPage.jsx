import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { MessageSquareCode, Settings, ShieldCheck, Play, Plus, Clock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const WhatsappManagerPage = () => {
  const { success } = useNotification();
  const [waConfig, setWaConfig] = useState({
    phoneNumberId: '10928471928',
    wabaId: '984712093874102',
    accessToken: 'EAAGb5ZCh8ZB40BA...',
  });

  const templates = [
    { id: 1, name: 'scoms_welcome_onboarding', category: 'Utility', language: 'English (US)', status: 'Approved' },
    { id: 2, name: 'fee_payment_reminder', category: 'Utility', language: 'English (US)', status: 'Approved' },
    { id: 3, name: 'exam_results_published', category: 'Utility', language: 'English (US)', status: 'Approved' },
    { id: 4, name: 'maintenance_alert_broadcast', category: 'Utility', language: 'English (US)', status: 'Pending' },
  ];

  const handleSave = (e) => {
    e.preventDefault();
    success('WhatsApp Business settings updated successfully!');
  };

  const columns = [
    { header: 'Template Name', key: 'name', render: (val) => <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{val}</span> },
    { header: 'Category', key: 'category' },
    { header: 'Language', key: 'language' },
    { 
      header: 'Status', 
      key: 'status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'}`}>
          {val}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="WhatsApp Business API" subtitle="Configure WhatsApp Cloud API credentials and manage approved message templates" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="WhatsApp Status" value="Active" subtitle="Connected" icon={ShieldCheck} color="emerald" />
        <StatCard title="WABA Messages" value="34,800" subtitle="This Month" icon={MessageSquareCode} color="indigo" />
        <StatCard title="Approved Templates" value="3" subtitle="Ready for dispatch" icon={Clock} color="indigo" />
        <StatCard title="Pending Review" value="1" subtitle="Awaiting Meta approval" icon={Clock} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Meta API Credentials</h3>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Phone Number ID</label>
              <input 
                type="text" 
                value={waConfig.phoneNumberId} 
                onChange={(e) => setWaConfig({ ...waConfig, phoneNumberId: e.target.value })} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">WhatsApp Business Account ID</label>
              <input 
                type="text" 
                value={waConfig.wabaId} 
                onChange={(e) => setWaConfig({ ...waConfig, wabaId: e.target.value })} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Permanent Access Token</label>
              <input 
                type="password" 
                value={waConfig.accessToken} 
                onChange={(e) => setWaConfig({ ...waConfig, accessToken: e.target.value })} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
            <div className="sm:col-span-2 pt-2">
              <button type="submit" className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                Save WhatsApp Settings
              </button>
            </div>
          </form>
        </div>

        {/* Templates Actions */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Plus className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Register Template</h3>
          </div>
          <div className="space-y-4 text-xs text-slate-500">
            <p>To dispatch dynamic notifications via WhatsApp, template categories and structures must be approved by Meta first.</p>
            <button 
              onClick={() => success('Opened WABA Template Creation wizard')}
              className="w-full py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              Create New Template
            </button>
          </div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Approved Meta Templates</h3>
        <DataTable columns={columns} data={templates} />
      </div>
    </div>
  );
};

export default WhatsappManagerPage;
