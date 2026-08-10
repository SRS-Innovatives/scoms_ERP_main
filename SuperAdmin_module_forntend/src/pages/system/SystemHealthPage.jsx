import React from 'react';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import { Activity, Server, Database, HardDrive, ShieldCheck } from 'lucide-react';

export const SystemHealthPage = () => {
  const services = [
    { name: "REST API Cluster (Asia-South1 Mumbai)", status: "Healthy", uptime: "99.99%", latency: "42ms" },
    { name: "PostgreSQL Multi-Tenant DB Primary", status: "Healthy", uptime: "99.98%", latency: "8ms" },
    { name: "Redis Cache Service", status: "Healthy", uptime: "100.0%", latency: "2ms" },
    { name: "DLT SMS Gateway Relay", status: "Healthy", uptime: "99.95%", latency: "120ms" },
    { name: "Meta WhatsApp Webhook Processor", status: "Healthy", uptime: "99.97%", latency: "85ms" },
    { name: "Razorpay Payment Gateway API", status: "Healthy", uptime: "99.99%", latency: "110ms" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Real-Time System Health & Service Status" subtitle="Live performance metrics, API response latencies, and server cluster uptimes." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Platform Status" value="Operational" icon={ShieldCheck} color="emerald" badgeText="100%" />
        <StatCard title="Avg API Latency" value="42ms" icon={Activity} color="indigo" />
        <StatCard title="Database Connections" value="124 / 500" icon={Database} color="sky" />
        <StatCard title="Cluster Memory Load" value="38%" icon={Server} color="purple" />
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Service Infrastructure Roster</h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {services.map((s, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{s.name}</p>
                <p className="text-[11px] text-slate-500">Latency: {s.latency}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{s.uptime} Uptime</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-bold text-xs">
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPage;
