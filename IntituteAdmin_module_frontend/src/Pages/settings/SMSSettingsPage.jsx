import React, { useState, useEffect } from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { MessageSquare, Save, Loader2 } from 'lucide-react';
import settingsService from '../../services/settingsService';

export const SMSSettingsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [form, setForm] = useState({ smsProvider: '', smsSenderId: '', smsDltEntityId: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.getSettings()
      .then((res) => setForm({
        smsProvider: res.data.smsProvider || '',
        smsSenderId: res.data.smsSenderId || '',
        smsDltEntityId: res.data.smsDltEntityId || '',
      }))
      .catch((err) => notifyError(`Failed to load SMS settings: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateSettings(form);
      notifySuccess('SMS DLT settings saved!');
    } catch (error) {
      notifyError(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">DLT Bulk SMS Gateway Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">TRAI DLT Entity ID & Header Sender ID — SMS credits are managed separately under the SMS wallet, API secrets stay server-side</p>
      </div>

      <FormSection title="TRAI DLT Gateway Configuration" icon={MessageSquare}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">DLT Provider</label>
            <input type="text" placeholder="e.g. ValueFirst / CDAC" value={form.smsProvider} onChange={(e) => setForm({ ...form, smsProvider: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium" />
          </div>
          <div>
            <label className="block font-semibold mb-1">DLT Header Sender ID (6 Chars)</label>
            <input type="text" maxLength={6} placeholder="e.g. SCOMSS" value={form.smsSenderId} onChange={(e) => setForm({ ...form, smsSenderId: e.target.value.toUpperCase() })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold" />
          </div>
          <div className="md:col-span-2">
            <label className="block font-semibold mb-1">Principal Entity (PE) ID</label>
            <input type="text" placeholder="e.g. 1001492019482" value={form.smsDltEntityId} onChange={(e) => setForm({ ...form, smsDltEntityId: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold" />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">The SMS API secret key is configured on the server and never exposed through this form.</p>
        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50">
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save DLT Configuration'}</span>
          </button>
        </div>
      </FormSection>
    </div>
  );
};

export default SMSSettingsPage;
