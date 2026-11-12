import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import circularService from '../../services/circularService';

/** Official circulars published by the institution office (numbered, signed, with a PDF). */
export const CircularsPage = () => {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    circularService.getAll()
      .then((res) => setCirculars(res.data || []))
      .catch((err) => setError(err.message || 'Failed to load circulars'))
      .finally(() => setLoading(false));
  }, []);

  const download = async (c) => {
    setDownloading(c.id);
    try {
      const res = await circularService.getById(c.id);
      const a = document.createElement('a');
      a.href = res.data.attachment;
      a.download = res.data.attachmentName || `${c.refNo}.pdf`;
      a.click();
    } catch (err) {
      setError(`Download failed: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Official Circulars</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Numbered circulars issued by the institution office</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900 text-center text-xs text-rose-600 dark:text-rose-400">{error}</div>
      ) : circulars.length === 0 ? (
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">No circulars issued yet.</div>
      ) : (
        <div className="space-y-3">
          {circulars.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 shrink-0"><FileText className="w-5 h-5" /></div>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-bold text-indigo-600">{c.refNo} · {new Date(c.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.title}</h3>
                  {c.description && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{c.description}</p>}
                  <p className="text-[11px] text-slate-500 mt-1">Issued by {c.issuedBy}</p>
                </div>
              </div>
              {c.hasAttachment && (
                <button onClick={() => download(c)} disabled={downloading === c.id} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
                  {downloading === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Download
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CircularsPage;
