import React from 'react';
import PrintHeader from '../common/PrintHeader';
import { useAcademic } from '../../context/InstitutionContext';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/** One printable hall ticket for one student — every value comes from real records
 * (GET /exams/:examId/hall-tickets). */
export const HallTicketTemplate = ({ exam, section, schedule, student }) => {
  const academic = useAcademic();
  return (
    <div className="print-container hall-ticket bg-white text-slate-900 p-6 rounded-2xl border border-slate-300 max-w-3xl" style={{ breakAfter: 'page' }}>
      <PrintHeader title="EXAMINATION HALL TICKET" subtitle={exam?.name} documentNo={student.admissionNumber} />

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
          {schedule.length === 0 ? (
            <tr><td colSpan={6} className="p-3 text-center text-slate-500">No subjects scheduled for this {academic.label('course').toLowerCase()} yet</td></tr>
          ) : schedule.map((row, i) => (
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
