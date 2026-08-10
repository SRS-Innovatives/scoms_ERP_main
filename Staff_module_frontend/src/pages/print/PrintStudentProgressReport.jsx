import React from 'react';
import PrintLayout from '../../components/print/PrintLayout';

export const PrintStudentProgressReport = () => {
  return (
    <PrintLayout title="STUDENT ACADEMIC REPORT CARD" documentNo="RC-2026-101">
      <div className="text-xs space-y-4">
        <div className="p-3 bg-slate-100 rounded-lg space-y-1 border border-slate-300">
          <p><span className="font-bold">Student Name:</span> Aarav Patel</p>
          <p><span className="font-bold">Roll Number:</span> 101 | <span className="font-bold">Class:</span> 12-A</p>
          <p><span className="font-bold">Class Teacher:</span> Dr. Rajesh Sharma</p>
        </div>

        <table className="w-full text-left border border-slate-400">
          <thead className="bg-slate-200 font-bold">
            <tr>
              <th className="p-2 border border-slate-400">Subject</th>
              <th className="p-2 border border-slate-400">Max Marks</th>
              <th className="p-2 border border-slate-400">Obtained</th>
              <th className="p-2 border border-slate-400">Grade</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border border-slate-300 font-bold">Physics</td>
              <td className="p-2 border border-slate-300">100</td>
              <td className="p-2 border border-slate-300 font-bold">88</td>
              <td className="p-2 border border-slate-300 font-bold">A</td>
            </tr>
            <tr>
              <td className="p-2 border border-slate-300 font-bold">Physics Practicals</td>
              <td className="p-2 border border-slate-300">50</td>
              <td className="p-2 border border-slate-300 font-bold">48</td>
              <td className="p-2 border border-slate-300 font-bold">A+</td>
            </tr>
          </tbody>
        </table>
      </div>
    </PrintLayout>
  );
};

export default PrintStudentProgressReport;
