import React, { useState } from 'react';
import Modal from './Modal';
import Select from '../common/Select';
import FormInput from '../common/FormInput';
import { useNotification } from '../../context/NotificationContext';
import { ShoppingCart } from 'lucide-react';
import whatsappService from '../../services/whatsappService';

export const PurchaseWhatsappCreditsModal = ({ isOpen, onClose, onPurchased }) => {
  const { success, error: showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ provider: 'Meta WABA', credits: '', amountINR: '', reference: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await whatsappService.purchaseCredits(form);
      success(
        `${Number(form.credits).toLocaleString()} WhatsApp credits purchased from ${form.provider}. Platform balance: ${res.data.wallet.balance.toLocaleString()}.`,
        'Purchase Recorded'
      );
      onPurchased && onPurchased();
      onClose();
      setForm({ provider: 'Meta WABA', credits: '', amountINR: '', reference: '' });
    } catch (err) {
      showError(err.message || 'Failed to record purchase', 'Purchase Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Purchase WhatsApp Credits">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-1">
          Record a conversation-credit top-up from Meta or your BSP. This adds to the platform-wide pool, which you then allocate to individual institutions below.
        </p>

        <Select
          label="Provider"
          required
          value={form.provider}
          onChange={(v) => setForm({ ...form, provider: v })}
          options={[
            { value: 'Meta WABA', label: 'Meta WhatsApp Business API (Direct)' },
            { value: 'Gupshup', label: 'Gupshup' },
            { value: 'Twilio WhatsApp', label: 'Twilio WhatsApp' },
            { value: 'Other', label: 'Other' },
          ]}
        />
        <FormInput label="Credits (Conversations) Purchased" type="number" required value={form.credits} onChange={(v) => setForm({ ...form, credits: v })} placeholder="e.g. 20000" />
        <FormInput label="Amount Paid (₹)" type="number" required value={form.amountINR} onChange={(v) => setForm({ ...form, amountINR: v })} placeholder="e.g. 12000" />
        <FormInput label="Vendor Invoice / Transaction Reference" value={form.reference} onChange={(v) => setForm({ ...form, reference: v })} placeholder="Optional" />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" /> {submitting ? 'Recording...' : 'Record Purchase'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PurchaseWhatsappCreditsModal;
