import React, { useState, useEffect } from 'react';
import { Award, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import degreeService from '../../services/degreeService';

export const MyDegreePage = () => {
  const { error: showError } = useNotification();
  const [degrees, setDegrees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    degreeService.getAll()
      .then((res) => setDegrees(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load degree records', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">My Degree</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Convocation and degree issuance records from your institution</p>
      </div>

      {degrees.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <Award className="w-8 h-8 text-slate-300" />
          No degree record yet — this appears once your institution creates one, typically near your graduation/convocation.
        </div>
      ) : (
        <div className="space-y-4">
          {degrees.map((d) => (
            <div key={d.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">{d.degreeName}</h2>
                  {d.degreeNumber && <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">Registry No: {d.degreeNumber}</p>}
                  <p className="text-[11px] text-slate-400 mt-0.5">Issued by {d.issuingInstitution?.name || 'this institution'}</p>
                </div>
                {d.status === 'ISSUED' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Issued
                  </span>
                ) : d.status === 'REVOKED' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">Revoked</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block mb-0.5">Convocation Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{d.convocationDate ? new Date(d.convocationDate).toLocaleDateString('en-IN') : '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Issued Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{d.issuedDate ? new Date(d.issuedDate).toLocaleDateString('en-IN') : '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDegreePage;
