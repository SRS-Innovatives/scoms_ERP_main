import React, { useState, useEffect } from 'react';
import { PhoneCall, ShieldAlert, Edit3, Save, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import profileService from '../../services/profileService';

const emptyForm = { emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '', emergencyContactAddress: '' };

export const EmergencyContactPage = () => {
  const { success, error: showError } = useNotification();
  const [details, setDetails] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    profileService.getMyProfile()
      .then((res) => {
        const d = {
          emergencyContactName: res.data.emergencyContactName || '',
          emergencyContactRelation: res.data.emergencyContactRelation || '',
          emergencyContactPhone: res.data.emergencyContactPhone || '',
          emergencyContactAddress: res.data.emergencyContactAddress || '',
        };
        setDetails(d);
        setForm(d);
      })
      .catch((err) => showError(err.message || 'Failed to load emergency contact', 'Load Failed'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileService.updateMyProfile(form);
      success('Emergency contact updated successfully!', 'Saved');
      setEditing(false);
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to update emergency contact', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" /> Emergency Contact Details
        </h3>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800">
            <Edit3 className="w-3 h-3" /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <input placeholder="Contact Name" value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          <input placeholder="Relationship" value={form.emergencyContactRelation} onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          <input placeholder="Phone Number" value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono" />
          <textarea placeholder="Address" rows={2} value={form.emergencyContactAddress} onChange={(e) => setForm({ ...form, emergencyContactAddress: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setEditing(false); setForm(details); }} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 text-white rounded-xl font-bold disabled:opacity-50"><Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Contact Name</span><span className="font-bold text-slate-900 dark:text-slate-100">{details.emergencyContactName || '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Relationship</span><span className="font-bold text-slate-900 dark:text-slate-100">{details.emergencyContactRelation || '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Phone Number</span><span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"><PhoneCall className="w-3.5 h-3.5" /> {details.emergencyContactPhone || '—'}</span></div>
          <div className="flex justify-between pt-2 border-t border-rose-200 dark:border-rose-800"><span className="text-slate-600 dark:text-slate-400">Address</span><span className="font-medium text-right max-w-xs text-slate-800 dark:text-slate-200">{details.emergencyContactAddress || '—'}</span></div>
        </div>
      )}
    </div>
  );
};

export default EmergencyContactPage;
