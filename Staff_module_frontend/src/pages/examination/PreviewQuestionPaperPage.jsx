import React from 'react';
import PrintLayout from '../../components/print/PrintLayout';

export const PreviewQuestionPaperPage = () => {
  return (
    <PrintLayout title="MID-TERM EXAMINATION 2026 - PHYSICS" documentNo="QP-PHY-2026-04">
      <div className="text-xs space-y-4">
        <div className="flex justify-between font-bold border-b border-slate-300 pb-2">
          <span>Class: 12th Standard</span>
          <span>Time: 3 Hours</span>
          <span>Max Marks: 70 Marks</span>
        </div>

        <div>
          <h4 className="font-bold text-center uppercase tracking-wider mb-2">Section A (Long Answer Questions - 5 Marks Each)</h4>
          <p className="mb-2"><strong>Q1.</strong> Derive an expression for the electric potential at a point due to an electric dipole along its axial line. Draw relevant diagrams. (5 Marks)</p>
          <p className="mb-2"><strong>Q2.</strong> State Huygens' principle. Using Huygens' wave theory, verify the laws of refraction at a plane interface. (5 Marks)</p>
        </div>

        <div>
          <h4 className="font-bold text-center uppercase tracking-wider mb-2">Section B (Short Answer Questions - 2 Marks Each)</h4>
          <p className="mb-2"><strong>Q3.</strong> Distinguish between drift velocity and relaxation time of free electrons in a conductor. (2 Marks)</p>
        </div>
      </div>
    </PrintLayout>
  );
};

export default PreviewQuestionPaperPage;
