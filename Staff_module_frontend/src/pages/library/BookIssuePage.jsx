import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { BookOpen, Check, Loader2 } from 'lucide-react';
import libraryService from '../../services/libraryService';

export const BookIssuePage = () => {
  const { success, error: showError } = useNotification();
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [bookId, setBookId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([libraryService.searchStudents(), libraryService.searchBooks()])
      .then(([studentRes, bookRes]) => {
        setStudents(studentRes.data || []);
        setBooks(bookRes.data || []);
      })
      .catch((err) => showError(err.message || 'Failed to load setup data', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !bookId) return;
    setSubmitting(true);
    try {
      const res = await libraryService.issueBook({ bookId, studentId });
      success(res.message, 'Book Issued');
      setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, availableCopies: b.availableCopies - 1 } : b)).filter((b) => b.availableCopies > 0));
      setStudentId('');
      setBookId('');
    } catch (err) {
      showError(err.message || 'Failed to issue book', 'Issue Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-sky-500" /> Library Book Issue Counter
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student</label>
          <select required value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <option value="">Select student...</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.rollNumber || s.admissionNumber} — {s.firstName} {s.lastName}</option>)}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Book</label>
          <select required value={bookId} onChange={(e) => setBookId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <option value="">Select book...</option>
            {books.map((b) => <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} available)</option>)}
          </select>
        </div>

        <p className="text-[11px] text-slate-400">14-day lending period, ₹5/day overdue fine applies automatically on return.</p>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50">
            <Check className="w-4 h-4" /> {submitting ? 'Issuing...' : 'Issue Book'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookIssuePage;
