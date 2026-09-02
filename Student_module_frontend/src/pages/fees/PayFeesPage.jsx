import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { CreditCard, QrCode, Building, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import feeService from '../../services/feeService';

const PAYMENT_MODES = [
  { mode: 'UPI', label: 'UPI / GPay / PhonePe', icon: QrCode },
  { mode: 'CARD', label: 'Debit / Credit Card', icon: CreditCard },
  { mode: 'NETBANKING', label: 'Net Banking', icon: Building },
];

export const PayFeesPage = () => {
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    feeService.getFees()
      .then((res) => {
        const due = (res.data || []).filter((a) => a.dueAmount > 0);
        setAssignments(due);
        if (due.length > 0) {
          setAssignmentId(due[0].id);
          setAmount(String(due[0].dueAmount));
        }
      })
      .catch((err) => showError(err.message || 'Failed to load fee dues', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  const selected = assignments.find((a) => a.id === assignmentId);

  const handleAssignmentChange = (id) => {
    setAssignmentId(id);
    const a = assignments.find((x) => x.id === id);
    if (a) setAmount(String(a.dueAmount));
  };

  const handlePay = async () => {
    if (!assignmentId || !amount) return;
    setIsProcessing(true);
    try {
      const initRes = await feeService.initiatePayment({ studentFeeAssignmentId: assignmentId, amount: Number(amount) });
      const order = initRes.data;

      if (!order.simulated) {
        // A real Razorpay checkout widget would open here; this build has no live
        // gateway credentials configured, so there's nothing further we can do.
        showError('Online gateway is configured but the checkout widget is not integrated in this build.', 'Payment Unavailable');
        setIsProcessing(false);
        return;
      }

      const verifyRes = await feeService.verifyPayment({
        studentFeeAssignmentId: assignmentId,
        amountPaid: Number(amount),
        razorpayOrderId: order.orderId,
        razorpayPaymentId: order.paymentId,
        razorpaySignature: order.signature,
      });

      success(`Payment of ₹${Number(amount).toLocaleString()} received — Receipt ${verifyRes.data.receipt.receiptNumber}`, 'Fee Payment Successful');
      navigate('/student/fees/receipts');
    } catch (err) {
      showError(err.message || 'Payment failed', 'Payment Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader title="Online Fee Payment Gateway" subtitle="Secure checkout — simulated in this build, no live gateway configured" />

      {assignments.length === 0 ? (
        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No pending fee dues. You're all caught up!
        </div>
      ) : (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Fee to Pay</label>
            <select
              value={assignmentId}
              onChange={(e) => handleAssignmentChange(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.feeStructure?.name} — Due ₹{a.dueAmount.toLocaleString()}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex justify-between items-center text-xs">
            <div className="flex-1">
              <p className="text-slate-500 mb-1">Amount to Pay:</p>
              <input
                type="number"
                min="1"
                max={selected?.dueAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl font-black text-indigo-600 bg-transparent border-b-2 border-indigo-300 focus:outline-none w-40"
              />
            </div>
            {selected && (
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 font-bold rounded-xl text-xs whitespace-nowrap">
                Due {new Date(selected.feeStructure?.dueDate).toLocaleDateString('en-IN')}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-3 text-xs">
              {PAYMENT_MODES.map((m) => {
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
            disabled={isProcessing || !amount || Number(amount) <= 0 || Number(amount) > (selected?.dueAmount || 0)}
            className="w-full py-3.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isProcessing ? 'Processing Payment...' : `Proceed & Pay ₹${Number(amount || 0).toLocaleString()}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default PayFeesPage;
