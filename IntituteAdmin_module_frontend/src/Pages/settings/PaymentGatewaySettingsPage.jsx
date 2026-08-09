import React from 'react';
import FormSection from '../../components/common/FormSection';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const PaymentGatewaySettingsPage = () => {
  const { notifySuccess } = useNotification();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Online Payment Gateway Integration</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure Razorpay / Easebuzz / SBI e-Pay API Keys for student online fee payments</p>
      </div>

      <FormSection title="Razorpay / SBI e-Pay Merchant Credentials" icon={CreditCard}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div><label className="block font-semibold mb-1">Merchant Key ID</label><input type="text" defaultValue="rzp_live_8492019482" className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono font-bold" /></div>
          <div><label className="block font-semibold mb-1">Key Secret</label><input type="password" defaultValue="****************" className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono" /></div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={() => notifySuccess('Payment Gateway Credentials Updated!')} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md">
            <ShieldCheck className="w-4 h-4" />
            <span>Save Merchant Credentials</span>
          </button>
        </div>
      </FormSection>
    </div>
  );
};

export default PaymentGatewaySettingsPage;
