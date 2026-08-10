import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { mockPlans } from '../../data/mockSubscriptionsData';
import { useNotification } from '../../context/NotificationContext';
import { Check, Edit, Plus, Users, HardDrive, MessageSquare, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PlansListPage = () => {
  const navigate = useNavigate();
  const { success } = useNotification();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Tier Plans & Limits"
        subtitle="Manage SCOMS platform SaaS pricing tiers, feature limits, and quota allocations."
        actionLabel="Create New Plan"
        onAction={() => navigate('/super-admin/plans/new')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockPlans.map((plan) => (
          <div key={plan.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-xl transition-all">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {plan.name}
                </span>
                <button
                  onClick={() => success(`Edit modal opened for ${plan.name}`, 'Edit Tier')}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
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
                  <HardDrive className="w-4 h-4 text-indigo-500 shrink-0" /> <span className="font-bold">{plan.storageGB} GB</span> Storage
                </p>
                <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0" /> <span className="font-bold">{plan.smsCredits.toLocaleString()}</span> SMS Credits
                </p>
                <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Bot className="w-4 h-4 text-indigo-500 shrink-0" /> <span className="font-bold">{plan.aiCredits.toLocaleString()}</span> AI Credits
                </p>
              </div>

              <div className="mt-4 space-y-1.5 text-[11px]">
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => success(`Plan configuration saved for ${plan.name}`, 'Plan Updated')}
              className="mt-6 w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
            >
              Configure Limits
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlansListPage;
