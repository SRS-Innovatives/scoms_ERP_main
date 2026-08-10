import React, { useState } from 'react';
import FormInput from '../../components/common/FormInput';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export const CreatePlanPage = () => {
  const { success } = useNotification();
  const navigate = useNavigate();

  const [planName, setPlanName] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [maxStudents, setMaxStudents] = useState('2500');

  const handleSubmit = (e) => {
    e.preventDefault();
    success(`Subscription plan "${planName}" created!`, 'Plan Created');
    navigate('/super-admin/plans');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Custom Subscription Tier Plan</h2>

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <FormInput label="Plan Name" required value={planName} onChange={setPlanName} placeholder="e.g. University Scale Tier" />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Monthly Price (₹)" required value={monthlyPrice} onChange={setMonthlyPrice} placeholder="8999" />
          <FormInput label="Yearly Price (₹)" required value={yearlyPrice} onChange={setYearlyPrice} placeholder="89990" />
        </div>
        <FormInput label="Max Student Limit" required value={maxStudents} onChange={setMaxStudents} />

        <div className="flex justify-end gap-2 pt-4 border-t">
          <button type="button" onClick={() => navigate('/super-admin/plans')} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs">
            Save Plan Tier
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePlanPage;
