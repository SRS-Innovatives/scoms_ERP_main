import React from 'react';
import { Search, Filter, Download, Plus } from 'lucide-react';

export const SearchFilterBar = ({
  searchQuery,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions = [],
  placeholder = 'Search...',
  onActionClick,
  actionLabel,
  onExportClick
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400"
        />
      </div>

      {/* Controls Container */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Dropdown Filter */}
        {filterOptions.length > 0 && (
          <div className="relative">
            <select
              value={filterValue}
              onChange={(e) => onFilterChange && onFilterChange(e.target.value)}
              className="pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800 dark:text-slate-200 cursor-pointer appearance-none"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        )}

        {/* Export Button */}
        {onExportClick && (
          <button
            onClick={onExportClick}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export</span>
          </button>
        )}

        {/* Action Button */}
        {actionLabel && onActionClick && (
          <button
            onClick={onActionClick}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchFilterBar;
