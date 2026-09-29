import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../../components/common/FormSection';
import { CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import settingsService from '../../services/settingsService';
import ErrorState from '../../components/common/ErrorState';

export const PaymentGatewaySettingsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [form, setForm] = useState({ paymentGatewayProvider: '', paymentKeyId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    settingsService.getSettings()
      .then((res) => setForm({
        paymentGatewayProvider: res.data.paymentGatewayProvider || '',
        paymentKeyId: res.data.paymentKeyId || '',
      }))
      .catch((err) => { notifyError(`Failed to load payment gateway settings: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateSettings(form);
      notifySuccess('Payment gateway settings saved!');
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
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Online Payment Gateway Integration</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Merchant / public key identification for student online fee payments — the secret key is configured server-side only</p>
      </div>

      <FormSection title="Merchant Identification" icon={CreditCard}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Gateway Provider</label>
            <input type="text" placeholder="e.g. Razorpay / SBI e-Pay" value={form.paymentGatewayProvider} onChange={(e) => setForm({ ...form, paymentGatewayProvider: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Merchant / Public Key ID</label>
            <input type="text" placeholder="e.g. rzp_live_xxxxxxxxxxxx" value={form.paymentKeyId} onChange={(e) => setForm({ ...form, paymentKeyId: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold" />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> The merchant secret key is never entered or stored here — it stays in the server's own environment configuration.</p>
        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50">
            <ShieldCheck className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Merchant Identification'}</span>
          </button>
        </div>
      </FormSection>
    </div>
  );
};

export default PaymentGatewaySettingsPage;
