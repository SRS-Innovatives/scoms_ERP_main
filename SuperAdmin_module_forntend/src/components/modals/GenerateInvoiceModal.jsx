import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Select from '../common/Select';
import FormInput from '../common/FormInput';
import { useNotification } from '../../context/NotificationContext';
import { Receipt } from 'lucide-react';
import institutionService from '../../services/institutionService';
import subscriptionService from '../../services/subscriptionService';
import billingService from '../../services/billingService';

export const GenerateInvoiceModal = ({ isOpen, onClose, onGenerated }) => {
  const { success, error: showError } = useNotification();
  const [institutions, setInstitutions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [institutionId, setInstitutionId] = useState('');
  const [planId, setPlanId] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Razorpay (UPI / Cards)');

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([institutionService.getInstitutions({ limit: 200 }), subscriptionService.getPlans()])
      .then(([instRes, planRes]) => {
        setInstitutions(instRes.data || []);
        setPlans(planRes.data || []);
      })
      .catch((err) => console.error('Failed to load invoice form data', err));
  }, [isOpen]);

  const selectedPlan = plans.find((p) => p.id === planId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institutionId) {
      showError('Select an institution', 'Missing Field');
      return;
    }
    setSubmitting(true);
    try {
      const res = await billingService.generateInvoice({
        institutionId,
        planId: planId || undefined,
        baseAmount: baseAmount ? Number(baseAmount) : undefined,
        paymentMode,
      });
      success(`Invoice ${res.data.invoiceNumber} generated (₹${res.data.totalAmount.toLocaleString('en-IN')} incl. GST).`, 'Invoice Generated');
      onGenerated && onGenerated(res.data);
      onClose();
      setInstitutionId('');
      setPlanId('');
      setBaseAmount('');
    } catch (err) {
      showError(err.message || 'Failed to generate invoice', 'Generation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate GST Invoice">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <Select
          label="Institution"
          required
          value={institutionId}
          onChange={setInstitutionId}
          options={[{ value: '', label: 'Select institution...' }, ...institutions.map((i) => ({ value: i.id, label: `${i.name} (${i.code})` }))]}
        />

        <Select
          label="Subscription Plan (optional — auto-fills base amount)"
          value={planId}
          onChange={(v) => {
            setPlanId(v);
            const plan = plans.find((p) => p.id === v);
            if (plan) setBaseAmount(String(plan.priceYearly));
          }}
          options={[{ value: '', label: 'No plan — enter amount manually' }, ...plans.map((p) => ({ value: p.id, label: `${p.name} — ₹${p.priceYearly.toLocaleString('en-IN')}/yr` }))]}
        />

        <FormInput
          label="Base Amount (₹, excl. GST)"
          type="number"
          required
          value={baseAmount}
          onChange={setBaseAmount}
          placeholder="e.g. 129990"
          helpText={selectedPlan ? `Auto-filled from ${selectedPlan.name} plan — editable` : 'CGST/SGST or IGST will be computed automatically at 18%'}
        />

        <Select
          label="Payment Mode"
          value={paymentMode}
          onChange={setPaymentMode}
          options={[
            { value: 'Razorpay (UPI / Cards)', label: 'Razorpay (UPI / Cards)' },
            { value: 'Net Banking', label: 'Net Banking' },
            { value: 'Bank Wire Transfer', label: 'Bank Wire Transfer' },
            { value: 'Cheque', label: 'Cheque' },
          ]}
        />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
          >
            <Receipt className="w-4 h-4" /> {submitting ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GenerateInvoiceModal;
