import React, { useState, useEffect } from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import libraryService from '../../services/libraryService';
import studentService from '../../services/studentService';

export const IssueBookPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookId, setBookId] = useState('');
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    Promise.all([libraryService.getBooks(), studentService.getAll()])
      .then(([bookRes, studentRes]) => {
        setBooks((bookRes.data || []).filter((b) => b.availableCopies > 0));
        setStudents(studentRes.data || []);
      })
      .catch((err) => notifyError(`Failed to load setup data: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!bookId || !studentId) return;
    setSubmitting(true);
    try {
      const res = await libraryService.issueBook({ bookId, studentId });
      notifySuccess(res.message, 'Book Issued');
      setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, availableCopies: b.availableCopies - 1 } : b)).filter((b) => b.availableCopies > 0));
      setBookId('');
      setStudentId('');
    } catch (error) {
      notifyError(`Failed to issue book: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Library Book Issue Counter</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Issue library books to students (14-day lending period, ₹5/day overdue fine)</p>
      </div>

      <form onSubmit={handleIssue}>
        <FormSection title="Book Issue Circulation Entry" icon={BookOpen}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Student *</label>
              <select required value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
                <option value="">Select student...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.rollNumber} — {s.firstName} {s.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Book *</label>
              <select required value={bookId} onChange={(e) => setBookId(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
                <option value="">Select book...</option>
                {books.map((b) => <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} available)</option>)}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50">
              <CheckCircle className="w-4 h-4" />
              <span>{submitting ? 'Issuing...' : 'Issue Book to Student'}</span>
            </button>
          </div>
        </FormSection>
      </form>
    </div>
  );
};

export default IssueBookPage;
