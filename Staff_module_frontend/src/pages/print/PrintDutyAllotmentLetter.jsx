import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, ClipboardList } from 'lucide-react';
import PrintLayout from '../../components/print/PrintLayout';
import ErrorState from '../../components/common/ErrorState';
import examService from '../../services/examService';
import { useInstitution } from '../../context/InstitutionContext';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const shortDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Exam Duty Allotment Letter — the duties the Institute Admin allotted to me for one exam
 * (Examination → Exam Duties), printed on the institution's letterhead. */
export const PrintDutyAllotmentLetter = () => {
  const { institution } = useInstitution();
  const [data, setData] = useState(null);
  const [examId, setExamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await examService.getMyDuties();
      setData(res.data);
      const exams = res.data?.exams || [];
      // default: the exam with the next upcoming duty, else the latest exam
      const upcoming = exams.find((g) => g.duties.some((d) => d.upcoming));
      setExamId((upcoming || exams[0])?.exam.id || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const exams = data?.exams || [];
  if (exams.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-2xl mx-auto space-y-2">
        <ClipboardList className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
        <p>No exam duties have been allotted to you yet. When the Institute Admin allots one, you'll get a notification and your letter will be ready here.</p>
      </div>
    );
  }

  const group = exams.find((g) => g.exam.id === examId) || exams[0];
  const me = data.staff || {};
  const docNo = `EXD-${group.exam.id.slice(0, 6).toUpperCase()}-${String(me.employeeCode || '').toUpperCase()}`;

  return (
    <div className="space-y-4">
      {exams.length > 1 && (
        <div className="no-print flex justify-end">
          <select value={group.exam.id} onChange={(e) => setExamId(e.target.value)} className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            {exams.map((g) => <option key={g.exam.id} value={g.exam.id}>{g.exam.name} ({g.duties.length} {g.duties.length === 1 ? 'duty' : 'duties'})</option>)}
          </select>
        </div>
      )}

      <PrintLayout title="Exam Duty Allotment Letter" documentNo={docNo} signatures={['Staff Signature (Acknowledged)', 'Chief Superintendent', 'Principal Stamp & Signature']}>
        <div className="text-xs space-y-4 leading-relaxed">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <p><span className="text-slate-500">To:</span> <strong>{me.name}</strong></p>
            <p><span className="text-slate-500">Employee Code:</span> <strong>{me.employeeCode || '—'}</strong></p>
            <p><span className="text-slate-500">Designation:</span> {me.designation || '—'}</p>
            <p><span className="text-slate-500">Department:</span> {me.department || '—'}</p>
          </div>

          <p>
            <strong>Subject:</strong> Allotment of examination duty — {group.exam.name}
            {group.exam.startDate && ` (${shortDate(group.exam.startDate)} to ${shortDate(group.exam.endDate)})`}
          </p>

          <p>
            Dear {me.name},<br />
            You have been allotted the following duties for the <strong>{group.exam.name}</strong>. Please report at the examination
            venue at least <strong>30 minutes</strong> before the start of each session, collect the question papers and answer
            booklets from the Chief Superintendent, and remain on duty until all answer scripts are collected and handed over.
          </p>

          <table className="w-full text-left border border-slate-400">
            <thead className="bg-slate-200 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-2 border border-slate-400">#</th>
                <th className="p-2 border border-slate-400">Date</th>
                <th className="p-2 border border-slate-400">Time</th>
                <th className="p-2 border border-slate-400">Paper</th>
                <th className="p-2 border border-slate-400">Class</th>
                <th className="p-2 border border-slate-400">Room / Hall</th>
                <th className="p-2 border border-slate-400">Duty</th>
              </tr>
            </thead>
            <tbody>
              {group.duties.map((d, i) => (
                <tr key={d.id}>
                  <td className="p-2 border border-slate-300">{i + 1}</td>
                  <td className="p-2 border border-slate-300 whitespace-nowrap font-semibold">{fmtDate(d.date)}</td>
                  <td className="p-2 border border-slate-300 whitespace-nowrap">{d.startTime}–{d.endTime}</td>
                  <td className="p-2 border border-slate-300">{d.subject}{d.subjectCode ? ` (${d.subjectCode})` : ''}{d.remarks ? <span className="block text-[10px] text-slate-500">{d.remarks}</span> : null}</td>
                  <td className="p-2 border border-slate-300">{d.className}</td>
                  <td className="p-2 border border-slate-300">{d.room || 'To be announced'}</td>
                  <td className="p-2 border border-slate-300 font-bold">{d.roleLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-700">
            <li>Mobile phones and electronic devices are not permitted in the examination hall during duty.</li>
            <li>Verify each candidate's hall ticket and identity, and record absentees on the attendance sheet.</li>
            <li>Report any malpractice to the Chief Superintendent immediately.</li>
            <li>If you cannot attend a duty, inform the examination office in writing in advance so a reliever can be arranged.</li>
          </ul>

          <p className="pt-2">
            For {institution?.name || 'the institution'}
            {institution?.principalName && <><br /><strong>{institution.principalName}</strong>, Principal</>}
          </p>
        </div>
      </PrintLayout>
    </div>
  );
};

export default PrintDutyAllotmentLetter;
