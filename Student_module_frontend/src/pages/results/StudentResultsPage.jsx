import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockStudentSubjects } from '../../data/mockStudentData';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { Printer, Download, Award } from 'lucide-react';

export const StudentResultsPage = () => {
  const { student } = useStudentAuth();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Semester Marksheet & Grades</h1>
          <p className="text-xs text-slate-500 mt-1">Official Semester Grade Point Average (SGPA) & CGPA Record</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
        >
          <Printer className="w-4 h-4" /> Print / Save Marksheet PDF
        </button>
      </div>

      {/* Marksheet Document */}
      <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 bg-white dark:bg-slate-900 print-container">
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{student?.institution}</h2>
            <p className="text-xs text-slate-500">Official Statement of Marks • {student?.course}</p>
            <p className="text-xs font-bold text-indigo-600 mt-1">SEMESTER 4 GRADE SHEET</p>
          </div>
          <div className="text-right text-xs space-y-1">
            <p><span className="text-slate-500">Register No:</span> <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{student?.regNo}</span></p>
            <p><span className="text-slate-500">Student Name:</span> <span className="font-bold">{student?.name}</span></p>
            <StatusBadge status="PASS" />
          </div>
        </div>

        {/* Grade Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Course Code</th>
                <th className="p-3">Course Title</th>
                <th className="p-3 text-center">Credits</th>
                <th className="p-3 text-center">Internal (25)</th>
                <th className="p-3 text-center">Grade</th>
                <th className="p-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {mockStudentSubjects.map((sub) => (
                <tr key={sub.code}>
                  <td className="p-3 font-mono font-bold text-indigo-600">{sub.code}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{sub.title}</td>
                  <td className="p-3 text-center font-bold">{sub.credits}</td>
                  <td className="p-3 text-center font-mono">{sub.internalMarks}</td>
                  <td className="p-3 text-center font-bold text-indigo-600">{sub.grade}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">PASS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GPA Summary */}
        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex justify-between items-center text-xs">
          <div>
            <p className="text-slate-500">Cumulative Grade Point Average (CGPA):</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{student?.gpa} / 10.0</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-emerald-600">FIRST CLASS WITH DISTINCTION</p>
            <p className="text-[10px] text-slate-400">Total Credits Earned: 19</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResultsPage;
