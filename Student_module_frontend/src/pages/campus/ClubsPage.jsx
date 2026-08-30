import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { Users, UserCheck, Loader2, Sparkles } from 'lucide-react';
import clubService from '../../services/clubService';

export const ClubsPage = () => {
  const { success, error: showError } = useNotification();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    clubService.getClubs()
      .then((res) => setClubs(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load clubs', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async (club) => {
    setJoining(club.id);
    try {
      await clubService.join(club.id);
      success(`Joined ${club.name}`, 'Club Membership');
      load();
    } catch (err) {
      showError(err.message || 'Failed to join club', 'Join Failed');
    } finally {
      setJoining(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clubs & Societies" subtitle="Join co-curricular clubs and societies run by your institution." />

      {clubs.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <Sparkles className="w-8 h-8 text-slate-300" /> No clubs have been set up yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clubs.map((club) => (
            <div key={club.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{club.name}</h3>
              {club.description && <p className="text-xs text-slate-500">{club.description}</p>}
              <p className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                {club.inchargeName && <span>Faculty In-charge: {club.inchargeName}</span>}
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-indigo-500" /> {club._count?.members ?? 0} members</span>
              </p>

              {club.isMember ? (
                <button disabled className="w-full py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Member
                </button>
              ) : (
                <button
                  onClick={() => handleJoin(club)}
                  disabled={joining === club.id}
                  className="w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {joining === club.id ? 'Joining...' : 'Join Club'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubsPage;
