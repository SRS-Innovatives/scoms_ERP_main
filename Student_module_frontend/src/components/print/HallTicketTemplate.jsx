import React from 'react';
import { useInstitution, useAcademic } from '../../context/InstitutionContext';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/** The student's own printable hall ticket — same layout as the one the Institute Admin
 * prints per section (IntituteAdmin_module_frontend/.../HallTicketTemplate.jsx). Every
 * value comes from GET /student/exams/:examId/hall-ticket. */
export const HallTicketTemplate = ({ exam, section, schedule, student }) => {
  const { institution } = useInstitution();
  const academic = useAcademic();
  const address = [institution?.address, institution?.city, institution?.state].filter(Boolean).join(', ');

  return (
    <div className="print-container hall-ticket bg-white text-slate-900 p-6 rounded-2xl border border-slate-300 max-w-3xl mx-auto">
      {/* Letterhead */}
      <div className="w-full pb-4 border-b-2 border-slate-900 mb-6 text-center">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl border border-slate-300 overflow-hidden flex items-center justify-center p-1 bg-white">
              {institution?.logo ? (
                <img src={institution.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-lg font-bold text-slate-400">{(institution?.code || institution?.name || 'S').charAt(0)}</span>
              )}
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold uppercase tracking-tight leading-tight">{institution?.name || 'Institution'}</h1>
              {institution?.affiliation && <p className="text-[11px] text-slate-700 font-semibold">{institution.affiliation}</p>}
              {address && <p className="text-[10px] text-slate-500">{address}</p>}
            </div>
          </div>
          <div className="text-right border-l pl-4 border-slate-300">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ref / Doc No</p>
            <p className="text-sm font-mono font-bold">{student.admissionNumber}</p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-200">
          <h2 className="text-base font-bold uppercase tracking-wider">Examination Hall Ticket</h2>
          <p className="text-xs text-slate-600">{exam?.name}{exam?.academicYear?.yearName ? ` · ${exam.academicYear.yearName}` : ''}</p>
        </div>
      </div>

      <div className="flex gap-5 mb-4">
        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          <p><span className="text-slate-500">Candidate:</span> <b>{student.name}</b></p>
          <p><span className="text-slate-500">Roll No:</span> <b>{student.rollNumber || '—'}</b></p>
          <p><span className="text-slate-500">Register No:</span> <b>{student.registerNumber || student.admissionNumber}</b></p>
          <p><span className="text-slate-500">Date of Birth:</span> <b>{student.dob ? fmtDate(student.dob) : '—'}</b></p>
          <p><span className="text-slate-500">{academic.label('course')}:</span> <b>{section?.className}</b></p>
          <p><span className="text-slate-500">{academic.label('section')}:</span> <b>{section?.name}</b></p>
        </div>
        <div className="w-24 h-28 border border-slate-300 rounded flex items-center justify-center overflow-hidden shrink-0">
          {student.photo ? <img src={student.photo} alt={student.name} className="w-full h-full object-cover" /> : <span className="text-[10px] text-slate-400 text-center px-1">Affix photo</span>}
        </div>
      </div>

      <table className="w-full text-xs border border-slate-300">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 text-left border-b">Date</th>
            <th className="p-2 text-left border-b">Time</th>
            <th className="p-2 text-left border-b">Subject Code</th>
            <th className="p-2 text-left border-b">Subject</th>
            <th className="p-2 text-left border-b">Venue</th>
            <th className="p-2 text-left border-b">Invigilator Sign</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row, i) => (
            <tr key={i} className="border-b border-slate-200">
              <td className="p-2">{fmtDate(row.examDate)}</td>
              <td className="p-2">{row.startTime} – {row.endTime}</td>
              <td className="p-2 font-mono">{row.code || '—'}</td>
              <td className="p-2">{row.subject}</td>
              <td className="p-2">{row.venue || '—'}</td>
              <td className="p-2" />
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-[10px] text-slate-500 mt-3">Bring this hall ticket and your ID card to every examination. Report 15 minutes before the start time.</p>
      <div className="flex justify-between mt-8 text-[11px] text-slate-600">
        <p className="border-t border-slate-400 pt-1 w-40 text-center">Candidate</p>
        <p className="border-t border-slate-400 pt-1 w-40 text-center">Controller of Examinations</p>
      </div>
    </div>
  );
};

export default HallTicketTemplate;
