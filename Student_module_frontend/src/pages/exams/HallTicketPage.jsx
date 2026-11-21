import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Loader2, Ticket } from 'lucide-react';
import examService from '../../services/examService';
import HallTicketTemplate from '../../components/print/HallTicketTemplate';

/** The student's own hall ticket for one exam — print, or "Save as PDF" from the print dialog. */
export const HallTicketPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    examService.getHallTicket(examId)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message || 'Could not load your hall ticket'))
      .finally(() => setLoading(false));
  }, [examId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button onClick={() => navigate('/student/exams')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600">
          <ArrowLeft className="w-4 h-4" /> Back to Exam Schedule
        </button>
        {data && (
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center no-print">
          <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hall ticket not available</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
      ) : (
        <HallTicketTemplate exam={data.exam} section={data.section} schedule={data.schedule} student={data.student} />
      )}
    </div>
  );
};

export default HallTicketPage;
