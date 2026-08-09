import React from 'react';
import { Search, Filter, Download, Plus, Printer, RefreshCw } from 'lucide-react';

export const SearchFilterBar = ({
  searchQuery = '',
  onSearchChange,
  placeholder = 'Search by name, roll no, reg no...',
  filters = [],
  onFilterChange,
  onAddClick,
  addLabel = 'Add New',
  onExportClick,
  onPrintClick,
  onRefreshClick
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs mb-5">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[260px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f, idx) => (
          <div key={idx} className="relative flex items-center">
            <select
              value={f.value}
              onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
              className="pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">{f.label}: All</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 absolute right-2.5 pointer-events-none text-slate-400" />
          </div>
        ))}

        {/* Refresh Action */}
        {onRefreshClick && (
          <button
            onClick={onRefreshClick}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Print Action */}
        {onPrintClick && (
          <button
            onClick={onPrintClick}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        )}

        {/* Export Action */}
        {onExportClick && (
          <button
            onClick={onExportClick}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        )}

        {/* Add New Action */}
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{addLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchFilterBar;
