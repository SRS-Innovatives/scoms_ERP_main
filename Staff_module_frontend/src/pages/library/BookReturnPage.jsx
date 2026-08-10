import React from 'react';
import { mockLibraryStatus } from '../../data/mockStaffData';
import { useNotification } from '../../context/NotificationContext';
import StatusBadge from '../../components/common/StatusBadge';
import { BookOpen } from 'lucide-react';

export const BookReturnPage = () => {
  const { success } = useNotification();

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-indigo-500" /> Book Return & Check-In Desk
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
            <tr>
              <th className="p-3">Issue ID</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Book Title</th>
              <th className="p-3">Issue Date</th>
              <th className="p-3">Due Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Fine (₹)</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {mockLibraryStatus.map((b) => (
              <tr key={b.issueId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-3 font-mono font-bold">{b.issueId}</td>
                <td className="p-3 font-semibold">{b.studentName}</td>
                <td className="p-3 text-slate-800 dark:text-slate-200">{b.bookTitle}</td>
                <td className="p-3">{b.issueDate}</td>
                <td className="p-3 font-semibold">{b.dueDate}</td>
                <td className="p-3"><StatusBadge status={b.status} size="sm" /></td>
                <td className="p-3 font-bold text-rose-600">₹{b.fine}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => success(`Book "${b.bookTitle}" checked in successfully!`, 'Return Processed')}
                    className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                  >
                    Receive Return
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookReturnPage;
