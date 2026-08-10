import React from 'react';
import PrintLayout from '../../components/print/PrintLayout';
import { mockStudentsList } from '../../data/mockStaffData';

export const PrintAttendanceRegister = () => {
  return (
    <PrintLayout title="MONTHLY ATTENDANCE REGISTER - CLASS 12-A" documentNo="ATT-REG-2026-08">
      <div className="text-xs space-y-4">
        <div className="flex justify-between font-bold border-b border-slate-300 pb-2">
          <span>Class Teacher: Dr. Rajesh Sharma</span>
          <span>Month: August 2026</span>
          <span>Total Strength: 40 Students</span>
        </div>

        <table className="w-full text-left border border-slate-400">
          <thead className="bg-slate-200 uppercase font-bold text-[10px]">
            <tr>
              <th className="p-2 border border-slate-400">Roll No</th>
              <th className="p-2 border border-slate-400">Student Name</th>
              <th className="p-2 border border-slate-400 text-center">Attd %</th>
              <th className="p-2 border border-slate-400 text-center">Status</th>
              <th className="p-2 border border-slate-400">Parent Phone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {mockStudentsList.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border border-slate-300 font-bold">{s.rollNo}</td>
                <td className="p-2 border border-slate-300 font-semibold">{s.name}</td>
                <td className="p-2 border border-slate-300 text-center font-bold">{s.attendancePercent}%</td>
                <td className="p-2 border border-slate-300 text-center font-bold">{s.status}</td>
                <td className="p-2 border border-slate-300">{s.parentContact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PrintLayout>
  );
};

export default PrintAttendanceRegister;
