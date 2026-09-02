import React, { useEffect, useState } from 'react';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import { Sparkles, Plus, Trash2, Eye, Loader2, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DRAFT_STORAGE_KEY = 'staff_question_paper_draft';

export const QuestionPaperGeneratorPage = () => {
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [paperTitle, setPaperTitle] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [easyCount, setEasyCount] = useState(5);
  const [mediumCount, setMediumCount] = useState(5);
  const [hardCount, setHardCount] = useState(2);

  useEffect(() => {
    examService.getMySubjects()
      .then(async (res) => {
        const list = res.data || [];
        setSubjects(list);
        if (list.length > 0) setSubjectId(list[0].id);
      })
      .catch((err) => showError(err.message || 'Failed to load subjects', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => {
    if (!subjectId) return;
    examService.getQuestions({ subjectId })
      .then((res) => setAllQuestions(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load question bank', 'Load Failed'));
  }, [subjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addQuestion = (q) => {
    if (!selectedQuestions.find((x) => x.id === q.id)) setSelectedQuestions((prev) => [...prev, q]);
  };
  const removeQuestion = (id) => setSelectedQuestions((prev) => prev.filter((q) => q.id !== id));

  const handleAutoGenerate = async () => {
    if (!subjectId) return;
    setGenerating(true);
    try {
      const res = await examService.generateQuestionPaper({ subjectId, easyCount, mediumCount, hardCount });
      const generated = res.data?.questions || [];
      setSelectedQuestions(generated);
      success(`${generated.length} questions auto-selected by difficulty blueprint.`, 'Paper Generated');
    } catch (err) {
      showError(err.message || 'Failed to auto-generate paper', 'Generation Failed');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = () => {
    if (selectedQuestions.length === 0) {
      showError('Add at least one question to the paper first', 'Empty Paper');
      return;
    }
    const subject = subjects.find((s) => s.id === subjectId);
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      title: paperTitle || `${subject?.name || 'Untitled'} Question Paper`,
      subjectName: subject?.name,
      courseName: subject?.course?.name,
      questions: selectedQuestions,
      totalMarks: selectedQuestions.reduce((sum, q) => sum + (q.marks || 0), 0),
    }));
    navigate('/staff/exams/preview');
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (subjects.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        You have no assigned subjects yet. Ask your Institute Admin to assign you to a subject/section first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Automated Question Paper Generator
          </h2>
          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl"
          >
            <Eye className="w-4 h-4" /> Preview Paper
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Paper Title</label>
            <input type="text" value={paperTitle} onChange={(e) => setPaperTitle(e.target.value)} placeholder="e.g. Mid-Term Examination 2026" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setSelectedQuestions([]); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.course?.name})</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Easy Qs</label>
            <input type="number" min="0" value={easyCount} onChange={(e) => setEasyCount(Number(e.target.value))} className="w-20 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Medium Qs</label>
            <input type="number" min="0" value={mediumCount} onChange={(e) => setMediumCount(Number(e.target.value))} className="w-20 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hard Qs</label>
            <input type="number" min="0" value={hardCount} onChange={(e) => setHardCount(Number(e.target.value))} className="w-20 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          </div>
          <button
            onClick={handleAutoGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Auto-Generate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Available Questions */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
            Available Questions in Repository ({allQuestions.length})
          </h3>

          {allQuestions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No questions in the bank for this subject yet.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {allQuestions.map((q) => (
                <div key={q.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2">
                  <div className="text-xs">
                    <span className="font-bold text-sky-600">{q.type}</span> • <span className="text-slate-500">{q.chapter || 'General'}</span> • <span className="text-slate-500">{q.marks} Marks</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{q.questionText}</p>
                  </div>
                  <button
                    onClick={() => addQuestion(q)}
                    disabled={!!selectedQuestions.find((x) => x.id === q.id)}
                    className="p-1.5 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 shrink-0 disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Selected Paper Structure */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Draft Question Paper ({selectedQuestions.length} Questions, {selectedQuestions.reduce((sum, q) => sum + (q.marks || 0), 0)} Marks)
            </h3>
          </div>

          {selectedQuestions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Add questions from the bank or use Auto-Generate.</p>
          ) : (
            <div className="space-y-2">
              {selectedQuestions.map((q, idx) => (
                <div key={q.id} className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-start justify-between gap-2">
                  <div className="text-xs">
                    <span className="font-bold">Q{idx + 1}. [{q.type}, {q.marks} Marks]</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{q.questionText}</p>
                  </div>
                  <button onClick={() => removeQuestion(q.id)} className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionPaperGeneratorPage;
