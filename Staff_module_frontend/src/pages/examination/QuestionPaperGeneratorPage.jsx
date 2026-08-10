import React, { useState } from 'react';
import { mockQuestionBank } from '../../data/mockStaffData';
import { useNotification } from '../../context/NotificationContext';
import { Sparkles, Plus, Trash2, Printer, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuestionPaperGeneratorPage = () => {
  const { success } = useNotification();
  const navigate = useNavigate();

  const [paperTitle, setPaperTitle] = useState('Mid-Term Examination 2026 - Physics');
  const [selectedQuestions, setSelectedQuestions] = useState([mockQuestionBank[0], mockQuestionBank[1]]);

  const addQuestion = (q) => {
    if (!selectedQuestions.find(x => x.id === q.id)) {
      setSelectedQuestions([...selectedQuestions, q]);
    }
  };

  const removeQuestion = (id) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Automated Question Paper Generator
          </h2>
          <p className="text-xs text-slate-500">Pick questions from bank or auto-generate based on difficulty syllabus blueprint.</p>
        </div>
        <button
          onClick={() => navigate('/staff/exams/preview')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl"
        >
          <Eye className="w-4 h-4" /> Preview Paper
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Available Questions */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
            Available Questions in Repository
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {mockQuestionBank.map((q) => (
              <div key={q.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2">
                <div className="text-xs">
                  <span className="font-bold text-sky-600">{q.type}</span> • <span className="text-slate-500">{q.chapter}</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{q.question}</p>
                </div>
                <button
                  onClick={() => addQuestion(q)}
                  className="p-1.5 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Paper Structure */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Draft Question Paper ({selectedQuestions.length} Questions)</h3>
          </div>

          <div className="space-y-2">
            {selectedQuestions.map((q, idx) => (
              <div key={q.id} className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-start justify-between gap-2">
                <div className="text-xs">
                  <span className="font-bold">Q{idx + 1}. [{q.type}]</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{q.question}</p>
                </div>
                <button onClick={() => removeQuestion(q.id)} className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPaperGeneratorPage;
