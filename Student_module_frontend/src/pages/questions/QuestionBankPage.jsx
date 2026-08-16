import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { mockQuestionBank } from '../../data/mockStudentData';
import { useNotification } from '../../context/NotificationContext';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuestionBankPage = () => {
  const navigate = useNavigate();
  const { success } = useNotification();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution Approved Question Bank"
        subtitle="Practice verified MCQ, short answer, and essay questions with solution explanations."
        actionLabel="Start Mock Test Simulator"
        onAction={() => navigate('/student/practice-tests')}
        actionIcon={Play}
      />

      <div className="space-y-4">
        {mockQuestionBank.map((q) => (
          <div key={q.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs font-bold text-indigo-600 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950">
                {q.subject} • {q.chapter}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700">
                {q.difficulty}
              </span>
            </div>

            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{q.question}</h3>

            {q.options && (
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                {q.options.map((opt, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <span className="font-bold text-indigo-600 mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionBankPage;
