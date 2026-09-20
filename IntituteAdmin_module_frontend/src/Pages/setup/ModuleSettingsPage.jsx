import React, { useState, useEffect, useCallback } from 'react';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, Settings, SlidersHorizontal } from 'lucide-react';
import moduleConfigService from '../../services/moduleConfigService';
import ErrorState from '../../components/common/ErrorState';

const FIELD_TYPE_MAP = { TEXT: 'text', NUMBER: 'number', BOOLEAN: 'checkbox', SELECT: 'select' };

export const ModuleSettingsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    moduleConfigService.getAssignedModules()
      .then((res) => setModules(res.data || []))
      .catch((err) => { notifyError(`Failed to load module settings: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openConfig = (mod) => {
    setActiveModule(mod);
    setForm({ ...(mod.config || {}) });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const typeByKey = Object.fromEntries((activeModule.configSchema?.fields || []).map((f) => [f.key, f.type]));
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, typeByKey[key] === 'NUMBER' && value !== '' ? Number(value) : value])
      );
      await moduleConfigService.updateModuleConfig(activeModule.moduleKey, payload);
      notifySuccess(`${activeModule.name} settings saved`);
      setActiveModule(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save settings: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const fields = activeModule?.configSchema?.fields?.map((f) => ({
    name: f.key,
    label: f.label,
    type: FIELD_TYPE_MAP[f.type] || 'text',
    options: f.type === 'SELECT' ? (f.options || []).map((o) => ({ value: o, label: o })) : undefined,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Module Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure the modules assigned to your institution by the platform administrator</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={fetchAll} />
      ) : modules.length === 0 ? (
        <EmptyState
          title="No Assigned Modules Yet"
          description="Your platform administrator hasn't assigned any modules through the registry yet — module settings will appear here once they do."
          icon={Settings}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <div key={mod.moduleKey} className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{mod.name}</p>
                  <p className="text-[10px] font-mono text-slate-400">{mod.moduleKey}</p>
                </div>
                <StatusBadge status={mod.status} size="sm" />
              </div>
              {mod.description && <p className="text-xs text-slate-500 dark:text-slate-400">{mod.description}</p>}
              <button
                onClick={() => openConfig(mod)}
                disabled={!mod.configurable}
                className="mt-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:dark:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {mod.configurable ? 'Configure' : 'No settings available'}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeModule && (
        <FormModal
          isOpen={Boolean(activeModule)}
          title={`${activeModule.name} Settings`}
          icon={Settings}
          submitLabel="Save Settings"
          isSubmitting={submitting}
          onClose={() => setActiveModule(null)}
          onSubmit={handleSave}
          values={form}
          onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
          fields={fields}
        />
      )}
    </div>
  );
};

export default ModuleSettingsPage;
