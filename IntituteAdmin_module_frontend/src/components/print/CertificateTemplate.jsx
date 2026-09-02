import React from 'react';
import PrintHeader from '../common/PrintHeader';
import { Printer } from 'lucide-react';
import { useInstitution } from '../../context/InstitutionContext';

export const CertificateTemplate = ({ type = 'bonafide', certData }) => {
  const { institution } = useInstitution();
  const student = certData || {
    name: "Kavitha R. Sharma",
    rollNo: "21CS101",
    regNo: "311521104001",
    fatherName: "Rajendra Sharma",
    course: "B.E. Computer Science & Engineering",
    academicYear: "2025 - 2026",
    yearSem: "3rd Year (6th Semester)",
    issueDate: "2025-08-09",
    tcNo: "TC/2025/0892",
    conduct: "GOOD",
    dob: "14/05/2003",
    dateOfAdmission: "01/08/2021",
    dateOfLeaving: "31/05/2025",
    reasonForLeaving: "Course Completed"
  };

  const isBonafide = type === 'bonafide';
  const isTC = type === 'tc';
  const isConduct = type === 'conduct';
  const isCourseCompletion = type === 'completion';
  const isFeePaid = type === 'feepaid';

  return (
    <div className="w-full">
      <div className="bg-white text-slate-900 p-10 rounded-2xl border-4 border-double border-slate-900 shadow-2xl max-w-4xl mx-auto print-container my-6 relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <h1 className="text-8xl font-bold uppercase tracking-widest text-slate-900 -rotate-12">
            {institution?.code || institution?.name || 'SCOMS'}
          </h1>
        </div>

        <PrintHeader
          title={
            isTC
              ? "TRANSFER & CONDUCT CERTIFICATE"
              : isBonafide
              ? "BONAFIDE CERTIFICATE"
              : isConduct
              ? "CONDUCT CERTIFICATE"
              : isFeePaid
              ? "FEE PAID CERTIFICATE"
              : "COURSE COMPLETION CERTIFICATE"
          }
          subtitle="Issued by Office of the Principal"
          documentNo={student.tcNo || "CERT/2025/492"}
        />

        {/* Certificate Body Content */}
        <div className="my-10 text-sm leading-relaxed text-slate-900 font-serif px-6 space-y-6">
          {isBonafide && (
            <p className="text-justify text-base">
              This is to certify that Mr. / Ms.{' '}
              <span className="font-bold underline uppercase">{student.name}</span> (Register No:{' '}
              <span className="font-bold font-mono">{student.regNo}</span>), Son / Daughter of Shri{' '}
              <span className="font-bold underline">{student.fatherName}</span>, is a bona fide student of this institution, currently studying in{' '}
              <span className="font-bold">{student.yearSem}</span> of <span className="font-bold">{student.course}</span> during the academic year{' '}
              <span className="font-bold">{student.academicYear}</span>.
            </p>
          )}

          {isTC && (
            <div className="space-y-3 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4 border-b pb-2">
                <p><span className="font-semibold text-slate-600">1. Name of the Student:</span> <span className="font-bold text-slate-900 uppercase">{student.name}</span></p>
                <p><span className="font-semibold text-slate-600">2. Register / Roll No:</span> <span className="font-mono font-bold text-indigo-900">{student.regNo}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b pb-2">
                <p><span className="font-semibold text-slate-600">3. Father's / Guardian Name:</span> <span className="font-bold">{student.fatherName}</span></p>
                <p><span className="font-semibold text-slate-600">4. Date of Birth:</span> <span className="font-bold">{student.dob}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b pb-2">
                <p><span className="font-semibold text-slate-600">5. Course & Branch Studied:</span> <span className="font-bold">{student.course}</span></p>
                <p><span className="font-semibold text-slate-600">6. Date of Admission:</span> <span className="font-bold">{student.dateOfAdmission}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b pb-2">
                <p><span className="font-semibold text-slate-600">7. Date of Leaving:</span> <span className="font-bold">{student.dateOfLeaving}</span></p>
                <p><span className="font-semibold text-slate-600">8. Reason for Leaving:</span> <span className="font-bold">{student.reasonForLeaving}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b pb-2">
                <p><span className="font-semibold text-slate-600">9. Character & Conduct:</span> <span className="font-bold text-emerald-700">{student.conduct}</span></p>
                <p><span className="font-semibold text-slate-600">10. Fee Dues Pending:</span> <span className="font-bold text-emerald-700">NIL (ALL FEES CLEARED)</span></p>
              </div>
            </div>
          )}

          {isConduct && (
            <p className="text-justify text-base">
              This is to certify that Mr. / Ms.{' '}
              <span className="font-bold underline uppercase">{student.name}</span> (Reg No:{' '}
              <span className="font-bold font-mono">{student.regNo}</span>) has been a student of <span className="font-bold">{student.course}</span> from{' '}
              <span className="font-bold">2021 to 2025</span>. His / Her character and conduct during the entire period of study in this institution have been{' '}
              <span className="font-bold text-emerald-800 underline uppercase">EXCELLENT</span>.
            </p>
          )}

          {isFeePaid && (
            <p className="text-justify text-base">
              This is to certify that Mr. / Ms.{' '}
              <span className="font-bold underline uppercase">{student.name}</span> (Roll No:{' '}
              <span className="font-bold font-mono">{student.rollNo}</span>) studying in <span className="font-bold">{student.course}</span> has paid all prescribed Tuition, Special Lab, and Examination Fees for the academic year{' '}
              <span className="font-bold">{student.academicYear}</span>. There are no outstanding fee dues against his / her name as on date.
            </p>
          )}

          <p className="text-xs font-sans text-slate-600 pt-4">
            This certificate is issued on request for official / passport / education loan / employment purposes.
          </p>
        </div>

        {/* Date & Signatures */}
        <div className="pt-16 flex items-end justify-between text-xs font-sans">
          <div>
            <p className="text-slate-600">Place: <span className="font-bold text-slate-900">Chennai</span></p>
            <p className="text-slate-600">Date: <span className="font-bold text-slate-900">{student.issueDate}</span></p>
          </div>

          <div className="text-center">
            <div className="w-20 h-16 border border-slate-300 rounded mb-1 mx-auto flex items-center justify-center text-[9px] text-slate-400 font-mono">
              [INSTITUTE SEAL]
            </div>
          </div>

          <div className="text-center">
            <p className="border-t border-slate-900 w-44 pt-1 font-bold text-slate-900 text-sm">PRINCIPAL / DIRECTOR</p>
            <p className="text-[10px] text-slate-500">{institution?.name || ''}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center no-print mt-4">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Certificate</span>
        </button>
      </div>
    </div>
  );
};

export default CertificateTemplate;
