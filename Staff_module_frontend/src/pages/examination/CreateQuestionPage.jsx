import React, { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { PlusCircle, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import examService from '../../services/examService';

const TYPE_OPTIONS = [
  { value: 'MCQ', label: 'MCQ (Multiple Choice)' },
  { value: 'MULTIPLE_CORRECT', label: 'Multiple Correct Answers' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'FILL_BLANK', label: 'Fill in the Blank' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_ANSWER', label: 'Long Answer' },
];

export const CreateQuestionPage = () => {
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [saving, setSaving] = useState(false);

  const [subjectId, setSubjectId] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [type, setType] = useState('MCQ');
  const [marks, setMarks] = useState(1);
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');

  useEffect(() => {
    examService.getMySubjects()
      .then((res) => {
        const list = res.data || [];
        setSubjects(list);
        if (list.length > 0) setSubjectId(list[0].id);
      })
      .catch((err) => showError(err.message || 'Failed to load subjects', 'Load Failed'))
      .finally(() => setLoadingSubjects(false));
  }, [showError]);

  const isChoiceType = type === 'MCQ' || type === 'MULTIPLE_CORRECT';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectId) {
      showError('Select a subject first', 'Missing Subject');
      return;
    }
    setSaving(true);
    try {
      await examService.createQuestion({
        subjectId,
        chapter,
        topic,
        type,
        difficulty,
        questionText,
        explanation,
        marks: Number(marks),
        options: isChoiceType ? options.filter((o) => o.trim() !== '') : undefined,
        correctAnswer,
      });
      success('New question added to institutional question bank!', 'Question Saved');
      navigate('/staff/exams/bank');
    } catch (err) {
      showError(err.message || 'Failed to save question', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loadingSubjects) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (subjects.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-3xl">
        You have no assigned subjects yet. Ask your Institute Admin to assign you to a subject/section before adding questions.
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-3xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-sky-500" /> Create Question Bank Entry
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.course?.name})</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Chapter Name</label>
            <input type="text" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Wave Optics" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Topic</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Interference" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Difficulty Level</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Question Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Marks</label>
            <input type="number" min="1" step="0.5" value={marks} onChange={(e) => setMarks(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Question Statement</label>
          <textarea
            required
            rows={4}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type question text here..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          ></textarea>
        </div>

        {isChoiceType && (
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Options</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {options.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={opt}
                  onChange={(e) => setOptions((prev) => prev.map((o, i) => (i === idx ? e.target.value : o)))}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Correct Answer</label>
          <input
            required
            type="text"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder={isChoiceType ? 'Enter the correct option text exactly' : 'Enter the correct/model answer'}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Explanation (optional)</label>
          <textarea
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Why this is the correct answer..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          ></textarea>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuestionPage;
