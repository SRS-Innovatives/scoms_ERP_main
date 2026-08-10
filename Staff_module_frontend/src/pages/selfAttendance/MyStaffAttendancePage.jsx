import React from 'react';
import { ShieldCheck, Calendar, CheckCircle } from 'lucide-react';

export const MyStaffAttendancePage = () => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> My Attendance Log & Calendar Heatmap
          </h3>
          <p className="text-xs text-slate-500">Biometric Punch In / Punch Out Records • August 2026</p>
        </div>
        <div className="text-right text-xs">
          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg">96.8%</span>
          <p className="text-slate-400">Monthly Punctuality Rate</p>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Attendance Heatmap Grid</h4>
        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="font-bold text-slate-400 text-[11px] py-1">{d}</div>
          ))}

          {days.map(day => {
            const isWeekend = day % 7 === 0 || day % 7 === 1;
            const isAbsent = day === 14;
            const isLate = day === 8;

            return (
              <div
                key={day}
                className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  isWeekend
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                    : isAbsent
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 border-rose-200'
                    : isLate
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 border-amber-200'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200'
                }`}
              >
                <span>{day}</span>
                <span className="text-[9px] font-normal mt-0.5 opacity-80">
                  {isWeekend ? 'Off' : isAbsent ? 'Leave' : isLate ? '08:42 AM' : '08:25 AM'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyStaffAttendancePage;
