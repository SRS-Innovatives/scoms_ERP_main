import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { mockFeeLedger } from '../../data/mockStudentData';
import { CreditCard, QrCode, Building, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PayFeesPage = () => {
  const { success } = useNotification();
  const navigate = useNavigate();
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      success('Payment of ₹10,000 received cleanly via Razorpay Gateway.', 'Fee Payment Successful');
      navigate('/student/fees/receipts');
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader title="Online Fee Payment Gateway" subtitle="Secure checkout via Razorpay / Paytm / PhonePe" />

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex justify-between items-center text-xs">
          <div>
            <p className="text-slate-500">Payable Fee Balance:</p>
            <p className="text-2xl font-black text-indigo-600">₹{mockFeeLedger.pendingFee.toLocaleString()}</p>
          </div>
          <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 font-bold rounded-xl text-xs">Due Aug 31st</span>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Select Payment Method</label>
          <div className="grid grid-cols-3 gap-3 text-xs">
            {[
              { mode: 'UPI', label: 'UPI / GPay / PhonePe', icon: QrCode },
              { mode: 'CARD', label: 'Debit / Credit Card', icon: CreditCard },
              { mode: 'NETBANKING', label: 'Net Banking', icon: Building }
            ].map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.mode}
                  onClick={() => setPaymentMode(m.mode)}
                  className={`p-4 rounded-2xl border font-bold flex flex-col items-center gap-2 transition-all ${
                    paymentMode === m.mode
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[11px]">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full py-3.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
        >
          {isProcessing ? 'Processing Payment...' : `Proceed & Pay ₹${mockFeeLedger.pendingFee.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
};

export default PayFeesPage;
