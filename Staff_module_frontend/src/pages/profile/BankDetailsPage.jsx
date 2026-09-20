import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, Edit3, Save, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import profileService from '../../services/profileService';
import ErrorState from '../../components/common/ErrorState';

const emptyForm = { bankAccountName: '', bankName: '', bankAccountNumber: '', bankIfscCode: '', panNumber: '' };

export const BankDetailsPage = () => {
  const { success, error: showError } = useNotification();
  const [details, setDetails] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    profileService.getMyProfile()
      .then((res) => {
        const d = {
          bankAccountName: res.data.bankAccountName || '',
          bankName: res.data.bankName || '',
          bankAccountNumber: res.data.bankAccountNumber || '',
          bankIfscCode: res.data.bankIfscCode || '',
          panNumber: res.data.panNumber || '',
        };
        setDetails(d);
        setForm(d);
      })
      .catch((err) => { showError(err.message || 'Failed to load bank details', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileService.updateMyProfile(form);
      success('Bank details updated successfully!', 'Saved');
      setEditing(false);
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to update bank details', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchAll} />;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-500" /> Salary Account & Bank Info
        </h3>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800">
            <Edit3 className="w-3 h-3" /> Edit
          </button>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <Lock className="w-3 h-3" /> Only you can see this
          </span>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <input placeholder="Account Holder Name" value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          <input placeholder="Bank Name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          <input placeholder="Account Number" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono" />
          <input placeholder="IFSC Code" value={form.bankIfscCode} onChange={(e) => setForm({ ...form, bankIfscCode: e.target.value.toUpperCase() })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono" />
          <input placeholder="PAN Number" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono" />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setEditing(false); setForm(details); }} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 text-white rounded-xl font-bold disabled:opacity-50"><Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between"><span className="text-slate-500">Account Holder Name</span><span className="font-bold text-slate-900 dark:text-slate-100">{details.bankAccountName || '—'}</span></div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between"><span className="text-slate-500">Bank Name</span><span className="font-bold text-slate-900 dark:text-slate-100">{details.bankName || '—'}</span></div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between"><span className="text-slate-500">Account Number</span><span className="font-mono font-bold text-slate-900 dark:text-slate-100">{details.bankAccountNumber || '—'}</span></div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between"><span className="text-slate-500">IFSC Code</span><span className="font-mono font-bold text-slate-900 dark:text-slate-100">{details.bankIfscCode || '—'}</span></div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between"><span className="text-slate-500">PAN Number</span><span className="font-mono font-bold text-slate-900 dark:text-slate-100">{details.panNumber || '—'}</span></div>
        </div>
      )}
    </div>
  );
};

export default BankDetailsPage;
