import React from 'react';
import PrintLayout from '../../components/print/PrintLayout';

export const PrintParentMeetingRecord = () => {
  return (
    <PrintLayout title="PARENT TEACHER MEETING RECORD SHEET" documentNo="PTM-REC-2026-08">
      <div className="text-xs space-y-3">
        <p><strong>Student Name:</strong> Rohan Verma (Class 12-A, Roll #103)</p>
        <p><strong>Parent Present:</strong> Mr. Suresh Verma (Father)</p>
        <p><strong>Teacher Conducted:</strong> Dr. Rajesh Sharma (HOD Physics / Class Teacher)</p>
        <div className="p-4 border border-slate-400 rounded-lg">
          <p className="font-bold mb-1">Meeting Summary & Recommendations:</p>
          <p className="leading-relaxed">Discussed student attendance recovery plan. Recommended attending remedial Physics problem sessions on Saturdays.</p>
        </div>
      </div>
    </PrintLayout>
  );
};

export default PrintParentMeetingRecord;
