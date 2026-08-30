import React, { useState, useEffect } from 'react';
import FormInput from '../../components/common/FormInput';
import { useNotification } from '../../context/NotificationContext';
import { Save, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import settingsService from '../../services/settingsService';

const OTHER_TABS = [
  { label: 'Branding', path: '/super-admin/settings/branding' },
  { label: 'Security Policy', path: '/super-admin/security' },
  { label: 'Maintenance Mode', path: '/super-admin/maintenance' },
  { label: 'API Management', path: '/super-admin/api' },
  { label: 'Backups', path: '/super-admin/backups' },
  { label: 'Storage Limits', path: '/super-admin/storage' },
  { label: 'Integrations', path: '/super-admin/integrations' },
  { label: 'SMS Gateway', path: '/super-admin/sms' },
  { label: 'Email Gateway', path: '/super-admin/email' },
  { label: 'WhatsApp Gateway', path: '/super-admin/whatsapp' },
  { label: 'Tax & Billing', path: '/super-admin/billing/tax-settings' },
];

export const SettingsPage = () => {
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('General');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.getSettings()
      .then((res) => setConfig(res.data))
      .catch((err) => showError(err.message || 'Failed to load settings', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await settingsService.updateSettings({
        appName: config.appName,
        timezone: config.timezone,
        currency: config.currency,
        localization: config.localization,
      });
      setConfig(res.data);
      success('Platform master configuration saved.', 'Settings Updated');
    } catch (err) {
      showError(err.message || 'Failed to save settings', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Super Admin Platform Master Settings</h2>
          <p className="text-xs text-slate-500 mt-1">Configure global SaaS defaults, localization, and currency.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <button
            onClick={() => setActiveTab('General')}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'General' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            General
          </button>
          {OTHER_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-1"
            >
              {tab.label} <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="md:col-span-3 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b pb-2">General Configuration</h3>

          <FormInput label="Platform Title" value={config.appName} onChange={(v) => setConfig({ ...config, appName: v })} />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Timezone" value={config.timezone} onChange={(v) => setConfig({ ...config, timezone: v })} />
            <FormInput label="Default Currency" value={config.currency} onChange={(v) => setConfig({ ...config, currency: v })} />
          </div>
          <FormInput label="Primary Language Localization" value={config.localization} onChange={(v) => setConfig({ ...config, localization: v })} />

          <p className="text-[11px] text-slate-400 pt-2">Last updated {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : 'never'}.</p>

          <div className="pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Platform Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
