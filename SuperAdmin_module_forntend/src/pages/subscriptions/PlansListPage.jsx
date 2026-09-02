import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/modals/Modal';
import FormInput from '../../components/common/FormInput';
import { useNotification } from '../../context/NotificationContext';
import { Edit, Users, Briefcase, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import subscriptionService from '../../services/subscriptionService';

export const PlansListPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    subscriptionService.getPlans()
      .then((res) => setPlans(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load plans', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (plan) => {
    setEditing(plan);
    setForm({ name: plan.name, priceMonthly: plan.priceMonthly, priceYearly: plan.priceYearly, maxStudents: plan.maxStudents, maxStaff: plan.maxStaff });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await subscriptionService.updatePlan(editing.id, form);
      success(`Plan configuration saved for ${form.name}`, 'Plan Updated');
      setEditing(null);
      load();
    } catch (err) {
      showError(err.message || 'Failed to update plan', 'Update Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Tier Plans & Limits"
        subtitle="Manage SCOMS platform SaaS pricing tiers and feature limits."
        actionLabel="Create New Plan"
        onAction={() => navigate('/super-admin/plans/new')}
      />

      {plans.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No subscription plans defined yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-xl transition-all">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {plan.name}
                  </span>
                  <button onClick={() => openEdit(plan)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">₹{plan.priceYearly.toLocaleString()}</span>
                  <span className="text-xs text-slate-500"> / year</span>
                  <p className="text-[11px] text-slate-400">₹{plan.priceMonthly.toLocaleString()} / month</p>
                </div>

                <div className="space-y-2 py-3 border-t border-b border-slate-200 dark:border-slate-800 text-xs">
                  <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Users className="w-4 h-4 text-indigo-500 shrink-0" /> Up to <span className="font-bold">{plan.maxStudents.toLocaleString()}</span> Students
                  </p>
                  <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Briefcase className="w-4 h-4 text-indigo-500 shrink-0" /> Up to <span className="font-bold">{plan.maxStaff.toLocaleString()}</span> Staff
                  </p>
                </div>
              </div>

              <button
                onClick={() => openEdit(plan)}
                className="mt-6 w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
              >
                Configure Limits
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title={`Configure: ${editing?.name}`}>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <FormInput label="Plan Name" required value={form.name || ''} onChange={(v) => setForm({ ...form, name: v })} />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Monthly Price (₹)" type="number" required value={form.priceMonthly || ''} onChange={(v) => setForm({ ...form, priceMonthly: v })} />
            <FormInput label="Yearly Price (₹)" type="number" required value={form.priceYearly || ''} onChange={(v) => setForm({ ...form, priceYearly: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Max Students" type="number" required value={form.maxStudents || ''} onChange={(v) => setForm({ ...form, maxStudents: v })} />
            <FormInput label="Max Staff" type="number" required value={form.maxStaff || ''} onChange={(v) => setForm({ ...form, maxStaff: v })} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlansListPage;
