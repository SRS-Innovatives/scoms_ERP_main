import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { ShieldAlert, Power } from 'lucide-react';

export const MaintenanceModePage = () => {
  const { warning } = useNotification();
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [message, setMessage] = useState('SCOMS platform is undergoing scheduled database indexing maintenance.');

  const toggleMaintenance = () => {
    setMaintenanceActive(prev => !prev);
    warning(`Platform Maintenance Mode set to ${!maintenanceActive ? 'ACTIVE' : 'OFF'}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Platform Maintenance Mode Control" subtitle="Put the SCOMS multi-tenant portal into maintenance mode for scheduled upgrades." />

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Maintenance Status</h4>
              <p className="text-slate-500">{maintenanceActive ? 'ACTIVE - Users see maintenance screen' : 'OFF - Platform operating normally'}</p>
            </div>
          </div>
          <button
            onClick={toggleMaintenance}
            className={`px-4 py-2 font-bold text-white rounded-xl transition-all flex items-center gap-1.5 ${
              maintenanceActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Power className="w-4 h-4" /> {maintenanceActive ? 'Turn Off Maintenance' : 'Enable Maintenance'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">User-Facing Maintenance Message</label>
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default MaintenanceModePage;
