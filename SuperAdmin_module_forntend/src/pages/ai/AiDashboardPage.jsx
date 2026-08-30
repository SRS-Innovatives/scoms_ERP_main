import React, { useEffect, useState } from 'react';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import { Bot, Cpu, DollarSign, Layers, Loader2 } from 'lucide-react';
import aiService from '../../services/aiService';

export const AiDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiService.getAiUsage()
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="AI Assistant & Token Cost Administration" subtitle="Monitor AI usage and token cost across every institution's question generators and AI assistants." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total AI Tokens Used" value={`${(stats?.totalTokens || 0).toLocaleString()} Tokens`} icon={Cpu} color="indigo" />
        <StatCard title="Total AI Cost" value={`$${(stats?.totalCostUSD || 0).toFixed(2)} USD`} icon={DollarSign} color="emerald" />
        <StatCard title="Total AI Requests" value={(stats?.totalRequests || 0).toLocaleString()} icon={Bot} color="purple" />
        <StatCard title="Active AI Modules" value={`${stats?.activeModules?.length || 0} Modules`} subtitle={stats?.activeModules?.join(', ') || 'None yet'} icon={Layers} color="sky" />
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2">Primary Provider</h3>
        <p className="text-slate-500">{stats?.provider || 'No usage recorded yet'}</p>
      </div>
    </div>
  );
};

export default AiDashboardPage;
