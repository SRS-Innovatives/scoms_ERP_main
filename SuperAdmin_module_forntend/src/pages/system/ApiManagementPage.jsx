import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { Key, Webhook, Activity, Settings, Plus, Play } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const ApiManagementPage = () => {
  const { success } = useNotification();
  const [rateLimit, setRateLimit] = useState(1000);

  const keys = [
    { id: 1, name: 'Delhi Public School Integration', token: 'scoms_pk_live_d3f9a...', role: 'Tenant API Access', status: 'Active', created: '2026-08-22' },
    { id: 2, name: 'St. Xavier ERP Syncer', token: 'scoms_pk_live_88a1b...', role: 'Tenant API Access', status: 'Active', created: '2026-08-20' },
    { id: 3, name: 'Razorpay Webhook Callback', token: 'scoms_pk_live_razor...', role: 'Payment Core Access', status: 'Active', created: '2026-08-16' },
  ];

  const webhooks = [
    { id: 1, url: 'https://api.dpis-delhi.edu.in/webhooks/scoms', events: 'student.admission, fee.payment', status: 'Healthy' },
    { id: 2, url: 'https://erp.stxavier-tech.edu.in/scoms-receiver', events: 'staff.registration', status: 'Healthy' },
  ];

  const handleGenKey = () => {
    success('Generated new API credential Key Pair!');
  };

  const keyColumns = [
    { header: 'Credential Owner', key: 'name', render: (val) => <span className="font-bold">{val}</span> },
    { header: 'Public Access Key Token', key: 'token', render: (val) => <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-rose-500">{val}</code> },
    { header: 'Assigned Role Scope', key: 'role' },
    { header: 'Date Created', key: 'created', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { 
      header: 'Status', 
      key: 'status',
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          {val}
        </span>
      )
    }
  ];

  const webhookColumns = [
    { header: 'Receiver Endpoint URL', key: 'url', render: (val) => <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{val}</span> },
    { header: 'Subscribed Events', key: 'events' },
    { 
      header: 'Status', 
      key: 'status',
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          {val}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="API Gateway Settings" subtitle="Configure integration API keys, webhook receivers and active rate limits" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="API Ingress Traffic" value="2.45M" subtitle="Requests Today" icon={Activity} color="indigo" />
        <StatCard title="Average Latency" value="42ms" subtitle="Global Ingress" icon={Activity} color="emerald" />
        <StatCard title="Active API Keys" value="25 Keys" subtitle="Multi-tenant Access" icon={Key} color="indigo" />
        <StatCard title="Webhook Delivery" value="99.94%" subtitle="Success Rate" icon={Webhook} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* API Settings */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">API Gateway Parameters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Global Rate Limit (Req/min per IP)</label>
              <input 
                type="number" 
                value={rateLimit} 
                onChange={(e) => setRateLimit(e.target.value)} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">API Documentation URL</label>
              <input 
                type="text" 
                readOnly
                value="https://api-docs.scoms.edu.in/v1" 
                className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500"
              />
            </div>
          </div>
          <div className="pt-2">
            <button onClick={() => success('Gateway parameters saved successfully!')} className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
              Save Parameters
            </button>
          </div>
        </div>

        {/* Generate Key */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Plus className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Issue API Credentials</h3>
          </div>
          <div className="space-y-4 text-slate-500">
            <p>Generate secure token keys to enable third-party systems or external scripts to integrate with SCOMS core services.</p>
            <button onClick={handleGenKey} className="w-full py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              Issue Key Pair
            </button>
          </div>
        </div>
      </div>

      {/* Keys List */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Active API Keys</h3>
        <DataTable columns={keyColumns} data={keys} />
      </div>

      {/* Webhooks List */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Active Webhook Subscriptions</h3>
        <DataTable columns={webhookColumns} data={webhooks} />
      </div>
    </div>
  );
};

export default ApiManagementPage;
