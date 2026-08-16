import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';

export const GrievancePage = () => {
  const { success } = useNotification();
  const [complaint, setComplaint] = useState('');

  const grievances = [
    { id: "GRV-901", category: "Infrastructure", subject: "CS Lab 2 Projector HDMI Port Damage", date: "2026-08-01", status: "Resolved", resolution: "Projector replaced on Aug 3rd" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    success('Confidential grievance logged to Student Cell.', 'Grievance Registered');
    setComplaint('');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Confidential Student Grievances & Support" subtitle="Log complaints regarding academics, ragging protection, or campus facilities." />

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Submit New Grievance</h3>
        <textarea
          rows={3}
          required
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          placeholder="Describe issue confidentially..."
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl"
        ></textarea>
        <button type="submit" className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-xl">Submit Ticket</button>
      </form>

      <div className="space-y-3">
        {grievances.map((g) => (
          <div key={g.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">{g.subject}</h4>
              <p className="text-[11px] text-slate-500">{g.category} • {g.resolution}</p>
            </div>
            <StatusBadge status={g.status} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrievancePage;
