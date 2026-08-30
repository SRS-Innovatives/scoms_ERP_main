import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Calendar as CalendarIcon, PartyPopper, FileSpreadsheet, Wallet, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import eventService from '../../services/eventService';
import examService from '../../services/examService';
import feeService from '../../services/feeService';

const KIND_META = {
  event: { icon: PartyPopper, color: 'text-indigo-500' },
  exam: { icon: FileSpreadsheet, color: 'text-rose-500' },
  fee: { icon: Wallet, color: 'text-amber-500' },
};

export const AcademicCalendarPage = () => {
  const { error: showError } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([eventService.getEvents(), examService.getExamSchedule(), feeService.getFees()])
      .then(([eventsRes, examRes, feesRes]) => {
        const events = (eventsRes.data || []).map((e) => ({
          date: e.eventDate,
          title: e.title,
          subtitle: e.venue,
          kind: 'event',
        }));
        const exams = (examRes.data || []).map((s) => ({
          date: s.examDate,
          title: `${s.exam?.name} — ${s.subject?.name}`,
          subtitle: s.exam?.examType,
          kind: 'exam',
        }));
        const fees = (feesRes.data || [])
          .filter((a) => a.dueAmount > 0 && a.feeStructure?.dueDate)
          .map((a) => ({
            date: a.feeStructure.dueDate,
            title: `Fee Payment Due — ${a.feeStructure.name}`,
            subtitle: `₹${a.dueAmount.toLocaleString()} outstanding`,
            kind: 'fee',
          }));

        const merged = [...events, ...exams, ...fees].sort((a, b) => new Date(a.date) - new Date(b.date));
        setItems(merged);
      })
      .catch((err) => showError(err.message || 'Failed to load calendar', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Academic Calendar" subtitle="Campus events, examination dates, and fee deadlines in one timeline." />

      {items.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <CalendarIcon className="w-8 h-8 text-slate-300" /> Nothing on your calendar yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const meta = KIND_META[item.kind];
            const Icon = meta.icon;
            return (
              <div key={idx} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs">
                <Icon className={`w-5 h-5 ${meta.color} shrink-0`} />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{item.title}</h4>
                  <p className="text-[11px] text-slate-400">
                    {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    {item.subtitle ? ` • ${item.subtitle}` : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AcademicCalendarPage;
