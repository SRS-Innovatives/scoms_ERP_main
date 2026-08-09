import React, { useState } from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { BookOpen, CheckCircle } from 'lucide-react';

export const IssueBookPage = () => {
  const { notifySuccess } = useNotification();
  const [rollNo, setRollNo] = useState('21CS101');
  const [bookId, setBookId] = useState('BK-001');

  const handleIssue = (e) => {
    e.preventDefault();
    notifySuccess(`Book BK-001 (Introduction to Algorithms) issued to Kavitha R. Sharma (21CS101)! Due Date: 23-Aug-2026`, 'Book Issued');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Library Book Issue Counter</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Scan student barcode & book ISBN to issue library books (14 days lending period)</p>
      </div>

      <form onSubmit={handleIssue}>
        <FormSection title="Book Issue Circulation Entry" icon={BookOpen}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Student Roll / Reg Number *</label>
              <input type="text" required value={rollNo} onChange={(e) => setRollNo(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono font-bold" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Book Barcode / Accession ID *</label>
              <input type="text" required value={bookId} onChange={(e) => setBookId(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono font-bold" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md">
              <CheckCircle className="w-4 h-4" />
              <span>Issue Book to Student</span>
            </button>
          </div>
        </FormSection>
      </form>
    </div>
  );
};

export default IssueBookPage;
