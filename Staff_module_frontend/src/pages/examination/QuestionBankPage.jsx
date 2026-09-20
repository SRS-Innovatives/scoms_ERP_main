import React, { useEffect, useState } from 'react';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

const TYPE_FILTERS = [
  { value: 'All', label: 'All Question Types' },
  { value: 'MCQ', label: 'MCQ' },
  { value: 'MULTIPLE_CORRECT', label: 'Multiple Correct' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'FILL_BLANK', label: 'Fill in the Blank' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_ANSWER', label: 'Long Answer' },
];

export const QuestionBankPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    examService.getQuestions()
      .then((res) => setQuestions(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load question bank', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = questions.filter((q) => {
    const matchSearch = q.questionText.toLowerCase().includes(search.toLowerCase()) || (q.chapter || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || q.type === filterType;
    return matchSearch && matchType;
  });

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Question Bank Repository</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Questions for the subjects you are assigned to teach.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/staff/exams/generator')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-sky-700 bg-sky-50 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl"
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> Paper Generator
          </button>
          <button
            onClick={() => navigate('/staff/exams/create-q')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search questions by keyword or chapter..."
        filterOptions={TYPE_FILTERS}
        filterValue={filterType}
        onFilterChange={setFilterType}
      />

      {questions.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No questions in your bank yet. Add your first question to get started.
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No questions match your search/filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q) => (
            <div key={q.id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                    {q.subject?.name} {q.chapter ? `• ${q.chapter}` : ''}
                  </span>
                  {q.topic && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      Topic: {q.topic}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    Diff: {q.difficulty}
                  </span>
                </div>

                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {q.type} • {q.marks} Marks
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed mt-2">
                {q.questionText}
              </p>

              {Array.isArray(q.options) && q.options.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  {q.options.map((opt, idx) => (
                    <div key={idx} className={`p-2 rounded-lg border ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      {String.fromCharCode(65 + idx)}. {opt}
                    </div>
                  ))}
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
