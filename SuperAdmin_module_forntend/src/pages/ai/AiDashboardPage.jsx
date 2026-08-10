import React from 'react';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import { Bot, Cpu, DollarSign, Zap } from 'lucide-react';

export const AiDashboardPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Assistant & Token Cost Administration" subtitle="Monitor OpenAI GPT-4o & Google Gemini 1.5 Pro usage across question generators and AI assistants." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total AI Tokens Used" value="14.5M Tokens" icon={Cpu} color="indigo" />
        <StatCard title="Total AI Cost" value="$145.20 USD" icon={DollarSign} color="emerald" />
        <StatCard title="Active AI Modules" value="3 Modules" icon={Bot} color="purple" />
        <StatCard title="Avg Token Latency" value="340ms" icon={Zap} color="sky" />
      </div>
    </div>
  );
};

export default AiDashboardPage;
