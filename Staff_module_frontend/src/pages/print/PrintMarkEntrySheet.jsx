import React from 'react';
import PrintLayout from '../../components/print/PrintLayout';
import { mockStudentsList } from '../../data/mockStaffData';

export const PrintMarkEntrySheet = () => {
  return (
    <PrintLayout title="EXAMINATION MARKS ENTRY BROADSHEET" documentNo="MRK-BS-2026-01">
      <div className="text-xs space-y-4">
        <div className="flex justify-between font-bold border-b border-slate-300 pb-2">
          <span>Class: 12-A</span>
          <span>Subject: Physics</span>
          <span>Max Marks: 100</span>
        </div>

        <table className="w-full text-left border border-slate-400">
          <thead className="bg-slate-200 uppercase font-bold text-[10px]">
            <tr>
              <th className="p-2 border border-slate-400">Roll No</th>
              <th className="p-2 border border-slate-400">Student Name</th>
              <th className="p-2 border border-slate-400">Marks (100)</th>
              <th className="p-2 border border-slate-400">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {mockStudentsList.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border border-slate-300 font-bold">{s.rollNo}</td>
                <td className="p-2 border border-slate-300 font-semibold">{s.name}</td>
                <td className="p-2 border border-slate-300 font-bold">{s.lastMarks}</td>
                <td className="p-2 border border-slate-300 font-bold">{s.lastMarks >= 90 ? 'A+' : s.lastMarks >= 80 ? 'A' : 'B'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PrintLayout>
  );
};

export default PrintMarkEntrySheet;
