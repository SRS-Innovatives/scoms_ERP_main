import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { PlusCircle, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CreateQuestionPage = () => {
  const { success } = useNotification();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('Physics');
  const [chapter, setChapter] = useState('Wave Optics');
  const [difficulty, setDifficulty] = useState('Medium');
  const [bloomLevel, setBloomLevel] = useState('Applying');
  const [type, setType] = useState('5 Mark');
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    success('New question added to institutional question bank!', 'Question Saved');
    navigate('/staff/exams/bank');
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-3xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-sky-500" /> Create Question Bank Entry
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Chapter Name</label>
            <input type="text" value={chapter} onChange={(e) => setChapter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Difficulty Level</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bloom's Taxonomy Level</label>
            <select value={bloomLevel} onChange={(e) => setBloomLevel(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <option value="Remembering">Remembering</option>
              <option value="Understanding">Understanding</option>
              <option value="Applying">Applying</option>
              <option value="Analyzing">Analyzing</option>
              <option value="Evaluating">Evaluating</option>
              <option value="Creating">Creating</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Question Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <option value="MCQ">MCQ (1 Mark)</option>
              <option value="2 Mark">Short Answer (2 Mark)</option>
              <option value="5 Mark">Long Answer (5 Mark)</option>
              <option value="Essay">Essay (10 Mark)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Question Statement</label>
          <textarea
            required
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type question text here..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          ></textarea>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
            <Save className="w-4 h-4" /> Save Question
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuestionPage;
