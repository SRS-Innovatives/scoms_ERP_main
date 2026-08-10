import React from 'react';
import PrintLayout from '../../components/print/PrintLayout';
import { mockStaffProfile } from '../../data/mockStaffData';

export const PrintDutyAllotmentLetter = () => {
  return (
    <PrintLayout title="OFFICIAL DUTY ALLOTMENT ORDER" documentNo="DUTY-ORD-2026-99">
      <div className="text-xs space-y-4">
        <p>To,</p>
        <p className="font-bold">{mockStaffProfile.name}<br />{mockStaffProfile.designation}</p>
        <p className="leading-relaxed">
          You are hereby allotted Chief Invigilator & External Examiner duties for the upcoming Board Practical & Mid-Term Examinations as detailed below:
        </p>
        <table className="w-full text-left border border-slate-400">
          <thead className="bg-slate-200 font-bold">
            <tr>
              <th className="p-2 border border-slate-400">Duty Description</th>
              <th className="p-2 border border-slate-400">Center / Venue</th>
              <th className="p-2 border border-slate-400">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border border-slate-300 font-semibold">Chief Invigilator - Unit Test II</td>
              <td className="p-2 border border-slate-300">Hall A-1</td>
              <td className="p-2 border border-slate-300">16-Aug-2026 (09:30 AM)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </PrintLayout>
  );
};

export default PrintDutyAllotmentLetter;
