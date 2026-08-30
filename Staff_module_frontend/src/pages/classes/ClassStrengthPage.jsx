import React, { useEffect, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useNotification } from '../../context/NotificationContext';

export const ClassStrengthPage = () => {
  const { error: showError } = useNotification();
  const [strengths, setStrengths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceService.getMyClasses()
      .then(async (res) => {
        const mappings = res.data || [];
        const rows = await Promise.all(mappings.map(async (m) => {
          try {
            const rosterRes = await attendanceService.getRoster(m.section.id);
            const roster = rosterRes.data || [];
            const boys = roster.filter((s) => s.gender === 'MALE').length;
            const girls = roster.filter((s) => s.gender === 'FEMALE').length;
            const withAttendance = roster.filter((s) => s.attendancePercent !== null);
            const avgAttendance = withAttendance.length > 0
              ? `${Math.round(withAttendance.reduce((sum, s) => sum + s.attendancePercent, 0) / withAttendance.length)}%`
              : 'No data yet';
            return {
              id: m.id,
              class: `${m.section?.semester?.course?.name || ''} — ${m.section?.name}`,
              boys,
              girls,
              total: roster.length,
              avgAttendance,
            };
          } catch {
            return null;
          }
        }));
        setStrengths(rows.filter(Boolean));
      })
      .catch((err) => showError(err.message || 'Failed to load class strength', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-500" /> Class Strength & Demographics Summary
      </h3>

      {strengths.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">No assigned classes yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strengths.map((s) => (
            <div key={s.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">{s.class}</h4>
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between"><span>Total Strength:</span><span className="font-bold">{s.total}</span></div>
                <div className="flex justify-between"><span>Boys:</span><span>{s.boys}</span></div>
                <div className="flex justify-between"><span>Girls:</span><span>{s.girls}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-semibold text-sky-600 dark:text-sky-400">
                  <span>Avg Attendance:</span><span>{s.avgAttendance}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassStrengthPage;
