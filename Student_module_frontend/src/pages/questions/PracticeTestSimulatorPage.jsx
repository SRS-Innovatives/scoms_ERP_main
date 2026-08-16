import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Clock, CheckCircle2, XCircle, ArrowLeft, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PracticeTestSimulatorPage = () => {
  const navigate = useNavigate();
  const { success } = useNotification();

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const questions = [
    { id: 1, text: "Which CPU scheduling algorithm guarantees minimum average waiting time?", options: ["FCFS", "SJF (Shortest Job First)", "Round Robin", "Priority Scheduling"], correct: 1 },
    { id: 2, text: "Which normal form deals with removing transitive dependencies?", options: ["1NF", "2NF", "3NF", "BCNF"], correct: 2 },
    { id: 3, text: "In React, what hook is primarily used for handling component side-effects?", options: ["useState", "useEffect", "useMemo", "useCallback"], correct: 1 }
  ];

  const handleOptionSelect = (optIdx) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQ]: optIdx });
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    success('Practice test submitted! Performance report generated.', 'Test Complete');
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) score++;
    });
    return score;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/student/question-bank')} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
        <ArrowLeft className="w-4 h-4" /> Back to Question Bank
      </button>

      {!isSubmitted ? (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Semester 4 Computer Science Practice Test</h2>
              <p className="text-xs text-slate-500">Question {currentQ + 1} of {questions.length}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 font-mono font-bold text-xs">
              <Clock className="w-4 h-4" /> 14:32 Left
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Q{currentQ + 1}. {questions[currentQ].text}
            </h3>

            <div className="space-y-2 text-xs">
              {questions[currentQ].options.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQ] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
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
              onClick={() => setCurrentQ(prev => prev - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl disabled:opacity-40"
            >
              Previous Question
            </button>

            {currentQ < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ(prev => prev + 1)}
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
              <p className="text-2xl font-black text-emerald-600">{calculateScore()} / {questions.length}</p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200">
              <p className="text-slate-500 uppercase text-[10px]">Percentage</p>
              <p className="text-2xl font-black text-indigo-600">{((calculateScore() / questions.length) * 100).toFixed(0)}%</p>
            </div>
            <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200">
              <p className="text-slate-500 uppercase text-[10px]">Time Taken</p>
              <p className="text-2xl font-black text-sky-600">5m 28s</p>
            </div>
          </div>

          <button onClick={() => setIsSubmitted(false)} className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl">
            Retake Practice Test
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeTestSimulatorPage;
