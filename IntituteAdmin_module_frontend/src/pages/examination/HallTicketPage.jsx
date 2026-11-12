import React, { useState, useEffect } from 'react';
import HallTicketTemplate from '../../components/print/HallTicketTemplate';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useAcademic } from '../../context/InstitutionContext';
import examService from '../../services/examService';
import sectionService from '../../services/sectionService';
import { Printer, Loader2, Ticket } from 'lucide-react';

/** Hall tickets for every active student of a class/section, for the chosen exam. */
export const HallTicketPage = () => {
  const academic = useAcademic();
  const { notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [sections, setSections] = useState([]);
  const [examId, setExamId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    examService.getExams().then((res) => { setExams(res.data || []); if (res.data?.length) setExamId(res.data[0].id); }).catch(() => {});
    sectionService.getAll().then((res) => setSections(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!examId || !sectionId) { setData(null); return; }
    setLoading(true);
    examService.getHallTickets(examId, sectionId)
      .then((res) => setData(res.data))
      .catch((err) => { notifyError(`Failed to load hall tickets: ${err.message}`); setData(null); })
      .finally(() => setLoading(false));
  }, [examId, sectionId, notifyError]);

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hall Ticket Generator</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">One ticket per student with their {academic.label('course').toLowerCase()}'s exam schedule — print all at once</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 text-xs no-print">
        <div>
          <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Exam</label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">{academic.label('course')} / {academic.label('section')}</label>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
            <option value="">Select...</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{[s.semester?.course?.name, s.name].filter(Boolean).join(' - ')}</option>)}
          </select>
        </div>
        <button onClick={() => window.print()} disabled={!data?.students?.length} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50">
          <Printer className="w-4 h-4" /> Print {data?.students?.length ? `${data.students.length} Tickets` : 'Tickets'}
        </button>
      </div>

      {!exams.length ? (
        <EmptyState icon={Ticket} title="No exams yet" description="Create an exam and its schedule under Examination first." />
      ) : !sectionId ? (
        <EmptyState icon={Ticket} title={`Choose a ${academic.label('section').toLowerCase()}`} description="Hall tickets are generated for every active student in it." />
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : data && data.students.length === 0 ? (
        <EmptyState icon={Ticket} title="No active students" description={`This ${academic.label('section').toLowerCase()} has no active students.`} />
      ) : data && (
        <div className="space-y-6">
          {data.schedule.length === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 no-print">This exam has no subjects scheduled for this {academic.label('course').toLowerCase()} yet — tickets will show an empty timetable.</p>
          )}
          {data.students.map((st) => (
            <HallTicketTemplate key={st.id} exam={data.exam} section={data.section} schedule={data.schedule} student={st} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HallTicketPage;
