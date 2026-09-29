import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Eye, EyeOff, Loader2, BookX } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';
import questionBankService from '../../services/questionBankService';

export const QuestionBankPage = () => {
  const { error: showError } = useNotification();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revealed, setRevealed] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    questionBankService.getQuestions()
      .then((res) => setQuestions(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load question bank', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const toggleReveal = (id) => setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution Approved Question Bank"
        subtitle="Practice verified MCQ, short answer, and essay questions with solution explanations."
      />

      {questions.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <BookX className="w-8 h-8 text-slate-300" /> No practice questions have been published for your course yet.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950">
                  {q.subject?.name}{q.chapter ? ` • ${q.chapter}` : ''}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {q.difficulty}
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{q.questionText}</h3>

              {q.options && Array.isArray(q.options) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                  {q.options.map((opt, idx) => {
                    const isCorrect = revealed[q.id] && opt === q.correctAnswer;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-slate-800 dark:text-slate-200 ${
                          isCorrect
                            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        <span className="font-bold text-indigo-600 mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => toggleReveal(q.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 pt-1"
              >
                {revealed[q.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {revealed[q.id] ? 'Hide Answer' : 'Show Answer & Explanation'}
              </button>

              {revealed[q.id] && (
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl text-xs space-y-1">
                  <p><span className="font-semibold text-slate-700 dark:text-slate-300">Correct Answer:</span> {q.correctAnswer}</p>
                  {q.explanation && <p className="text-slate-600 dark:text-slate-300">{q.explanation}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionBankPage;
