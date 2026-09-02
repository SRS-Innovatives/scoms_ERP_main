import React, { useState, useEffect } from 'react';
import CertificateTemplate from './CertificateTemplate';
import { useNotification } from '../../context/NotificationContext';
import { FileCheck, Loader2 } from 'lucide-react';
import certificateService from '../../services/certificateService';
import studentService from '../../services/studentService';

/**
 * Shared generator flow for the 5 student certificate types (Bonafide, TC, Conduct,
 * Course Completion, Fee Paid): pick a student (+ optional ad-hoc fields for TC),
 * generate a real numbered Certificate record, then render CertificateTemplate with
 * the assembled data.
 */
export const CertificateGenerator = ({ type, title, subtitle, extraFields = [] }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    studentService.getAll()
      .then((res) => setStudents(res.data || []))
      .catch((err) => notifyError(`Failed to load students: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const handleGenerate = async () => {
    if (!studentId) return;
    setGenerating(true);
    try {
      const res = await certificateService.generate({ studentId, type, details });
      notifySuccess(`Certificate ${res.data.certificate.certificateNo} generated successfully!`);
      setCertData(res.data.certData);
    } catch (error) {
      notifyError(`Failed to generate certificate: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-3 text-xs no-print">
        <div className="md:col-span-2">
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Student</label>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
            <option value="">Select student...</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.rollNumber || s.admissionNumber} — {s.firstName} {s.lastName}</option>)}
          </select>
        </div>
        {extraFields.map((f) => (
          <div key={f.name}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{f.label}</label>
            <input
              type="text"
              value={details[f.name] || ''}
              onChange={(e) => setDetails((prev) => ({ ...prev, [f.name]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
            />
          </div>
        ))}
        <div className="md:col-span-3 flex justify-end">
          <button onClick={handleGenerate} disabled={!studentId || generating} className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50">
            <FileCheck className="w-4 h-4" /> {generating ? 'Generating...' : 'Generate Certificate'}
          </button>
        </div>
      </div>

      {certData && <CertificateTemplate type={type.toLowerCase()} certData={certData} />}
    </div>
  );
};

export default CertificateGenerator;
