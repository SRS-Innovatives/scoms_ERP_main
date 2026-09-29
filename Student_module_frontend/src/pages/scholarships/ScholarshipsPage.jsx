import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Award, Loader2, Gift } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';
import feeService from '../../services/feeService';

export const ScholarshipsPage = () => {
  const { error: showError } = useNotification();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    feeService.getFees()
      .then((res) => setScholarships((res.data || []).filter((a) => a.discountAmount > 0)))
      .catch((err) => { showError(err.message || 'Failed to load scholarships', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Scholarships & Financial Aid" subtitle="Fee concessions and scholarships applied to your account by the institution." />

      {scholarships.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <Gift className="w-8 h-8 text-slate-300" />
          No scholarships or fee concessions applied yet. Contact the Fee Office to check your eligibility.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scholarships.map((sch) => (
            <div key={sch.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{sch.scholarshipName || 'Fee Concession'}</h3>
                    <p className="text-xs text-slate-500">{sch.feeStructure?.name}{sch.scholarshipRef ? ` • Ref: ${sch.scholarshipRef}` : ''}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center text-xs">
                <span className="text-slate-500">Concession Value:</span>
                <span className="font-bold text-emerald-600 text-sm">₹{sch.discountAmount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScholarshipsPage;
