import React, { useEffect, useState } from 'react';
import PrintLayout from '../../components/print/PrintLayout';
import { useNavigate } from 'react-router-dom';
import { DRAFT_STORAGE_KEY } from './QuestionPaperGeneratorPage';

export const PreviewQuestionPaperPage = () => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      setDraft(raw ? JSON.parse(raw) : null);
    } catch {
      setDraft(null);
    }
  }, []);

  if (draft === undefined) return null;

  if (!draft || !draft.questions || draft.questions.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 space-y-3">
        <p>No question paper draft found. Build one in the Question Paper Generator first.</p>
        <button
          onClick={() => navigate('/staff/exams/generator')}
          className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl"
        >
          Go to Paper Generator
        </button>
      </div>
    );
  }

  let qNumber = 0;
  const byMarks = {};
  draft.questions.forEach((q) => {
    const key = q.marks;
    if (!byMarks[key]) byMarks[key] = [];
    byMarks[key].push(q);
  });
  const sections = Object.entries(byMarks).sort((a, b) => Number(a[0]) - Number(b[0]));

  return (
    <PrintLayout title={draft.title?.toUpperCase()} documentNo={`QP-${draft.subjectName?.slice(0, 3).toUpperCase() || 'GEN'}-${new Date().getFullYear()}`}>
      <div className="text-xs space-y-4">
        <div className="flex justify-between font-bold border-b border-slate-300 pb-2">
          <span>Subject: {draft.subjectName || '—'}</span>
          <span>Course: {draft.courseName || '—'}</span>
          <span>Max Marks: {draft.totalMarks} Marks</span>
        </div>

        {sections.map(([marks, questions]) => (
          <div key={marks}>
            <h4 className="font-bold text-center uppercase tracking-wider mb-2">
              {questions[0].type.replace('_', ' ')} Questions — {marks} Mark(s) Each
            </h4>
            {questions.map((q) => {
              qNumber += 1;
              return (
                <p key={q.id} className="mb-2">
                  <strong>Q{qNumber}.</strong> {q.questionText} ({q.marks} Marks)
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <span className="block mt-1 pl-4 text-slate-600">
                      {q.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join('   ')}
                    </span>
                  )}
                </p>
              );
            })}
          </div>
        ))}
      </div>
    </PrintLayout>
  );
};

export default PreviewQuestionPaperPage;
