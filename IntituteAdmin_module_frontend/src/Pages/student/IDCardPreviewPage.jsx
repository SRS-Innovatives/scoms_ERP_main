import React, { useEffect, useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { useInstitution } from '../../context/InstitutionContext';
import studentService from '../../services/studentService';

export const IDCardPreviewPage = () => {
  const { notifyError } = useNotification();
  const { institution } = useInstitution();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    studentService.getById(id)
      .then((res) => setStudent(res.data))
      .catch((err) => notifyError(`Failed to load student: ${err.message}`))
      .finally(() => setLoading(false));
  }, [id, notifyError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!student) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500">
        Select a student from the Student Directory to generate an ID card.
      </div>
    );
  }

  const fullName = `${student.firstName} ${student.lastName}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Smart ID Card Generator</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Printable identity card format for library, attendance & campus gates</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-8 no-print">
        <div className="w-72 h-[440px] bg-linear-to-b from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl shadow-2xl p-5 border-2 border-indigo-500/30 flex flex-col justify-between relative overflow-hidden text-center">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">{institution?.code || institution?.name || 'SCOMS'}</h3>
            <p className="text-[9px] text-indigo-200 font-semibold">{institution?.name || 'Institution'}</p>
            <p className="text-[8px] text-indigo-300/80">STUDENT IDENTITY CARD</p>
          </div>

          <div className="my-2">
            <div className="w-24 h-28 mx-auto rounded-xl border-2 border-white/80 overflow-hidden shadow-lg bg-white p-0.5 flex items-center justify-center">
              {student.user?.avatar ? (
                <img src={student.user.avatar} alt={fullName} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-indigo-900 text-2xl font-bold">{fullName.charAt(0)}</span>
              )}
            </div>
            <h4 className="text-sm font-bold text-white mt-2 leading-tight">{fullName}</h4>
            <p className="text-[10px] font-semibold text-amber-300 uppercase">{student.course?.name}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 text-[10px] space-y-1 text-left border border-white/10">
            <p><span className="text-indigo-200">Roll No:</span> <span className="font-mono font-bold text-white">{student.rollNumber || '—'}</span></p>
            <p><span className="text-indigo-200">Reg No:</span> <span className="font-mono font-bold text-white">{student.registerNumber || student.admissionNumber}</span></p>
            <p><span className="text-indigo-200">Blood Group:</span> <span className="font-bold text-rose-300">{student.bloodGroup || '—'}</span></p>
            <p><span className="text-indigo-200">Section:</span> <span className="font-bold text-white">{student.section?.name || '—'}</span></p>
          </div>

          <div className="pt-1 border-t border-white/20">
            <div className="h-6 bg-white rounded flex items-center justify-center font-mono text-[9px] text-slate-900 font-bold tracking-widest">
              {(student.admissionNumber || '').replace(/[^A-Z0-9]/gi, ' ')}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print ID Card</span>
        </button>
      </div>
    </div>
  );
};

export default IDCardPreviewPage;
