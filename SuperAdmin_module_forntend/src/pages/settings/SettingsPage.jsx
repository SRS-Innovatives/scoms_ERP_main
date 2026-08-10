import React, { useState } from 'react';
import FormInput from '../../components/common/FormInput';
import Select from '../../components/common/Select';
import { useNotification } from '../../context/NotificationContext';
import { Settings, Globe, Shield, CreditCard, Palette, Save } from 'lucide-react';

export const SettingsPage = () => {
  const { success } = useNotification();
  const [activeTab, setActiveTab] = useState('General');

  const settingsTabs = [
    "General",
    "Branding",
    "Localization",
    "Timezone & Currency",
    "Academic Masters",
    "Notifications",
    "SMS Gateway",
    "WhatsApp",
    "Email SMTP",
    "Payment Gateway",
    "Security Policy",
    "AI Configuration",
    "Storage Limits",
    "Backups",
    "API Management",
    "Maintenance"
  ];

  const [generalConfig, setGeneralConfig] = useState({
    appName: 'SCOMS SaaS Educational Enterprise ERP',
    supportEmail: 'support@scoms.edu.in',
    timezone: 'Asia/Kolkata',
    currency: 'INR (₹)',
    language: 'English'
  });

  const handleSave = (e) => {
    e.preventDefault();
    success('Platform master configuration saved cleanly.', 'Settings Updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Super Admin Platform Master Settings</h2>
          <p className="text-xs text-slate-500 mt-1">Configure global SaaS defaults, localization, currency INR, and white-label preferences.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
        >
          <Save className="w-4 h-4" /> Save Platform Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation Tabs */}
        <div className="glass-card p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          {settingsTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="md:col-span-3 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b pb-2">{activeTab} Configuration Panel</h3>

          <div className="space-y-4">
            <FormInput label="Platform Title" value={generalConfig.appName} onChange={(v) => setGeneralConfig({ ...generalConfig, appName: v })} />
            <FormInput label="Platform Support Email" value={generalConfig.supportEmail} onChange={(v) => setGeneralConfig({ ...generalConfig, supportEmail: v })} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Timezone" value={generalConfig.timezone} options={[{ value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' }]} />
              <Select label="Default Currency" value={generalConfig.currency} options={[{ value: 'INR (₹)', label: 'INR (₹ - Indian Rupee)' }]} />
            </div>
            <Select
              label="Primary Language Localization"
              value={generalConfig.language}
              options={[
                { value: 'English', label: 'English' },
                { value: 'Tamil', label: 'Tamil (தமிழ்)' },
                { value: 'Hindi', label: 'Hindi (हिंदी)' },
                { value: 'Kannada', label: 'Kannada (ಕನ್ನಡ)' },
                { value: 'Telugu', label: 'Telugu (తెలుగు)' },
                { value: 'Malayalam', label: 'Malayalam (മലയാളം)' }
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
