import React, { useEffect, useState } from 'react';
import { Users, Loader2, Sparkles } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import clubService from '../../services/clubService';
import ErrorState from '../../components/common/ErrorState';

export const ClubActivitiesPage = () => {
  const { error: showError } = useNotification();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    clubService.getClubs()
      .then((res) => setClubs(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load clubs', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" /> Clubs & Co-Curricular Societies
      </h3>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : clubs.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-500">No clubs have been set up yet.</div>
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => (
            <div key={club.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{club.name}</h4>
                {club.inchargeName && <p className="text-slate-500 mt-0.5">Faculty In-charge: {club.inchargeName}</p>}
              </div>
              <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {club._count?.members ?? 0} members
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubActivitiesPage;
