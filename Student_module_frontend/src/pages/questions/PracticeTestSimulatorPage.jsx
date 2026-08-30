import React, { useEffect, useState, useMemo } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Clock, ArrowLeft, Trophy, Loader2, BookX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import questionBankService from '../../services/questionBankService';

const QUIZ_SIZE = 10;

// Fisher-Yates shuffle so repeated attempts don't always serve the same order/subset.
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const PracticeTestSimulatorPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();

  const [allQuestions, setAllQuestions] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    questionBankService.getQuestions()
      .then((res) => {
        const mcq = (res.data || []).filter((q) => Array.isArray(q.options) && q.options.length > 0 && q.correctAnswer);
        setAllQuestions(mcq);
        setQuiz(shuffle(mcq).slice(0, QUIZ_SIZE));
        setStartedAt(Date.now());
      })
      .catch((err) => showError(err.message || 'Failed to load practice questions', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  const handleOptionSelect = (opt) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQ]: opt });
  };

  const handleSubmit = () => {
    setElapsedSeconds(startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0);
    setIsSubmitted(true);
    success('Practice test submitted! Performance report generated.', 'Test Complete');
  };

  const handleRetake = () => {
    setQuiz(shuffle(allQuestions).slice(0, QUIZ_SIZE));
    setCurrentQ(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setStartedAt(Date.now());
  };

  const score = useMemo(() => quiz.reduce((sum, q, idx) => sum + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0), 0), [quiz, selectedAnswers]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (quiz.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <button onClick={() => navigate('/student/question-bank')} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <ArrowLeft className="w-4 h-4" /> Back to Question Bank
        </button>
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <BookX className="w-8 h-8 text-slate-300" /> No multiple-choice questions have been published for your course yet.
        </div>
      </div>
    );
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/student/question-bank')} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
        <ArrowLeft className="w-4 h-4" /> Back to Question Bank
      </button>

      {!isSubmitted ? (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Practice Test — {quiz[currentQ]?.subject?.name || 'Mixed'}</h2>
              <p className="text-xs text-slate-500">Question {currentQ + 1} of {quiz.length}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 font-mono font-bold text-xs">
              <Clock className="w-4 h-4" /> Untimed Practice
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Q{currentQ + 1}. {quiz[currentQ].questionText}
            </h3>

            <div className="space-y-2 text-xs">
              {quiz[currentQ].options.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQ] === opt;
                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(opt)}
                    className={`w-full text-left p-4 rounded-2xl border font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              disabled={currentQ === 0}
              onClick={() => setCurrentQ((prev) => prev - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl disabled:opacity-40"
            >
              Previous Question
            </button>

            {currentQ < quiz.length - 1 ? (
              <button
                onClick={() => setCurrentQ((prev) => prev + 1)}
                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
              >
                Submit Practice Test
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Practice Test Result Report</h2>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-xs">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200">
              <p className="text-slate-500 uppercase text-[10px]">Score</p>
              <p className="text-2xl font-black text-emerald-600">{score} / {quiz.length}</p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200">
              <p className="text-slate-500 uppercase text-[10px]">Percentage</p>
              <p className="text-2xl font-black text-indigo-600">{((score / quiz.length) * 100).toFixed(0)}%</p>
            </div>
            <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200">
              <p className="text-slate-500 uppercase text-[10px]">Time Taken</p>
              <p className="text-2xl font-black text-sky-600">{minutes}m {seconds}s</p>
            </div>
          </div>

          <button onClick={handleRetake} className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl">
            Retake Practice Test
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeTestSimulatorPage;
