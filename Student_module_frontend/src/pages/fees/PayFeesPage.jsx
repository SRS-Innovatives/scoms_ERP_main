import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { CreditCard, QrCode, Building, Loader2, ShieldAlert, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import feeService from '../../services/feeService';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { useInstitution } from '../../context/InstitutionContext';
import ErrorState from '../../components/common/ErrorState';

const PAYMENT_MODES = [
  { mode: 'UPI', label: 'UPI / GPay / PhonePe', icon: QrCode },
  { mode: 'CARD', label: 'Debit / Credit Card', icon: CreditCard },
  { mode: 'NETBANKING', label: 'Net Banking', icon: Building },
];

// Lazily loads Razorpay's Checkout widget script exactly once, however many times a
// student opens this page — the real gateway only ever needs this when a live order
// (order.simulated === false) is actually created, i.e. once Super Admin has set real
// Razorpay keys in .env.
let razorpayScriptPromise = null;
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
};

/** What to pre-fill: the full amount payable (fee + late fee when the policy collects it with the fee). */
const defaultAmount = (a, status) => {
  const r = status?.fees?.find((f) => f.assignmentId === a.id);
  return r ? r.maxAmount : a.dueAmount;
};

export const PayFeesPage = () => {
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();
  const { student } = useStudentAuth();
  const { institution } = useInstitution();
  const [assignments, setAssignments] = useState([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(null); // Fee Policy: accepted amounts, credit, holds

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([feeService.getFees(), feeService.getFeeStatus().catch(() => ({ data: null }))])
      .then(([res, st]) => {
        const due = (res.data || []).filter((a) => a.dueAmount > 0);
        setAssignments(due);
        setStatus(st.data);
        if (due.length > 0) {
          // start on a fee that can be paid now (not one blocked by previous-year dues)
          const blocked = new Set((st.data?.fees || []).filter((f) => f.payable === false).map((f) => f.assignmentId));
          const first = due.find((a) => !blocked.has(a.id)) || due[0];
          setAssignmentId(first.id);
          setAmount(String(defaultAmount(first, st.data)));
        }
      })
      .catch((err) => { showError(err.message || 'Failed to load fee dues', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const selected = assignments.find((a) => a.id === assignmentId);
  const rules = status?.fees?.find((f) => f.assignmentId === assignmentId) || null;
  const maxAmount = rules ? rules.maxAmount : selected?.dueAmount || 0;
  const n = Number(amount || 0);
  const prevDues = rules?.previousYearDues || null; // Fee Policy → previous year dues
  const blockedByPrevious = prevDues?.mode === 'BLOCK';
  const adjustedToPrevious = prevDues?.mode === 'AUTO_ADJUST' ? Math.min(n, prevDues.total) : 0;
  const amountProblem = !n || n <= 0 ? 'Enter an amount'
    : rules?.allowedAmounts && !rules.allowedAmounts.some((x) => Math.abs(x - n) < 0.01) && n < maxAmount ? 'Choose one of the amounts above'
      : rules?.minimumAmount > 0 && n < rules.minimumAmount ? `The minimum payment is ₹${rules.minimumAmount.toLocaleString()}`
        : n > maxAmount + 0.009 && !rules?.extraAllowed ? `You can pay at most ₹${maxAmount.toLocaleString()}` : null;

  const handleAssignmentChange = (id) => {
    setAssignmentId(id);
    const a = assignments.find((x) => x.id === id);
    if (a) setAmount(String(defaultAmount(a, status)));
  };

  // orderToken: the server's signed record of this order's fee + amount (it credits that amount)
  const finishPayment = async ({ orderToken, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    try {
      const verifyRes = await feeService.verifyPayment({
        studentFeeAssignmentId: assignmentId,
        orderToken,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
      const prev = verifyRes.data.previousDuesPayments || [];
      const prevText = prev.length ? ` (₹${prev.reduce((t, p) => t + p.amount, 0).toLocaleString()} went to previous year dues — ${prev.length + (verifyRes.data.split?.fee > 0 ? 1 : 0)} receipts)` : '';
      success(`Payment of ₹${Number(amount).toLocaleString()} received — Receipt ${verifyRes.data.receipt.receiptNumber}${prevText}`, 'Fee Payment Successful');
      navigate('/student/fees/receipts');
    } catch (err) {
      showError(err.message || 'Payment failed', 'Payment Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePay = async () => {
    if (!assignmentId || !amount) return;
    setIsProcessing(true);
    try {
      const initRes = await feeService.initiatePayment({ studentFeeAssignmentId: assignmentId, amount: Number(amount) });
      const order = initRes.data;

      if (!order.simulated) {
        // Real gateway: open the actual Razorpay Checkout widget against the real order
        // the backend just created via Razorpay's Orders API.
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || !window.Razorpay) {
          showError('Could not load the payment gateway. Check your connection and try again.', 'Payment Unavailable');
          setIsProcessing(false);
          return;
        }

        const razorpay = new window.Razorpay({
          key: order.key,
          amount: Math.round(Number(amount) * 100),
          currency: order.currency || 'INR',
          name: institution?.name || 'Fee Payment',
          description: selected?.feeStructure?.name || 'Fee Payment',
          order_id: order.orderId,
          prefill: {
            name: student?.name || undefined,
            email: student?.email || undefined,
            contact: student?.phone || undefined,
          },
          theme: { color: '#4f46e5' },
          handler: (response) => {
            finishPayment({
              orderToken: order.orderToken,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => setIsProcessing(false),
          },
        });
        razorpay.on('payment.failed', (resp) => {
          showError(resp.error?.description || 'Payment failed at the gateway', 'Payment Failed');
          setIsProcessing(false);
        });
        razorpay.open();
        return;
      }

      // Simulated gateway: the backend already pre-computed a self-consistent
      // payment id + signature pair, so verify immediately with no real checkout UI.
      await finishPayment({
        orderToken: order.orderToken,
        razorpayOrderId: order.orderId,
        razorpayPaymentId: order.paymentId,
        razorpaySignature: order.signature,
      });
    } catch (err) {
      showError(err.message || 'Payment failed', 'Payment Failed');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader title="Online Fee Payment Gateway" subtitle="Secure Razorpay checkout" />

      {status?.onlinePaymentsEnabled === false && (
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-200">
          Online payments are switched off right now. Please pay at the fee office.
        </div>
      )}
      {status?.holds?.blocked?.length > 0 && (
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-200 flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Your {status.holds.blocked.map((b) => b.label).join(', ')} {status.holds.blocked.length > 1 ? 'are' : 'is'} on hold for unpaid fees. Paying ₹{status.holds.amountToClear.toLocaleString()} releases {status.holds.blocked.length > 1 ? 'them' : 'it'}.</span>
        </div>
      )}
      {status?.credit?.balance > 0 && (
        <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-800 dark:text-emerald-200 flex gap-2">
          <Wallet className="w-4 h-4 shrink-0" />
          <span>You have ₹{status.credit.balance.toLocaleString()} fee credit. {status.credit.autoUse ? 'It is used on your dues automatically.' : 'The fee office can use it towards your dues.'}</span>
        </div>
      )}

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
                max={rules?.extraAllowed ? undefined : maxAmount}
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

          {blockedByPrevious && (
            <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-200 space-y-2">
              <p className="flex gap-2 font-semibold"><ShieldAlert className="w-4 h-4 shrink-0" /> {prevDues.message}.</p>
              <ul className="pl-6 list-disc">
                {prevDues.fees.map((f) => <li key={f.assignmentId}>{f.feeName} ({f.yearName}) — ₹{f.dueAmount.toLocaleString()} due</li>)}
              </ul>
              {assignments.some((a) => a.id === prevDues.fees[0]?.assignmentId) && (
                <button type="button" onClick={() => handleAssignmentChange(prevDues.fees[0].assignmentId)} className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold">
                  Pay previous dues ({prevDues.fees[0].yearName})
                </button>
              )}
            </div>
          )}
          {prevDues?.mode === 'AUTO_ADJUST' && (
            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-200">
              You have previous year dues of ₹{prevDues.total.toLocaleString()} ({prevDues.years.join(', ')}). Your payment clears them first
              {adjustedToPrevious > 0 ? ` — ₹${adjustedToPrevious.toLocaleString()} goes to them${n > prevDues.total ? ` and ₹${(n - prevDues.total).toLocaleString()} to this fee` : ''}` : ''}. You get a receipt for each.
            </div>
          )}

          {rules && (
            <div className="space-y-2 text-xs">
              {rules.allowedAmounts && (
                <div>
                  <p className="text-slate-500 mb-1">Your institution accepts whole instalments online:</p>
                  <div className="flex flex-wrap gap-2">
                    {rules.allowedAmounts.map((x, i) => (
                      <button key={x} type="button" onClick={() => setAmount(String(x))} className={`px-3 py-1.5 rounded-xl border font-bold ${Math.abs(x - n) < 0.01 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 dark:border-slate-700'}`}>
                        ₹{x.toLocaleString()} {rules.allowedAmounts.length > 1 ? `(${i + 1} instalment${i ? 's' : ''})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {rules.minimumAmount > 0 && <p className="text-slate-500">Minimum payment: ₹{rules.minimumAmount.toLocaleString()}</p>}
              {rules.lateFeeIncluded && rules.lateFeeDue > 0 && <p className="text-amber-700 dark:text-amber-400">Includes a late fee of ₹{rules.lateFeeDue.toLocaleString()} ({rules.lateFeeOrder === 'FIRST' ? 'paid first' : 'paid after the fee'}).</p>}
              {!rules.lateFeeIncluded && rules.lateFeeDue > 0 && <p className="text-amber-700 dark:text-amber-400">A late fee of ₹{rules.lateFeeDue.toLocaleString()} is payable at the fee office.</p>}
              {rules.extraAllowed && <p className="text-slate-500">Anything you pay above the amount due is kept as fee credit.</p>}
              {amountProblem && n > 0 && <p className="text-rose-600 font-semibold">{amountProblem}</p>}
            </div>
          )}

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
            disabled={isProcessing || !!amountProblem || blockedByPrevious || status?.onlinePaymentsEnabled === false}
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
