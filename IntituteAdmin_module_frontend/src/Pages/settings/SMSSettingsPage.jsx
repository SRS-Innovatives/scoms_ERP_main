import React, { useState, useEffect } from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { MessageSquare, Save, Loader2, Bell } from 'lucide-react';
import settingsService from '../../services/settingsService';

export const SMSSettingsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [form, setForm] = useState({ smsProvider: '', smsSenderId: '', smsDltEntityId: '', staffAttendanceSmsEnabled: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.getSettings()
      .then((res) => setForm({
        smsProvider: res.data.smsProvider || '',
        smsSenderId: res.data.smsSenderId || '',
        smsDltEntityId: res.data.smsDltEntityId || '',
        staffAttendanceSmsEnabled: res.data.staffAttendanceSmsEnabled !== false,
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

      <FormSection title="Staff Attendance SMS Permission" icon={Bell}>
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="text-xs">
            <p className="font-bold text-slate-800 dark:text-slate-200">Allow staff to auto-send absence SMS</p>
            <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              When ON, a parent gets an SMS the moment a staff member marks their child absent while taking classroom attendance.
              Turn this OFF to stop that automatic SMS platform-wide for this institution — attendance itself is still recorded either way.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.staffAttendanceSmsEnabled}
            onClick={() => setForm({ ...form, staffAttendanceSmsEnabled: !form.staffAttendanceSmsEnabled })}
            className={`shrink-0 relative w-11 h-6 rounded-full transition-colors ${form.staffAttendanceSmsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${form.staffAttendanceSmsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50">
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Permission'}</span>
          </button>
        </div>
      </FormSection>
    </div>
  );
};

export default SMSSettingsPage;
