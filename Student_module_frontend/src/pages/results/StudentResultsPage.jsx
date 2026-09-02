import React, { useState, useEffect, useMemo } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import examService from '../../services/examService';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Printer, Award, Loader2 } from 'lucide-react';

export const StudentResultsPage = () => {
  const { student } = useStudentAuth();
  const { error: showError } = useNotification();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examService.getResults()
      .then((res) => setResults(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load results', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  const handlePrint = () => window.print();

  const { totalObtained, totalMax, percentage, passed } = useMemo(() => {
    const totalObtained = results.reduce((sum, r) => sum + r.marksObtained, 0);
    const totalMax = results.reduce((sum, r) => sum + r.examSchedule.maxMarks, 0);
    const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
    const passed = results.every((r) => r.marksObtained >= r.examSchedule.passMarks);
    return { totalObtained, totalMax, percentage, passed };
  }, [results]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Published Exam Results</h1>
          <p className="text-xs text-slate-500 mt-1">Marks are visible here only after your Institute Admin publishes them</p>
        </div>
        {results.length > 0 && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print / Save Marksheet PDF
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No published results yet. Check back once your exams are graded and published.</p>
        </div>
      ) : (
        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 bg-white dark:bg-slate-900 print-container">
          <div className="flex justify-between items-start border-b pb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{student?.institution}</h2>
              <p className="text-xs text-slate-500">Official Statement of Marks • {student?.course}</p>
            </div>
            <div className="text-right text-xs space-y-1">
              <p><span className="text-slate-500">Register No:</span> <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{student?.regNo}</span></p>
              <p><span className="text-slate-500">Student Name:</span> <span className="font-bold">{student?.name}</span></p>
              <StatusBadge status={passed ? 'PASS' : 'FAIL'} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Exam</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center">Marks</th>
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {results.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 text-slate-500">{r.examSchedule.exam.name}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{r.examSchedule.subject.name}</td>
                    <td className="p-3 text-center font-mono">{r.marksObtained} / {r.examSchedule.maxMarks}</td>
                    <td className="p-3 text-center font-bold text-indigo-600">{r.grade}</td>
                    <td className={`p-3 text-right font-bold ${r.marksObtained >= r.examSchedule.passMarks ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {r.marksObtained >= r.examSchedule.passMarks ? 'PASS' : 'FAIL'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex justify-between items-center text-xs">
            <div>
              <p className="text-slate-500">Overall Percentage:</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{percentage}%</p>
            </div>
            <div className="text-right">
              <p className={`font-bold ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>{passed ? 'PASS' : 'FAIL'}</p>
              <p className="text-[10px] text-slate-400">Total Marks: {totalObtained} / {totalMax}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResultsPage;
