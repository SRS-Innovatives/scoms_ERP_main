import React from 'react';
import PrintHeader from '../../components/common/PrintHeader';
import { Printer } from 'lucide-react';
import { studentsList } from '../../data/mockData';

export const MarksheetTemplatePage = () => {
  const student = studentsList[0];

  const marks = [
    { code: 'CS8601', title: 'Mobile Computing', credit: 3, grade: 'O', point: 10, result: 'PASS' },
    { code: 'CS8602', title: 'Compiler Design', credit: 4, grade: 'A+', point: 9, result: 'PASS' },
    { code: 'CS8603', title: 'Artificial Intelligence', credit: 3, grade: 'O', point: 10, result: 'PASS' },
    { code: 'CS8691', title: 'Cloud Computing Laboratory', credit: 2, grade: 'O', point: 10, result: 'PASS' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Official Marksheet / Grade Sheet Template</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Printable Consolidated Grade Sheet with GPA & CGPA calculation</p>
      </div>

      <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-xl max-w-4xl mx-auto print-container my-6">
        <PrintHeader title="GRADE SHEET / MARKSHEET" subtitle="Even Semester End Examinations 2025" documentNo="MS/2025/CS101" />

        <div className="grid grid-cols-2 gap-4 text-xs border-b pb-4 mb-4">
          <div>
            <p><span className="text-slate-500">Student Name:</span> <span className="font-bold">{student.name}</span></p>
            <p><span className="text-slate-500">Register No:</span> <span className="font-mono font-bold text-indigo-900">{student.regNo}</span></p>
          </div>
          <div className="text-right">
            <p><span className="text-slate-500">Branch:</span> <span className="font-bold">{student.course}</span></p>
            <p><span className="text-slate-500">Semester:</span> <span className="font-bold">{student.yearSem}</span></p>
          </div>
        </div>

        <table className="w-full text-xs text-left mb-6 border border-slate-300">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-300">
              <th className="p-2 border-r">Subject Code</th>
              <th className="p-2 border-r">Subject Title</th>
              <th className="p-2 border-r text-center">Credit</th>
              <th className="p-2 border-r text-center">Grade</th>
              <th className="p-2 border-r text-center">Grade Point</th>
              <th className="p-2 text-center">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {marks.map((m, idx) => (
              <tr key={idx}>
                <td className="p-2 border-r font-mono font-bold">{m.code}</td>
                <td className="p-2 border-r font-semibold">{m.title}</td>
                <td className="p-2 border-r text-center font-mono">{m.credit}</td>
                <td className="p-2 border-r text-center font-mono font-bold text-indigo-900">{m.grade}</td>
                <td className="p-2 border-r text-center font-mono">{m.point}</td>
                <td className="p-2 text-center font-bold text-emerald-700">{m.result}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bg-slate-50 p-4 rounded-xl border flex items-center justify-between text-xs font-bold mb-6">
          <span>Semester GPA (SGPA): <span className="text-indigo-900 font-mono text-sm">9.75 / 10.0</span></span>
          <span>Cumulative GPA (CGPA): <span className="text-indigo-900 font-mono text-sm">9.68 / 10.0</span></span>
          <span className="text-emerald-700 uppercase">CLASSIFICATION: FIRST CLASS WITH DISTINCTION</span>
        </div>

        <div className="pt-12 flex justify-between text-xs">
          <p className="border-t border-slate-400 w-36 pt-1 font-semibold text-center">Verified By</p>
          <p className="border-t border-slate-900 w-44 pt-1 font-bold text-center">Controller of Examinations</p>
        </div>
      </div>

      <div className="flex justify-center no-print">
        <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-xs shadow-md">
          <Printer className="w-4 h-4" />
          <span>Print Official Marksheet</span>
        </button>
      </div>
    </div>
  );
};

export default MarksheetTemplatePage;
