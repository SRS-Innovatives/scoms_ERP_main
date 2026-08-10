import React, { useState } from 'react';
import { mockSubmissions } from '../../data/mockStaffData';
import StatusBadge from '../../components/common/StatusBadge';
import EvaluateSubmissionModal from '../../components/modals/EvaluateSubmissionModal';
import { CheckCircle, FileText } from 'lucide-react';

export const StudentSubmissionsPage = () => {
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Student Homework Submissions</h3>
          <p className="text-xs text-slate-500">Assignment: Electrostatic Potential & Capacitance</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
            <tr>
              <th className="p-3">Roll No</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Submitted On</th>
              <th className="p-3">Uploaded PDF</th>
              <th className="p-3">Status</th>
              <th className="p-3">Marks</th>
              <th className="p-3 text-right">Evaluate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {mockSubmissions.map((sub) => (
              <tr key={sub.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-3 font-bold">{sub.rollNo}</td>
                <td className="p-3 font-semibold">{sub.studentName}</td>
                <td className="p-3 text-slate-500">{sub.submittedOn}</td>
                <td className="p-3 text-sky-600 font-medium">{sub.fileUrl}</td>
                <td className="p-3"><StatusBadge status={sub.status} size="sm" /></td>
                <td className="p-3 font-bold">{sub.marks !== null ? `${sub.marks} / 25` : '-'}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedSubmission(sub)}
                    className="px-3 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg"
                  >
                    Grade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EvaluateSubmissionModal
        isOpen={Boolean(selectedSubmission)}
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />
    </div>
  );
};

export default StudentSubmissionsPage;
