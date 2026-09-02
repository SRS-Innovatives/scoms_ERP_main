import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Select from '../common/Select';
import FormInput from '../common/FormInput';
import { useNotification } from '../../context/NotificationContext';
import { Send } from 'lucide-react';
import smsService from '../../services/smsService';
import institutionService from '../../services/institutionService';

export const AllocateSmsCreditsModal = ({ isOpen, onClose, onAllocated, platformBalance, preselectedInstitutionId }) => {
  const { success, error: showError } = useNotification();
  const [institutions, setInstitutions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ institutionId: '', credits: '', note: '' });

  useEffect(() => {
    if (!isOpen) return;
    institutionService.getInstitutions({ limit: 200 })
      .then((res) => setInstitutions(res.data || []))
      .catch((err) => console.error('Failed to load institutions', err));
    setForm((f) => ({ ...f, institutionId: preselectedInstitutionId || '' }));
  }, [isOpen, preselectedInstitutionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.institutionId) {
      showError('Select an institution', 'Missing Field');
      return;
    }
    setSubmitting(true);
    try {
      const res = await smsService.allocateCredits(form);
      success(
        `${Number(form.credits).toLocaleString()} SMS credits allocated. That institution's balance is now ${res.data.institutionWallet.balance.toLocaleString()}.`,
        'Credits Allocated'
      );
      onAllocated && onAllocated();
      onClose();
      setForm({ institutionId: '', credits: '', note: '' });
    } catch (err) {
      showError(err.message || 'Failed to allocate credits', 'Allocation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Allocate SMS Credits to Institution">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-1">
          Enable SMS sending for one institution by granting it credits from the platform pool
          (<span className="font-bold">{(platformBalance ?? 0).toLocaleString()}</span> available). Once its balance hits zero, that institution's SMS sends are blocked automatically.
        </p>

        <Select
          label="Institution"
          required
          value={form.institutionId}
          onChange={(v) => setForm({ ...form, institutionId: v })}
          options={[{ value: '', label: 'Select institution...' }, ...institutions.map((i) => ({ value: i.id, label: `${i.name} (${i.code})` }))]}
        />
        <FormInput label="Credits to Allocate" type="number" required value={form.credits} onChange={(v) => setForm({ ...form, credits: v })} placeholder="e.g. 5000" />
        <FormInput label="Note" value={form.note} onChange={(v) => setForm({ ...form, note: v })} placeholder="Optional — e.g. Q1 2026 allocation" />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {submitting ? 'Allocating...' : 'Allocate Credits'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AllocateSmsCreditsModal;
