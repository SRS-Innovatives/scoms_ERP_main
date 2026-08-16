import React from 'react';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import ChartCard from '../../components/common/ChartCard';
import StatusBadge from '../../components/common/StatusBadge';
import { mockStudentSubjects } from '../../data/mockStudentData';
import { Clock, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';

export const AttendanceDashboardPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="My Attendance Dashboard" subtitle="Track subject-wise presence, leave logs, and low attendance warnings." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Attendance" value="88.5%" subtitle="Eligible for Exams (>75%)" icon={Clock} color="emerald" badgeText="Pass Criteria Met" />
        <StatCard title="Total Classes Conducted" value="140 Classes" icon={Calendar} color="indigo" />
        <StatCard title="Classes Attended" value="124 Classes" icon={CheckCircle} color="emerald" />
        <StatCard title="Absences / Leaves" value="16 Classes" icon={AlertTriangle} color="amber" />
      </div>

      {/* Low Attendance Warning Banner */}
      <div className="glass-card p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-3 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900 dark:text-amber-200">Attendance Alert Notice</h4>
          <p className="text-amber-800 dark:text-amber-300 mt-0.5">
            Your attendance in <span className="font-bold">CS8404 Software Engineering is 74.0%</span>, which is below the mandatory 75% university eligibility threshold. Attend next 3 classes to regain eligibility.
          </p>
        </div>
      </div>

      <ChartCard title="Monthly Attendance Trend" subtitle="Percentage trajectory across Semester 4" height={200} />

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Subject-wise Attendance Breakdown</h3>
        <div className="space-y-3 text-xs">
          {mockStudentSubjects.map((sub) => (
            <div key={sub.code} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{sub.title} ({sub.code})</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Faculty: {sub.faculty}</p>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <p className={`font-black text-sm ${sub.attendance < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {sub.attendance}%
                  </p>
                  <p className="text-[10px] text-slate-400">Target: &gt;75%</p>
                </div>
                <StatusBadge status={sub.attendance < 75 ? 'Low' : 'Good'} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboardPage;
