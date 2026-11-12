import React, { useState } from 'react';
import FormSection from '../../components/common/FormSection';
import DataTable from '../../components/common/DataTable';
import { useNotification } from '../../context/NotificationContext';
import { useAcademic } from '../../context/InstitutionContext';
import attendanceService from '../../services/attendanceService';
import { Fingerprint, Upload, Download, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Import the CSV/Excel export of a biometric / RFID attendance device as daily attendance.
 * Two steps: Preview (validates, writes nothing) -> Import (writes the class-day sheets).
 */
export const BiometricImportPage = () => {
  const academic = useAcademic();
  const { notifySuccess, notifyError } = useNotification();
  const [file, setFile] = useState(null);
  const [markAbsent, setMarkAbsent] = useState(false);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const reset = (f) => { setFile(f); setPreview(null); };

  const run = async (mode) => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await attendanceService.importBiometric(file, { mode, markAbsent });
      setPreview(res.data);
      if (mode === 'commit') {
        notifySuccess(`${res.data.sessionsCreated} new and ${res.data.sessionsUpdated} updated attendance sheet(s)`, 'Biometric Imported');
      }
    } catch (err) {
      notifyError(err.message, mode === 'commit' ? 'Import failed' : 'Could not read the file');
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const { blob } = await attendanceService.downloadBiometricTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'biometric_import_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notifyError(err.message);
    }
  };

  const sessionColumns = [
    { header: 'Date', key: 'date', render: (val) => <span className="font-mono">{val}</span> },
    { header: `${academic.label('course')} / ${academic.label('section')}`, key: 'className', render: (val) => <span className="font-semibold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Present', key: 'present', render: (val) => <span className="font-bold text-emerald-600">{val}</span> },
    { header: 'Absent', key: 'absent', render: (val) => <span className="font-bold text-rose-600">{val}</span> },
    { header: 'Other (Late/Leave/OD)', key: 'other' },
  ];
  const errorColumns = [
    { header: 'Row', key: 'row', render: (val) => val ?? '—' },
    { header: 'Admission No', key: 'admissionNumber', render: (val) => <span className="font-mono">{val || '—'}</span> },
    { header: 'Problem', key: 'error', render: (val) => <span className="text-rose-600">{val}</span> },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Biometric Attendance Import</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Upload the export from your fingerprint / RFID / face-recognition device (eSSL, ZKTeco, Matrix…) — punches become each {academic.label('section').toLowerCase()}'s daily attendance</p>
      </div>

      <FormSection title="1. Upload device export" subtitle="CSV or Excel with columns: Admission Number, Date — optional: In Time, Status (P / A / LATE / LEAVE / HD / OD)" icon={Fingerprint}>
        <div className="space-y-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-indigo-400">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">{file ? file.name : 'Choose .csv / .xlsx file'}</span>
              <input type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => reset(e.target.files?.[0] || null)} />
            </label>
            <button type="button" onClick={downloadTemplate} className="flex items-center gap-1.5 text-indigo-600 font-semibold hover:underline">
              <Download className="w-3.5 h-3.5" /> Download sample file
            </button>
          </div>
          <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={markAbsent} onChange={(e) => { setMarkAbsent(e.target.checked); setPreview(null); }} className="w-4 h-4 rounded text-indigo-600" />
            Mark students with no punch as ABSENT (only for the {academic.label('section').toLowerCase()}s and dates in the file)
          </label>
          <p className="text-slate-500">A row with no Status counts as PRESENT. Re-importing the same day updates that day's sheet instead of duplicating it.</p>
          <div className="flex gap-2">
            <button type="button" disabled={!file || busy} onClick={() => run('preview')} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg font-semibold disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Preview
            </button>
            <button type="button" disabled={!preview || preview.committed || !preview.sessions?.length || busy} onClick={() => run('commit')} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50">
              <CheckCircle2 className="w-4 h-4" /> Import {preview?.sessions?.length ? `${preview.sessions.length} sheet(s)` : ''}
            </button>
          </div>
        </div>
      </FormSection>

      {preview && (
        <>
          <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${preview.committed ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40'}`}>
            <CheckCircle2 className="w-4 h-4" />
            {preview.committed
              ? `Saved — ${preview.validRows} punch(es), ${preview.sessionsCreated} new and ${preview.sessionsUpdated} updated sheet(s).`
              : `Preview — ${preview.validRows} valid punch(es) across ${preview.sessions.length} class-day sheet(s). Nothing saved yet.`}
          </div>
          <FormSection title="Attendance sheets" subtitle="One row per class per day">
            <DataTable columns={sessionColumns} data={preview.sessions.map((s) => ({ ...s, id: `${s.sectionId}-${s.date}` }))} />
          </FormSection>
          {preview.errors?.length > 0 && (
            <FormSection title={`${preview.errors.length} row(s) skipped`} subtitle="Fix these in the file and import again" icon={AlertTriangle}>
              <DataTable columns={errorColumns} data={preview.errors.map((e, i) => ({ ...e, id: i }))} />
            </FormSection>
          )}
        </>
      )}
    </div>
  );
};

export default BiometricImportPage;
