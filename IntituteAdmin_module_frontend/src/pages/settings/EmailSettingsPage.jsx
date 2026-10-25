import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../../components/common/FormSection';
import { Mail, Save, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import settingsService from '../../services/settingsService';
import ErrorState from '../../components/common/ErrorState';

export const EmailSettingsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [form, setForm] = useState({ smtpHost: '', smtpPort: '', smtpFromEmail: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    settingsService.getSettings()
      .then((res) => setForm({
        smtpHost: res.data.smtpHost || '',
        smtpPort: res.data.smtpPort || '',
        smtpFromEmail: res.data.smtpFromEmail || '',
      }))
      .catch((err) => { notifyError(`Failed to load email settings: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateSettings(form);
      notifySuccess('SMTP settings saved!');
    } catch (error) {
      notifyError(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Email SMTP & Domain Server Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Institutional SMTP relay display settings — the sending credentials themselves are configured server-side</p>
      </div>

      <FormSection title="SMTP Mail Server Details" icon={Mail}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">SMTP Host</label>
            <input type="text" placeholder="smtp.gmail.com" value={form.smtpHost} onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Port</label>
            <input type="text" placeholder="587 (TLS)" value={form.smtpPort} onChange={(e) => setForm({ ...form, smtpPort: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono" />
          </div>
          <div className="md:col-span-2">
            <label className="block font-semibold mb-1">From Email Address</label>
            <input type="email" placeholder="noreply@yourinstitute.edu.in" value={form.smtpFromEmail} onChange={(e) => setForm({ ...form, smtpFromEmail: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono" />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">SMTP credentials (username/password/API key) are configured on the server and never exposed through this form.</p>
        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50">
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save SMTP Settings'}</span>
          </button>
        </div>
      </FormSection>
    </div>
  );
};

export default EmailSettingsPage;
