import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { ShieldCheck, ShieldAlert, LogIn, Percent, Loader2 } from 'lucide-react';
import securityService from '../../services/securityService';

export const SecurityCenterPage = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    securityService.getOverview()
      .then((res) => setOverview(res.data))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Outcome', key: 'action', render: (val) => (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'LOGIN_SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
        {val === 'LOGIN_SUCCESS' ? 'Success' : 'Failed'}
      </span>
    ) },
    { header: 'Account', key: 'user', sortable: false, render: (val, row) => val?.email || row.entityId || 'Unknown' },
    { header: 'Role', key: 'user', sortable: false, render: (val) => val?.role || '—' },
    { header: 'Institution', key: 'institution', sortable: false, render: (val) => val?.name || '—' },
    { header: 'IP Address', key: 'ipAddress', render: (val) => <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-xs">{val || '—'}</code> },
    { header: 'Timestamp', key: 'createdAt', render: (val) => <span className="font-mono text-xs text-slate-500">{new Date(val).toLocaleString()}</span> }
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="Security Center — Login Activity" subtitle="Real login attempts across every portal, logged the moment they happen." />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="Login Attempts Today" value={overview?.totalAttemptsToday ?? 0} subtitle="Across all 4 portals" icon={LogIn} color="indigo" />
        <StatCard title="Successful Logins" value={overview?.successToday ?? 0} subtitle="Today" icon={ShieldCheck} color="emerald" />
        <StatCard title="Failed Attempts" value={overview?.failedToday ?? 0} subtitle="Today" icon={ShieldAlert} color="rose" />
        <StatCard title="Failure Rate" value={`${overview?.failureRate ?? 0}%`} subtitle="Of today's attempts" icon={Percent} color="amber" />
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Recent Login Activity</h3>
        {(overview?.recentLogins || []).length === 0 ? (
          <p className="text-slate-400 text-center py-6">No login activity recorded yet.</p>
        ) : (
          <DataTable columns={columns} data={overview.recentLogins} />
        )}
      </div>

      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
        This platform has no firewall/WAF or SSL-monitoring infrastructure, so threat-blocking, MFA enrollment, and certificate-status widgets shown in earlier versions of this page have been removed rather than shown with fabricated numbers.
      </div>
    </div>
  );
};

export default SecurityCenterPage;
