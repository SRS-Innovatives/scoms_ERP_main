import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Briefcase, Building } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const InternshipsPage = () => {
  const { success } = useNotification();

  const internships = [
    { id: "INT-01", title: "Frontend Developer Intern", company: "ZOHO Corporation", stipend: "₹18,000 / month", location: "Chennai (Onsite)", status: "Open" },
    { id: "INT-02", title: "Python Backend Trainee", company: "Freshworks Inc", stipend: "₹15,000 / month", location: "Remote", status: "Open" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Campus Internships & Training" subtitle="Apply for verified corporate internships with stipend benefits." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {internships.map((item) => (
          <div key={item.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="text-xs text-slate-500">{item.company} • {item.location}</p>
              </div>
              <StatusBadge status={item.status} size="sm" />
            </div>

            <p className="font-bold text-xs text-emerald-600">Stipend: {item.stipend}</p>

            <button
              onClick={() => success(`Applied for ${item.title} at ${item.company}`, 'Application Sent')}
              className="w-full py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl"
            >
              Submit Application
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternshipsPage;
