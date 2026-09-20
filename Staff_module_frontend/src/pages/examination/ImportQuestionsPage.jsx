import React, { useEffect, useState } from 'react';
import FileUpload from '../../components/common/FileUpload';
import { UploadCloud, Loader2, Download, CheckCircle2, XCircle } from 'lucide-react';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

const TEMPLATE_HEADER = 'chapter,topic,type,difficulty,marks,questionText,options,correctAnswer';
const TEMPLATE_SAMPLE = 'Optics,Refraction,MCQ,EASY,1,"What is the speed of light in vacuum?","3x10^8 m/s|3x10^6 m/s|3x10^10 m/s","3x10^8 m/s"';

/** Minimal CSV line parser supporting double-quoted fields containing commas. */
const parseCsvLine = (line) => {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
};

export const ImportQuestionsPage = () => {
  const { success, error: showError } = useNotification();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [error, setError] = useState(false);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const loadSubjects = () => {
    setLoadingSubjects(true);
    setError(false);
    examService.getMySubjects()
      .then((res) => {
        const list = res.data || [];
        setSubjects(list);
        if (list.length > 0) setSubjectId(list[0].id);
      })
      .catch((err) => { showError(err.message || 'Failed to load subjects', 'Load Failed'); setError(true); })
      .finally(() => setLoadingSubjects(false));
  };

  useEffect(loadSubjects, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImport = async () => {
    if (!file) return;
    if (!subjectId) {
      showError('Select a subject first', 'Missing Subject');
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
      const [, ...rows] = lines; // skip header row

      let succeeded = 0;
      const failures = [];
      for (const line of rows) {
        const [chapter, topic, type, difficulty, marks, questionText, optionsRaw, correctAnswer] = parseCsvLine(line);
        if (!questionText || !correctAnswer) {
          failures.push(`Skipped row (missing question/answer): ${line.slice(0, 60)}`);
          continue;
        }
        try {
          await examService.createQuestion({
            subjectId,
            chapter: chapter || undefined,
            topic: topic || undefined,
            type: (type || 'MCQ').toUpperCase(),
            difficulty: (difficulty || 'MEDIUM').toUpperCase(),
            marks: Number(marks) || 1,
            questionText,
            options: optionsRaw ? optionsRaw.split('|').map((o) => o.trim()).filter(Boolean) : undefined,
            correctAnswer,
          });
          succeeded += 1;
        } catch (err) {
          failures.push(`"${questionText.slice(0, 40)}...": ${err.message}`);
        }
      }

      setResult({ total: rows.length, succeeded, failures });
      if (succeeded > 0) success(`${succeeded} of ${rows.length} question(s) imported successfully.`, 'Import Complete');
    } catch (err) {
      showError(err.message || 'Failed to read/parse the file', 'Import Failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([`${TEMPLATE_HEADER}\n${TEMPLATE_SAMPLE}\n`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_bank_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingSubjects) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={loadSubjects} />;
  }

  if (subjects.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-2xl">
        You have no assigned subjects yet. Ask your Institute Admin to assign you to a subject/section before importing questions.
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-indigo-500" /> Bulk Import Questions (CSV)
      </h3>

      <div className="flex items-center justify-between text-xs">
        <p className="text-slate-500 dark:text-slate-400">
          Columns: chapter, topic, type, difficulty, marks, questionText, options (separated by <code>|</code>), correctAnswer
        </p>
        <button onClick={downloadTemplate} className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold shrink-0 ml-2">
          <Download className="w-3.5 h-3.5" /> Template
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Subject</label>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.course?.name})</option>)}
        </select>
      </div>

      <FileUpload label="Upload CSV containing Question Bank structure" accept=".csv" onFileSelect={setFile} />

      <button
        onClick={handleImport}
        disabled={!file || importing}
        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
      >
        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
        {importing ? 'Importing...' : 'Import Questions'}
      </button>

      {result && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <p className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> {result.succeeded} of {result.total} imported successfully.
          </p>
          {result.failures.length > 0 && (
            <div className="pt-1 border-t border-slate-200 dark:border-slate-700 mt-1 space-y-0.5 max-h-32 overflow-y-auto">
              {result.failures.map((f, idx) => (
                <p key={idx} className="flex items-start gap-1.5 text-rose-600 dark:text-rose-400">
                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {f}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportQuestionsPage;
