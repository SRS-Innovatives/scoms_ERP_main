import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { ToggleLeft, ToggleRight, Settings, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const FeatureFlagsPage = () => {
  const { success } = useNotification();
  
  const [flags, setFlags] = useState([
    { id: 1, key: 'enable_ai_question_generation', name: 'AI Exam Question Generator', description: 'Allows teachers to auto-create tests from text materials.', env: 'Production', active: true },
    { id: 2, key: 'enable_ai_grading_assistant', name: 'AI Grading & Essay Evaluator', description: 'Enables automatic paper grading scoring system.', env: 'Beta Testing', active: true },
    { id: 3, key: 'enable_gps_vehicle_tracking', name: 'GPS Bus Live Tracking', description: 'Enables real-time location coordinate broadcasts on transport modules.', env: 'Beta Testing', active: false },
    { id: 4, key: 'enable_whatsapp_direct_alerts', name: 'Meta WhatsApp Notifications', description: 'Sends automated fee reminders directly to parent whatsapp accounts.', env: 'Production', active: true },
    { id: 5, key: 'enable_online_proctored_exams', name: 'Webcam Proctored Online Exams', description: 'Restricts tabs switches and runs face verification checks.', env: 'Development Only', active: false },
  ]);

  const handleToggle = (id, name, currentStatus) => {
    setFlags(flags.map(flag => flag.id === id ? { ...flag, active: !flag.active } : flag));
    success(`Feature Flag "${name}" toggled ${currentStatus ? 'OFF' : 'ON'} successfully!`);
  };

  const columns = [
    { header: 'Feature Flag ID Key', key: 'key', render: (val) => <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-rose-500 font-semibold">{val}</code> },
    { 
      header: 'Feature Name', 
      key: 'name',
      render: (val, row) => (
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200">{val}</h4>
          <p className="text-[10px] text-slate-500 font-normal mt-0.5">{row.description}</p>
        </div>
      )
    },
    { 
      header: 'Release Stage', 
      key: 'env',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'Production' ? 'bg-emerald-50 text-emerald-700' : val === 'Beta Testing' ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'}`}>
          {val}
        </span>
      )
    },
    {
      header: 'Enabled Globally',
      key: 'active',
      render: (active, row) => (
        <button onClick={() => handleToggle(row.id, row.name, active)}>
          {active ? <ToggleRight className="w-8 h-8 text-indigo-600" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="Feature Flags & Beta Controls" subtitle="Globally toggle system-wide modules, enable beta features for selected tiers and restrict access" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="Active Flags" value="3 Features" subtitle="Deploying in production" icon={ShieldCheck} color="emerald" />
        <StatCard title="Beta Tests" value="1 Feature" subtitle="Awaiting release" icon={Cpu} color="indigo" />
        <StatCard title="Dev Restricted" value="1 Feature" subtitle="Restricted access" icon={ShieldAlert} color="rose" />
        <StatCard title="Total Keys" value="5 Registered" subtitle="Flags Database" icon={Settings} color="indigo" />
      </div>

      {/* Flags List */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Global Feature Configurations</h3>
        <DataTable columns={columns} data={flags} />
      </div>
    </div>
  );
};

export default FeatureFlagsPage;
