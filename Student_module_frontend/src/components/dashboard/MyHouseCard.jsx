import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Trophy, ChevronRight } from 'lucide-react';
import houseService from '../../services/houseService';

/** Dashboard card: the student's house, points and rank. Renders nothing when the student
 * isn't in a house (or the institution doesn't use houses). */
export const MyHouseCard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    houseService.getMyHouse().then((res) => setData(res.data || null)).catch(() => setData(null));
  }, []);

  if (!data?.house) return null;
  const { house } = data;

  return (
    <button
      onClick={() => navigate('/student/house')}
      className="w-full text-left flex items-center gap-4 p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
      style={{ borderLeft: `6px solid ${house.color}` }}
    >
      <span className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: house.color }}>
        <Shield className="w-6 h-6" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">My House</span>
        <span className="block text-lg font-black text-slate-900 dark:text-white truncate">{house.name}</span>
        <span className="block text-xs text-slate-500">{house.members} members{house.mentorName ? ` · Mentor: ${house.mentorName}` : ''}</span>
      </span>
      <span className="text-right shrink-0">
        <span className="flex items-center justify-end gap-1 text-xl font-black text-slate-900 dark:text-white">
          <Trophy className="w-4 h-4 text-amber-500" /> {house.points}
        </span>
        <span className="block text-xs font-semibold text-slate-500">Rank {house.rank} of {house.totalHouses}</span>
      </span>
      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
    </button>
  );
};

export default MyHouseCard;
