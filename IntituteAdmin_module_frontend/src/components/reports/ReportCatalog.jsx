import React, { useState } from 'react';
import { Search } from 'lucide-react';
import ReportCard from './ReportCard';

const CATEGORY_LABELS = {
  ALL: 'All Reports',
  STUDENT: 'Students',
  STAFF: 'Staff',
  ACADEMIC: 'Academic',
  ATTENDANCE: 'Attendance',
  EXAMINATION: 'Examination',
  FEES: 'Fees',
  FINANCE: 'Finance',
  LIBRARY: 'Library',
  HOSTEL: 'Hostel',
  TRANSPORT: 'Transport',
  ADMISSION: 'Admission',
  COMMUNICATION: 'Communication',
  ADMINISTRATION: 'Administration',
  ANALYTICS: 'Analytics',
  CUSTOM: 'Custom',
};

/** Browsable, searchable, category-filterable catalog — built entirely from whatever the
 * backend's /reports/catalog returns, never a hardcoded report list. */
export const ReportCatalog = ({ reports, onSelect }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  const categoriesPresent = ['ALL', ...new Set(reports.map((r) => r.category))];

  const filtered = reports.filter((r) => {
    const matchCategory = category === 'ALL' || r.category === category;
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categoriesPresent.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
              category === c
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {CATEGORY_LABELS[c] || c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-10">No reports match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <ReportCard key={r.code} report={r} onClick={() => onSelect(r.code)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportCatalog;
