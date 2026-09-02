import React, { useEffect, useState, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { FlaskConical, Plus, Loader2, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import labService from '../../services/labService';

const emptyForm = { assetTag: '', name: '', location: '', quantity: 1, condition: 'GOOD', calibrationDueDate: '' };

export const LabInventoryPage = () => {
  const { success, error: showError } = useNotification();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(() => {
    setLoading(true);
    labService.getAssets()
      .then((res) => setAssets(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load lab register', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await labService.createAsset(form);
      success(`"${form.name}" added to the lab register.`, 'Equipment Added');
      setForm(emptyForm);
      setFormOpen(false);
      load();
    } catch (err) {
      showError(err.message || 'Failed to add equipment', 'Add Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-500" /> Laboratory Asset & Equipment Register
          </h3>
          <p className="text-xs text-slate-500">Track equipment count, working condition, and calibration due dates.</p>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl"
        >
          {formOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {formOpen ? 'Cancel' : 'Add Equipment'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <input required placeholder="Asset Tag (e.g. LAB-PHY-001)" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
          <input required placeholder="Equipment Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
          <input placeholder="Location (e.g. Physics Lab 2)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
          <input type="number" min={1} placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
          <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            <option value="GOOD">Good</option>
            <option value="NEEDS_REPAIR">Needs Repair</option>
            <option value="DAMAGED">Damaged</option>
          </select>
          <input type="date" placeholder="Calibration Due" value={form.calibrationDueDate} onChange={(e) => setForm({ ...form, calibrationDueDate: e.target.value })} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
          <button type="submit" disabled={submitting} className="sm:col-span-3 py-2 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl disabled:opacity-50">
            {submitting ? 'Adding...' : 'Add to Register'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>
      ) : assets.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-500">No lab equipment registered yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Asset Tag</th>
                <th className="p-3">Equipment Name</th>
                <th className="p-3">Location</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Calibration Due</th>
                <th className="p-3 text-right">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {assets.map((eq) => (
                <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-mono font-bold">{eq.assetTag}</td>
                  <td className="p-3 font-semibold">{eq.name}</td>
                  <td className="p-3 text-slate-500">{eq.location || '—'}</td>
                  <td className="p-3 font-bold">{eq.quantity}</td>
                  <td className="p-3 text-slate-500">{eq.calibrationDueDate ? new Date(eq.calibrationDueDate).toLocaleDateString() : '—'}</td>
                  <td className="p-3 text-right"><StatusBadge status={eq.condition} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LabInventoryPage;
