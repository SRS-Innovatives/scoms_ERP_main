import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { BookOpen, Check } from 'lucide-react';

export const BookIssuePage = () => {
  const { success } = useNotification();
  const [studentId, setStudentId] = useState('STU-001');
  const [bookTitle, setBookTitle] = useState('Concepts of Physics - H.C. Verma');
  const [dueDate, setDueDate] = useState('2026-08-25');

  const handleSubmit = (e) => {
    e.preventDefault();
    success(`Book "${bookTitle}" issued to student ${studentId}! Due: ${dueDate}`, 'Book Issued');
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-sky-500" /> Library Book Issue Counter
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student Roll / ID Number</label>
          <input type="text" required value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Book Title / Accession Code</label>
          <input type="text" required value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Return Due Date</label>
          <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
            <Check className="w-4 h-4" /> Issue Book
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookIssuePage;
