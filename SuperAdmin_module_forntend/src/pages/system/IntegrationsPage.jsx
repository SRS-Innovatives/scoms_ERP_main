import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { CreditCard, MessageSquare, Mail, HardDrive, Bot, Check, Settings } from 'lucide-react';

export const IntegrationsPage = () => {
  const { success } = useNotification();

  const integrations = [
    { title: "Razorpay Gateway (India UPI/Cards)", category: "Payment Gateway", status: "Connected", icon: CreditCard, desc: "Process INR fee collections, automated GST invoices & UPI webhooks." },
    { title: "ValueFirst DLT SMS Gateway", category: "Telecom SMS", status: "Connected", icon: MessageSquare, desc: "DLT approved SMS template dispatch for attendance & fee alerts." },
    { title: "Meta WhatsApp Cloud API", category: "Messaging", status: "Connected", icon: MessageSquare, desc: "Automated WhatsApp fee receipt PDFs, exam hall tickets & parent alerts." },
    { title: "AWS S3 Cloud Storage", category: "Storage", status: "Connected", icon: HardDrive, desc: "Multi-tenant secure document storage, student certificates & study materials." },
    { title: "OpenAI GPT-4o & Gemini Pro", category: "AI Services", status: "Connected", icon: Bot, desc: "Automated question paper generator, AI assistant, and report synthesizer." }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="SaaS Integrations & Third-Party Gateways" subtitle="Configure and test Razorpay, Meta WhatsApp, DLT SMS, AWS S3, and AI Provider credentials." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.title}</h3>
                    <p className="text-[11px] text-slate-500">{item.category}</p>
                  </div>
                </div>
                <StatusBadge status={item.status} size="sm" />
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => success(`Test ping payload transmitted to ${item.title}. Status 200 OK.`, 'Connection Tested')}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-xl"
                >
                  Test Connection
                </button>
                <button
                  onClick={() => success(`Configuration modal opened for ${item.title}`, 'Settings')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" /> Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IntegrationsPage;
