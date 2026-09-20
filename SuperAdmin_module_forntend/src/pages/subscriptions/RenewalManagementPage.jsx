import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { CalendarRange, ShieldAlert, CreditCard, Clock, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import subscriptionService from '../../services/subscriptionService';
import ErrorState from '../../components/common/ErrorState';

export const RenewalManagementPage = () => {
  const { success, error: showError } = useNotification();
  const [subscriptions, setSubscriptions] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    subscriptionService.getRenewals()
      .then((res) => {
        setSubscriptions(res.data?.subscriptions || []);
        setKpis(res.data?.kpis || null);
      })
      .catch((err) => { showError(err.message || 'Failed to load renewals', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleRemind = async (sub) => {
    setSending(sub.id);
    try {
      const res = await subscriptionService.sendRenewalReminder(sub.id);
      if (res.data?.sent) {
        success(`Renewal reminder email sent to ${sub.institution?.name}.`, 'Reminder Sent');
      } else {
        showError('Email delivery was blocked (credit limit reached).', 'Reminder Not Sent');
      }
    } catch (err) {
      showError(err.message || 'Failed to send reminder', 'Send Failed');
    } finally {
      setSending(null);
    }
  };

  const columns = [
    { header: 'Institution Name', key: 'institution', sortable: false, render: (val) => <span className="font-bold text-slate-800 dark:text-slate-200">{val?.name}</span> },
    { header: 'Subscription Plan', key: 'plan', sortable: false, render: (val) => <span className="font-semibold text-indigo-600 dark:text-indigo-400">{val?.name}</span> },
    { header: 'Expiry Date', key: 'endDate', render: (val) => <span className="font-mono text-xs">{new Date(val).toLocaleDateString()}</span> },
    {
      header: 'Time Remaining',
      key: 'daysLeft',
      render: (val) => (
        <span className={`font-bold ${val === 0 ? 'text-rose-600' : val <= 30 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
          {val === 0 ? 'Expired' : `${val} Days Remaining`}
        </span>
      )
    },
    {
      header: 'Renewal Status',
      key: 'renewalStatus',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'Active' ? 'bg-emerald-50 text-emerald-700' : val === 'Expiring Soon' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
          {val}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (_id, row) => (
        <button
          disabled={row.renewalStatus === 'Active' || sending === row.id}
          onClick={() => handleRemind(row)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all ${row.renewalStatus === 'Active' ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-50`}
        >
          {sending === row.id ? 'Sending...' : 'Dispatch Reminder'}
        </button>
      )
    }
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="Subscription Renewals & Retention" subtitle="Monitor contract expiry schedules and dispatch real renewal reminder emails." />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="Total Subscribers" value={`${kpis?.totalSubscribers ?? 0} accounts`} subtitle="SaaS contracts on record" icon={CreditCard} color="indigo" />
        <StatCard title="Expiring (30 Days)" value={`${kpis?.expiringSoon ?? 0} accounts`} subtitle="Awaiting renewal cycle" icon={Clock} color="amber" />
        <StatCard title="Expired Accounts" value={`${kpis?.expired ?? 0} accounts`} subtitle="Past their renewal date" icon={ShieldAlert} color="rose" />
        <StatCard title="Active Subscriptions" value={`${kpis?.active ?? 0} accounts`} subtitle="In good standing" icon={CalendarRange} color="emerald" />
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Subscription Renewals Calendar</h3>
        {subscriptions.length === 0 ? (
          <p className="text-slate-400 text-center py-6">No subscriptions recorded yet.</p>
        ) : (
          <DataTable columns={columns} data={subscriptions} />
        )}
      </div>
    </div>
  );
};

export default RenewalManagementPage;
