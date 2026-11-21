import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Trophy, Loader2, Plus, Minus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import ErrorState from '../../components/common/ErrorState';
import houseService from '../../services/houseService';

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** My House: the student's house, the standings of every house, and recent points. */
export const MyHousePage = () => {
  const [data, setData] = useState(undefined); // undefined = loading, null = not in a house
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setData(undefined);
    houseService.getMyHouse().then((res) => setData(res.data || null)).catch(() => setError(true));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState onRetry={load} />;
  if (data === undefined) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (data === null) {
    return (
      <div className="space-y-6">
        <PageHeader title="My House" subtitle="House / group system" />
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">You haven&apos;t been placed in a house yet.</p>
        </div>
      </div>
    );
  }

  const { house, standings, recentPoints } = data;
  const top = Math.max(1, ...standings.map((h) => h.points));

  return (
    <div className="space-y-6">
      <PageHeader title="My House" subtitle="Your house, its points and where it stands" />

      <div className="p-6 rounded-3xl text-white flex flex-wrap items-center gap-5" style={{ background: `linear-gradient(135deg, ${house.color}, ${house.color}cc)` }}>
        <span className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center"><Shield className="w-8 h-8" /></span>
        <div className="flex-1 min-w-[180px]">
          <h2 className="text-2xl font-black">{house.name}</h2>
          {house.description && <p className="text-sm opacity-90">{house.description}</p>}
          <p className="text-xs opacity-90 mt-1">{house.members} members{house.mentorName ? ` · Mentor: ${house.mentorName}` : ''}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black flex items-center gap-2 justify-end"><Trophy className="w-6 h-6" /> {house.points}</p>
          <p className="text-sm font-semibold opacity-90">Rank {house.rank} of {house.totalHouses}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">House Standings</h3>
          <div className="space-y-3">
            {standings.map((h) => (
              <div key={h.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`font-semibold ${h.id === house.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    #{h.rank} {h.name}{h.id === house.id ? ' (you)' : ''}
                  </span>
                  <span className="font-mono font-bold">{h.points}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(0, (h.points / top) * 100)}%`, backgroundColor: h.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Recent Points — {house.name}</h3>
          {recentPoints.length === 0 ? (
            <p className="text-xs text-slate-500">No points awarded yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentPoints.map((p) => (
                <li key={p.id} className="flex items-center gap-3 text-xs">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${p.points >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'}`}>
                    {p.points >= 0 ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  </span>
                  <span className="flex-1 min-w-0 text-slate-700 dark:text-slate-300">{p.reason}</span>
                  <span className={`font-mono font-bold ${p.points >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{p.points > 0 ? `+${p.points}` : p.points}</span>
                  <span className="text-slate-400 w-24 text-right">{fmt(p.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyHousePage;
