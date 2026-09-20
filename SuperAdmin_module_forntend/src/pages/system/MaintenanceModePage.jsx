import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { ShieldAlert, Power, Loader2 } from 'lucide-react';
import settingsService from '../../services/settingsService';
import ErrorState from '../../components/common/ErrorState';

export const MaintenanceModePage = () => {
  const { warning, success, error: showError } = useNotification();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    settingsService.getSettings()
      .then((res) => setConfig(res.data))
      .catch((err) => { showError(err.message || 'Failed to load settings', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const toggleMaintenance = async () => {
    setToggling(true);
    try {
      const res = await settingsService.updateSettings({ maintenanceMode: !config.maintenanceMode });
      setConfig(res.data);
      warning(`Platform Maintenance Mode set to ${res.data.maintenanceMode ? 'ACTIVE' : 'OFF'}`);
    } catch (err) {
      showError(err.message || 'Failed to update maintenance mode', 'Update Failed');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Platform Maintenance Mode Control" subtitle="Toggle the platform's maintenance flag, persisted to the platform settings record." />

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Maintenance Status</h4>
              <p className="text-slate-500">{config.maintenanceMode ? 'ACTIVE' : 'OFF — platform operating normally'}</p>
            </div>
          </div>
          <button
            onClick={toggleMaintenance}
            disabled={toggling}
            className={`px-4 py-2 font-bold text-white rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 ${
              config.maintenanceMode ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Power className="w-4 h-4" /> {toggling ? 'Updating...' : config.maintenanceMode ? 'Turn Off Maintenance' : 'Enable Maintenance'}
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          This flag is persisted to the platform settings record but is not yet enforced by any backend middleware — no portal currently checks it before serving requests.
        </p>
      </div>
    </div>
  );
};

export default MaintenanceModePage;
