import React, { useState } from 'react';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import { Download, SlidersHorizontal, ChevronUp, ChevronDown, CheckSquare, Square } from 'lucide-react';

export const DataTable = ({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = 'Search records...',
  filterOptions = [],
  onExport,
  onBulkAction,
  bulkActionLabel = 'Bulk Action',
  keyField = 'id'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedRows, setSelectedRows] = useState([]);

  // Search & Filter
  const filteredData = data.filter(row => {
    const matchesSearch = searchQuery === '' || Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesFilter = selectedFilter === 'All' || Object.values(row).some(val => String(val) === selectedFilter);
    return matchesSearch && matchesFilter;
  });

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map(r => r[keyField]));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex-1 min-w-[240px]">
          {searchable && (
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={searchPlaceholder}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {filterOptions.length > 0 && (
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {filterOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          {selectedRows.length > 0 && onBulkAction && (
            <button
              onClick={() => onBulkAction(selectedRows)}
              className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
            >
              {bulkActionLabel} ({selectedRows.length})
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {paginatedData.length === 0 ? (
        <EmptyState title="No matching records" message="Try broadening your search or filter parameters." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600">
                    {selectedRows.length === paginatedData.length && paginatedData.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key || col.header}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={`px-4 py-3 ${col.sortable !== false ? 'cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.header}</span>
                      {sortField === col.key && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-500" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedData.map((row) => {
                const isSelected = selectedRows.includes(row[keyField]);
                return (
                  <tr
                    key={row[keyField]}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                      isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelectRow(row[keyField])} className="text-slate-400 hover:text-indigo-600">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    {columns.map((col) => (
                      <td key={col.key || col.header} className="px-4 py-3">
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default DataTable;
