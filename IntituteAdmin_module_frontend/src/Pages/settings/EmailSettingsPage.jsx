import React from 'react';
import FormSection from '../../components/common/FormSection';
import { Mail, Save } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const EmailSettingsPage = () => {
  const { notifySuccess } = useNotification();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Email SMTP & Domain Server Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Institutional Google Workspace / Office 365 SMTP Relay setup</p>
      </div>

      <FormSection title="SMTP Mail Server Details" icon={Mail}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div><label className="block font-semibold mb-1">SMTP Host</label><input type="text" defaultValue="smtp.gmail.com" className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono" /></div>
          <div><label className="block font-semibold mb-1">Port</label><input type="text" defaultValue="587 (TLS)" className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono" /></div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={() => notifySuccess('SMTP Settings Saved!')} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md">
            <Save className="w-4 h-4" />
            <span>Save SMTP Settings</span>
          </button>
        </div>
      </FormSection>
    </div>
  );
};

export default EmailSettingsPage;
