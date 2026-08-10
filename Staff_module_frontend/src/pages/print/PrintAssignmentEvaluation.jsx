import React from 'react';
import PrintLayout from '../../components/print/PrintLayout';
import { mockSubmissions } from '../../data/mockStaffData';

export const PrintAssignmentEvaluation = () => {
  return (
    <PrintLayout title="ASSIGNMENT EVALUATION SHEET" documentNo="ASN-EVAL-2026-02">
      <div className="text-xs space-y-4">
        <div className="flex justify-between font-bold border-b border-slate-300 pb-2">
          <span>Subject: Physics Theory</span>
          <span>Topic: Electrostatics</span>
          <span>Max Marks: 25</span>
        </div>

        <table className="w-full text-left border border-slate-400">
          <thead className="bg-slate-200 uppercase font-bold text-[10px]">
            <tr>
              <th className="p-2 border border-slate-400">Roll No</th>
              <th className="p-2 border border-slate-400">Student Name</th>
              <th className="p-2 border border-slate-400">Marks (25)</th>
              <th className="p-2 border border-slate-400">Evaluator Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {mockSubmissions.map((s) => (
              <tr key={s.studentId}>
                <td className="p-2 border border-slate-300 font-bold">{s.rollNo}</td>
                <td className="p-2 border border-slate-300 font-semibold">{s.studentName}</td>
                <td className="p-2 border border-slate-300 font-bold">{s.marks !== null ? `${s.marks} / 25` : 'Pending'}</td>
                <td className="p-2 border border-slate-300">{s.feedback || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PrintLayout>
  );
};

export default PrintAssignmentEvaluation;
