import React, { useState, useEffect, useCallback } from 'react';
import PrintHeader from '../../components/common/PrintHeader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { Printer, FileText, Loader2 } from 'lucide-react';
import examService from '../../services/examService';
import studentService from '../../services/studentService';
import marksheetService from '../../services/marksheetService';

export const MarksheetTemplatePage = () => {
  const { notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [examId, setExamId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [error, setError] = useState(false);

  const loadOptions = useCallback(() => {
    setLoadingOptions(true);
    setError(false);
    Promise.all([examService.getExams(), studentService.getAll()])
      .then(([examRes, studentRes]) => {
        setExams(examRes.data || []);
        setStudents(studentRes.data || []);
        if ((examRes.data || []).length > 0) setExamId(examRes.data[0].id);
        if ((studentRes.data || []).length > 0) setStudentId(studentRes.data[0].id);
      })
      .catch((err) => { notifyError(`Failed to load options: ${err.message}`); setError(true); })
      .finally(() => setLoadingOptions(false));
  }, [notifyError]);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  const generate = useCallback(() => {
    if (!examId || !studentId) return;
    setLoadingSheet(true);
    marksheetService.getMarksheet(studentId, examId)
      .then((res) => setSheet(res.data))
      .catch((err) => notifyError(`Failed to generate marksheet: ${err.message}`))
      .finally(() => setLoadingSheet(false));
  }, [examId, studentId, notifyError]);

  useEffect(() => { generate(); }, [generate]);

  if (loadingOptions) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={loadOptions} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Official Marksheet / Grade Sheet</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real per-student marks with SGPA/CGPA from your configured Grade Scale</p>
        </div>
        {sheet?.sgpa !== null && sheet && (
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md">
            <Printer className="w-4 h-4" /> Print
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Exam</label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold">
            {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Student</label>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold">
            {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>)}
          </select>
        </div>
      </div>

      {loadingSheet ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : !sheet || sheet.subjects.length === 0 ? (
        <EmptyState title="No Marks Entered Yet" description="This student has no marks entered for the selected exam yet." icon={FileText} />
      ) : (
        <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-xl max-w-4xl mx-auto print-container my-6">
          <PrintHeader title="GRADE SHEET / MARKSHEET" subtitle={sheet.exam?.name} documentNo={`MS/${sheet.student.admissionNumber}`} />

          <div className="grid grid-cols-2 gap-4 text-xs border-b pb-4 mb-4">
            <div>
              <p><span className="text-slate-500">Student Name:</span> <span className="font-bold">{sheet.student.firstName} {sheet.student.lastName}</span></p>
              <p><span className="text-slate-500">Admission No:</span> <span className="font-mono font-bold text-indigo-900">{sheet.student.admissionNumber}</span></p>
              <p><span className="text-slate-500">Roll No:</span> <span className="font-mono font-bold text-indigo-900">{sheet.student.rollNumber || '—'}</span></p>
            </div>
            <div className="text-right">
              <p><span className="text-slate-500">Class/Course:</span> <span className="font-bold">{sheet.student.section?.semester?.course?.name || '—'}</span></p>
              <p><span className="text-slate-500">Semester:</span> <span className="font-bold">{sheet.student.section?.semester?.name || '—'}</span></p>
              <p><span className="text-slate-500">Section:</span> <span className="font-bold">{sheet.student.section?.name || '—'}</span></p>
            </div>
          </div>

          <table className="w-full text-xs text-left mb-6 border border-slate-300">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-300">
                <th className="p-2 border-r">Subject Code</th>
                <th className="p-2 border-r">Subject Title</th>
                <th className="p-2 border-r text-center">Credit</th>
                <th className="p-2 border-r text-center">Marks</th>
                <th className="p-2 border-r text-center">Grade</th>
                <th className="p-2 border-r text-center">Grade Point</th>
                <th className="p-2 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sheet.subjects.map((m, idx) => (
                <tr key={idx}>
                  <td className="p-2 border-r font-mono font-bold">{m.code}</td>
                  <td className="p-2 border-r font-semibold">{m.title}</td>
                  <td className="p-2 border-r text-center font-mono">{m.credit}</td>
                  <td className="p-2 border-r text-center font-mono">{m.marksObtained}/{m.maxMarks}</td>
                  <td className="p-2 border-r text-center font-mono font-bold text-indigo-900">{m.grade || '—'}</td>
                  <td className="p-2 border-r text-center font-mono">{m.gradePoint ?? '—'}</td>
                  <td className={`p-2 text-center font-bold ${m.result === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}`}>{m.result}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-slate-50 p-4 rounded-xl border flex items-center justify-between text-xs font-bold mb-6 flex-wrap gap-2">
            <span>Semester GPA (SGPA): <span className="text-indigo-900 font-mono text-sm">{sheet.sgpa !== null ? `${sheet.sgpa} / 10.0` : 'No grade scale configured'}</span></span>
            <span>Cumulative GPA (CGPA): <span className="text-indigo-900 font-mono text-sm">{sheet.cgpa !== null ? `${sheet.cgpa} / 10.0` : '—'}</span></span>
            {sheet.classification && <span className="text-emerald-700 uppercase">{sheet.classification}</span>}
          </div>

          <div className="pt-12 flex justify-between text-xs">
            <p className="border-t border-slate-400 w-36 pt-1 font-semibold text-center">Verified By</p>
            <p className="border-t border-slate-900 w-44 pt-1 font-bold text-center">Controller of Examinations</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarksheetTemplatePage;
