import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FormInput from '../../components/common/FormInput';
import LoadingState from '../../components/common/LoadingState';
import { useNotification } from '../../context/NotificationContext';
import billingService from '../../services/billingService';
import { Save, ShieldCheck } from 'lucide-react';

export const TaxSettingsPage = () => {
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ companyName: '', companyGstin: '', companyState: '', companyAddress: '' });

  useEffect(() => {
    billingService.getGstProfile()
      .then((res) => setForm(res.data))
      .catch((err) => showError(err.message || 'Failed to load GST profile', 'Load Failed'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await billingService.updateGstProfile(form);
      setForm(res.data);
      success('Platform GST profile updated. All future invoices will use this identity.', 'GST Profile Saved');
    } catch (err) {
      showError(err.message || 'Failed to save GST profile', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Tax Settings (GST)"
        subtitle="Platform's own GST registration identity — used as the 'Supplier' details on every invoice generated for institutions. Institution's billing state vs this state determines CGST+SGST (intra-state) or IGST (inter-state)."
      />

      {loading ? (
        <LoadingState message="Loading GST profile..." />
      ) : (
        <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <FormInput
            label="Company / Legal Entity Name"
            required
            value={form.companyName}
            onChange={(v) => setForm({ ...form, companyName: v })}
          />
          <FormInput
            label="GSTIN"
            required
            value={form.companyGstin}
            onChange={(v) => setForm({ ...form, companyGstin: v.toUpperCase() })}
            placeholder="e.g. 33AAAAA0000A1Z5"
            helpText="15-character GSTIN format is validated on save"
          />
          <FormInput
            label="Registered State"
            required
            value={form.companyState}
            onChange={(v) => setForm({ ...form, companyState: v })}
            helpText="Must exactly match how institution states are entered, to correctly split CGST/SGST vs IGST"
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Registered Address</label>
            <textarea
              rows={3}
              value={form.companyAddress}
              onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
            >
              {saving ? <ShieldCheck className="w-4 h-4 animate-pulse" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save GST Profile'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TaxSettingsPage;
