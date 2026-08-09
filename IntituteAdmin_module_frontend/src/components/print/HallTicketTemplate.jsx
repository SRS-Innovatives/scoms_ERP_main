import React from 'react';
import PrintHeader from '../common/PrintHeader';
import { Printer } from 'lucide-react';

export const HallTicketTemplate = ({ student, examData }) => {
  const data = student || {
    name: "Kavitha R. Sharma",
    rollNo: "21CS101",
    regNo: "311521104001",
    course: "B.E. Computer Science & Engineering",
    semester: "Semester 6",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    examCenter: "Main Academic Block - Examination Hall A3",
    schedule: [
      { code: "CS8601", title: "Mobile Computing", date: "2025-09-15", session: "FN (09:30 AM - 12:30 PM)" },
      { code: "CS8602", title: "Compiler Design", date: "2025-09-17", session: "FN (09:30 AM - 12:30 PM)" },
      { code: "CS8603", title: "Artificial Intelligence", date: "2025-09-19", session: "FN (09:30 AM - 12:30 PM)" },
      { code: "CS8691", title: "Cloud Computing Laboratory", date: "2025-09-22", session: "AN (01:30 PM - 04:30 PM)" }
    ]
  };

  return (
    <div className="w-full">
      <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-xl max-w-4xl mx-auto print-container my-6">
        <PrintHeader title="UNIVERSITY EXAMINATION HALL TICKET" subtitle="Even Semester End Examinations 2025" documentNo="HT/2025/CS101" />

        <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-4 mb-6 text-xs">
          <div className="space-y-1.5 flex-1">
            <p><span className="text-slate-500 font-semibold uppercase">Student Name:</span> <span className="font-bold text-sm text-slate-900">{data.name}</span></p>
            <p><span className="text-slate-500 font-semibold uppercase">Register Number:</span> <span className="font-mono font-bold text-indigo-900 text-sm">{data.regNo}</span></p>
            <p><span className="text-slate-500 font-semibold uppercase">Roll Number:</span> <span className="font-mono font-bold">{data.rollNo}</span></p>
            <p><span className="text-slate-500 font-semibold uppercase">Degree / Branch:</span> <span className="font-semibold">{data.course}</span></p>
            <p><span className="text-slate-500 font-semibold uppercase">Exam Hall / Venue:</span> <span className="font-bold text-slate-900">{data.examCenter}</span></p>
          </div>

          <div className="text-center shrink-0">
            <div className="w-28 h-32 border-2 border-slate-400 rounded-lg overflow-hidden p-1 bg-slate-50">
              <img src={data.photo} alt="Student" className="w-full h-full object-cover rounded" />
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Student Photo</p>
          </div>
        </div>

        {/* Exam Schedule */}
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Registered Courses & Timetable</h4>
        <table className="w-full text-xs text-left mb-6 border border-slate-300">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
              <th className="p-2.5 border-r border-slate-300">Course Code</th>
              <th className="p-2.5 border-r border-slate-300">Course Title</th>
              <th className="p-2.5 border-r border-slate-300">Date of Exam</th>
              <th className="p-2.5 border-r border-slate-300">Session & Timing</th>
              <th className="p-2.5 text-center">Invigilator Sign</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.schedule.map((item, idx) => (
              <tr key={idx}>
                <td className="p-2.5 font-mono font-bold border-r border-slate-300 text-indigo-900">{item.code}</td>
                <td className="p-2.5 font-semibold border-r border-slate-300">{item.title}</td>
                <td className="p-2.5 font-semibold border-r border-slate-300">{item.date}</td>
                <td className="p-2.5 border-r border-slate-300">{item.session}</td>
                <td className="p-2.5 border-dashed border-slate-300"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Instructions */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] text-slate-700 mb-6 space-y-1">
          <p className="font-bold text-slate-900 uppercase">Important Candidate Instructions:</p>
          <p>1. Candidates must present this Hall Ticket along with valid College ID Card at the examination hall entrance.</p>
          <p>2. Electronic gadgets, smart watches, and programmable calculators are strictly prohibited inside the exam hall.</p>
          <p>3. Candidates will not be allowed to enter the exam hall 15 minutes after the commencement of examination.</p>
        </div>

        {/* Signatures */}
        <div className="pt-8 flex items-end justify-between text-xs">
          <div className="text-center">
            <p className="border-t border-slate-400 w-36 pt-1 font-semibold text-slate-700">Student Signature</p>
          </div>
          <div className="text-center">
            <p className="border-t border-slate-400 w-36 pt-1 font-semibold text-slate-700">HOD Signature</p>
          </div>
          <div className="text-center">
            <p className="border-t border-slate-400 w-44 pt-1 font-bold text-slate-900">Controller of Examinations</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center no-print mt-4">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print Hall Ticket</span>
        </button>
      </div>
    </div>
  );
};

export default HallTicketTemplate;
