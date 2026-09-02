import React, { useState, useEffect } from 'react';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Clock, AlertTriangle, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import attendanceService from '../../services/attendanceService';

export const AttendanceDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    attendanceService.getAttendance()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message || 'Failed to load attendance'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <div className="glass-card p-8 rounded-3xl border border-rose-200 dark:border-rose-900 text-center text-xs text-rose-600 dark:text-rose-400">{error}</div>;
  }

  const lowSubjects = (data.subjectBreakdown || []).filter((s) => s.percentage < 75);

  return (
    <div className="space-y-6">
      <PageHeader title="My Attendance Dashboard" subtitle="Track subject-wise presence and low attendance warnings." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${data.percentage}%`}
          subtitle={data.percentage >= 75 ? 'Eligible for Exams (>75%)' : 'Below eligibility threshold'}
          icon={Clock}
          color={data.percentage >= 75 ? 'emerald' : 'rose'}
          badgeText={data.percentage >= 75 ? 'Pass Criteria Met' : 'At Risk'}
        />
        <StatCard title="Total Classes Conducted" value={`${data.totalClasses} Classes`} icon={Calendar} color="indigo" />
        <StatCard title="Classes Attended" value={`${data.presentCount} Classes`} icon={CheckCircle} color="emerald" />
        <StatCard title="Absences" value={`${data.absentCount} Classes`} icon={AlertTriangle} color="amber" />
      </div>

      {lowSubjects.length > 0 && (
        <div className="glass-card p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-200">Attendance Alert Notice</h4>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5">
              Your attendance in <span className="font-bold">{lowSubjects.map((s) => `${s.subject} (${s.percentage}%)`).join(', ')}</span> is below the 75% eligibility threshold.
            </p>
          </div>
        </div>
      )}

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Subject-wise Attendance Breakdown</h3>
        {(data.subjectBreakdown || []).length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No attendance recorded yet.</p>
        ) : (
          <div className="space-y-3 text-xs">
            {data.subjectBreakdown.map((sub) => (
              <div key={sub.subject} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{sub.subject}</h4>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className={`font-black text-sm ${sub.percentage < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>{sub.percentage}%</p>
                    <p className="text-[10px] text-slate-400">{sub.present}/{sub.total} classes</p>
                  </div>
                  <StatusBadge status={sub.percentage < 75 ? 'Low' : 'Good'} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceDashboardPage;
