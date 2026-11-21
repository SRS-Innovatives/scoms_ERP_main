import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import {
  Activity, ShieldAlert, Eye, X,
  User, Terminal, RefreshCw, Loader2, Filter, Layers,
} from 'lucide-react';
import auditLogService from '../../services/auditLogService';
import institutionService from '../../services/institutionService';

const PAGE_SIZE = 50;
const moduleLabel = (m) => String(m || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Institution Activity — the real audit ledger only (no sample rows). Filters by institution
 * and module run on the server; totals come from the server, not from the rows on screen.
 */
export const InstitutionActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedInstId, setSelectedInstId] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  // institutions for the filter — once
  useEffect(() => {
    institutionService.getInstitutions({ limit: 100 })
      .then((res) => setInstitutions(res?.data || []))
      .catch(() => {});
  }, []);

  // the modules that really have records (for this institution, if one is chosen)
  useEffect(() => {
    auditLogService.getModules(selectedInstId ? { institutionId: selectedInstId } : {})
      .then((res) => setModules(res?.data || []))
      .catch(() => setModules([]));
  }, [selectedInstId]);

  const fetchLogs = async (toPage = page) => {
    try {
      setLoading(true);
      setLoadError('');
      const params = { page: toPage, limit: PAGE_SIZE };
      if (selectedInstId) params.institutionId = selectedInstId;
      if (selectedModule) params.module = selectedModule;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await auditLogService.getAuditLogs(params);
      setLogs(Array.isArray(res?.data) ? res.data : []);
      setMeta({ total: res?.meta?.total ?? 0, totalPages: res?.meta?.totalPages ?? 1 });
      setPage(toPage);
    } catch (err) {
      setLogs([]);
      setLoadError(err.message || 'Could not load the activity log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, [selectedInstId, selectedModule]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenDetails = (log) => {
    setSelectedLog(log);
  };

  const handleCloseDetails = () => {
    setSelectedLog(null);
  };

  const formatJson = (val) => {
    if (!val) return 'No payload values recorded.';
    try {
      const obj = typeof val === 'string' ? JSON.parse(val) : val;
      return JSON.stringify(obj, null, 2);
    } catch (err) {
      return String(val);
    }
  };

  const getActionBadgeColor = (action) => {
    const act = String(action).toUpperCase();
    if (act.includes('CREATE')) return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    if (act.includes('DELETE')) return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    if (act.includes('STATUS')) return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
  };

  const formatTimestamp = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // total = every matching record (from the server); the other two describe the records on this page
  const totalLogs = meta.total;
  const configChangesCount = logs.filter(l => l.action === 'UPDATE' || l.action === 'STATUS_CHANGE').length;
  const activeActorsCount = new Set(logs.map(l => l.user?.email).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution Activity & Audit Logs"
        subtitle="Access the immutable ledger tracking all onboarding, module modifications, and administration updates across the SCOMS platform."
        badge="Live Ledger"
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-200/40">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Activities</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{totalLogs.toLocaleString('en-IN')} Logged</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-xl flex items-center justify-center border border-amber-200/40">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Configuration Changes (this page)</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{configChangesCount} Updates</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-200/40">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Users (this page)</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{activeActorsCount} Operators</h3>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative w-full">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by action, operator, IP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchLogs(1)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => fetchLogs(1)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all"
          >
            Query
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Institution Filter */}
          <select
            value={selectedInstId}
            onChange={(e) => setSelectedInstId(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="">All Institutions</option>
            {institutions.map(i => (
              <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
            ))}
          </select>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="">All Modules</option>
            {modules.map((m) => (
              <option key={m.module} value={m.module}>{moduleLabel(m.module)} ({m.count.toLocaleString('en-IN')})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Logs Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : loadError ? (
        <div className="glass-card p-12 rounded-2xl border border-rose-200 dark:border-rose-900 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Couldn't load the activity log</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{loadError}</p>
          <button onClick={() => fetchLogs(page)} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Activity className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {selectedInstId || selectedModule || searchQuery.trim() ? 'No activity matches these filters' : 'No activity recorded yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {selectedInstId || selectedModule || searchQuery.trim()
              ? 'Try a different search, institution or module.'
              : 'Actions such as onboarding an institution, changing modules or updating settings will appear here as they happen.'}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-55 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Network IP</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {log.institution?.name || 'Platform Admin'}
                        </span>
                        {log.institution?.code && (
                          <span className="ml-1.5 font-mono text-[9px] font-bold text-indigo-600 dark:text-indigo-400 px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950">
                            {log.institution.code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{log.user?.email || 'System'}</span>
                        <span className="block text-[9px] text-slate-400 font-medium uppercase tracking-wider">{log.user?.role || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                      {log.module}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetails(log)}
                        className="px-2.5 py-1.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500">
                Page {page} of {meta.totalPages} · {meta.total.toLocaleString('en-IN')} records
              </span>
              <div className="flex gap-2">
                <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1} className="px-3 py-1.5 font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40">Previous</button>
                <button onClick={() => fetchLogs(page + 1)} disabled={page >= meta.totalPages} className="px-3 py-1.5 font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* JSON Payload Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-slate-50">Audit Record Inspector</h3>
                  <p className="text-[10px] text-slate-500">ID: {selectedLog.id} • Action: {selectedLog.action}</p>
                </div>
              </div>
              <button 
                onClick={handleCloseDetails}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Summary Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div>
                  <span className="text-slate-500 block">Actor</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.user?.email || 'System'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Institution</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.institution?.name || 'Platform-wide'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Module</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.module}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">IP Address</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.ipAddress || 'N/A'}</span>
                </div>
              </div>

              {/* Changes Diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Old State (Before)
                  </h4>
                  <pre className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/20 font-mono text-[10px] text-rose-800 dark:text-rose-300 overflow-x-auto max-h-[300px] leading-relaxed">
                    {formatJson(selectedLog.oldValues)}
                  </pre>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> New State (After)
                  </h4>
                  <pre className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/20 font-mono text-[10px] text-emerald-800 dark:text-emerald-300 overflow-x-auto max-h-[300px] leading-relaxed">
                    {formatJson(selectedLog.newValues)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl hover:bg-slate-100"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionActivityPage;
