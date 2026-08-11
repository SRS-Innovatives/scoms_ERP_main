import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Award, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const ScholarshipsPage = () => {
  const { success } = useNotification();

  const scholarships = [
    { id: "SCH-01", name: "Merit-cum-Means Post Metric Scholarship", provider: "Government of Tamil Nadu", amount: 15000, status: "Approved", statusMessage: "Amount credited to college fee account" },
    { id: "SCH-02", name: "SCOMS Academic Excellence Waiver", provider: "Sri Lakshmi College Management", amount: 10000, status: "Eligible", statusMessage: "Apply before 31st August" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Scholarships & Financial Aid" subtitle="Government and Institutional fee concession programs." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scholarships.map((sch) => (
          <div key={sch.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{sch.name}</h3>
                  <p className="text-xs text-slate-500">{sch.provider}</p>
                </div>
              </div>
              <StatusBadge status={sch.status} />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center text-xs">
              <span className="text-slate-500">Concession Value:</span>
              <span className="font-bold text-emerald-600 text-sm">₹{sch.amount.toLocaleString()}</span>
            </div>

            {sch.status === 'Eligible' && (
              <button
                onClick={() => success(`Application submitted for ${sch.name}`, 'Application Submitted')}
                className="w-full py-2 font-bold text-white bg-indigo-600 rounded-xl text-xs"
              >
                Apply Scholarship Now
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScholarshipsPage;
