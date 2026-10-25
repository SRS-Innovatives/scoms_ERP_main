import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { Wand2, Plus, X, Download, Save, Play, Loader2, Trash2 } from 'lucide-react';
import dynamicReportService from '../../services/dynamicReportService';

const OPERATOR_LABELS = { equals: 'equals', contains: 'contains', gt: '>', gte: '>=', lt: '<', lte: '<=' };

export const ReportBuilderPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [sources, setSources] = useState([]);
  const [dataSource, setDataSource] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dynamicReportService.getDataSources().then((res) => setSources(res.data || [])).catch((err) => notifyError(err.message));
    dynamicReportService.getSaved().then((res) => setSaved(res.data || [])).catch(() => {});
  }, [notifyError]);

  const currentSource = sources.find((s) => s.key === dataSource);

  const selectSource = (key) => {
    setDataSource(key);
    setSelectedFields([]);
    setFilters([]);
    setSortBy('');
    setResult(null);
  };

  const toggleField = (fieldKey) => {
    setSelectedFields((prev) => (prev.includes(fieldKey) ? prev.filter((f) => f !== fieldKey) : [...prev, fieldKey]));
  };

  const addFilter = () => {
    const firstFilterable = currentSource?.fields.find((f) => f.filterable);
    if (!firstFilterable) return;
    setFilters((prev) => [...prev, { field: firstFilterable.key, operator: firstFilterable.operators[0], value: '' }]);
  };
  const updateFilter = (idx, patch) => setFilters((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  const removeFilter = (idx) => setFilters((prev) => prev.filter((_, i) => i !== idx));

  const buildBody = () => ({ dataSource, fields: selectedFields, filters: filters.filter((f) => f.value !== ''), sortBy: sortBy || undefined, sortDirection });

  const runPreview = async () => {
    if (!dataSource || selectedFields.length === 0) { notifyError('Pick a data source and at least one field'); return; }
    setRunning(true);
    try {
      const res = await dynamicReportService.preview(buildBody());
      setResult(res.data);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const runExport = async (format) => {
    if (!dataSource || selectedFields.length === 0) { notifyError('Pick a data source and at least one field'); return; }
    try {
      const blob = await dynamicReportService.exportReport({ ...buildBody(), format, reportName: currentSource?.label || 'Custom Report' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(currentSource?.label || 'report').replace(/\s+/g, '_')}.${format === 'EXCEL' ? 'xlsx' : format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notifySuccess(`${format} exported`);
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleSave = async () => {
    if (!saveName.trim()) { notifyError('Name is required to save'); return; }
    setSaving(true);
    try {
      await dynamicReportService.save({ ...buildBody(), name: saveName.trim() });
      notifySuccess(`Saved as "${saveName}"`);
      setSaveName('');
      dynamicReportService.getSaved().then((res) => setSaved(res.data || []));
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const loadSaved = async (def) => {
    setDataSource(def.dataSource);
    setSelectedFields(def.fields);
    setFilters(def.filters || []);
    setSortBy(def.sortBy || '');
    setSortDirection(def.sortDirection || 'asc');
    try {
      const res = await dynamicReportService.runSaved(def.id);
      setResult(res.data);
    } catch (err) {
      notifyError(err.message);
    }
  };

  const deleteSaved = async (id) => {
    try {
      await dynamicReportService.deleteSaved(id);
      notifySuccess('Deleted');
      setSaved((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      notifyError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Report Builder</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Pick a data source, choose fields and filters, then preview or export</p>
      </div>

      {saved.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {saved.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button onClick={() => loadSaved(s)} className="text-indigo-600 dark:text-indigo-400">{s.name}</button>
              <button onClick={() => deleteSaved(s.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Data Source</label>
          <div className="flex gap-2">
            {sources.map((s) => (
              <button
                key={s.key}
                onClick={() => selectSource(s.key)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${dataSource === s.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {currentSource && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Fields</label>
              <div className="flex flex-wrap gap-2">
                {currentSource.fields.map((f) => (
                  <label key={f.key} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${selectedFields.includes(f.key) ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    <input type="checkbox" checked={selectedFields.includes(f.key)} onChange={() => toggleField(f.key)} className="w-3.5 h-3.5 rounded text-indigo-600" />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filters</label>
                <button onClick={addFilter} className="flex items-center gap-1 text-xs font-semibold text-indigo-600"><Plus className="w-3.5 h-3.5" /> Add Filter</button>
              </div>
              <div className="space-y-2">
                {filters.map((f, idx) => {
                  const fieldDef = currentSource.fields.find((fd) => fd.key === f.field);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <select value={f.field} onChange={(e) => { const nf = currentSource.fields.find((x) => x.key === e.target.value); updateFilter(idx, { field: e.target.value, operator: nf.operators[0] }); }} className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                        {currentSource.fields.filter((fd) => fd.filterable).map((fd) => <option key={fd.key} value={fd.key}>{fd.label}</option>)}
                      </select>
                      <select value={f.operator} onChange={(e) => updateFilter(idx, { operator: e.target.value })} className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                        {(fieldDef?.operators || []).map((op) => <option key={op} value={op}>{OPERATOR_LABELS[op] || op}</option>)}
                      </select>
                      {fieldDef?.type === 'ENUM' ? (
                        <select value={f.value} onChange={(e) => updateFilter(idx, { value: e.target.value })} className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                          <option value="">Select...</option>
                          {(fieldDef.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={fieldDef?.type === 'DATE' ? 'date' : fieldDef?.type === 'NUMBER' ? 'number' : 'text'} value={f.value} onChange={(e) => updateFilter(idx, { value: e.target.value })} className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                      )}
                      <button onClick={() => removeFilter(idx)} className="text-rose-500 p-1"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                  <option value="">None</option>
                  {currentSource.fields.filter((f) => f.sortable).map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
              {sortBy && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Direction</label>
                  <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value)} className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={runPreview} disabled={running} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"><Play className="w-3.5 h-3.5" /> Preview</button>
              <button onClick={() => runExport('CSV')} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"><Download className="w-3.5 h-3.5" /> CSV</button>
              <button onClick={() => runExport('EXCEL')} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"><Download className="w-3.5 h-3.5" /> Excel</button>
              <button onClick={() => runExport('PDF')} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"><Download className="w-3.5 h-3.5" /> PDF</button>
              <div className="flex-1" />
              <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Save as..." className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs w-32" />
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold disabled:opacity-50"><Save className="w-3.5 h-3.5" /> Save</button>
            </div>
          </>
        )}
      </div>

      {running ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : result ? (
        result.rows.length === 0 ? (
          <EmptyState title="No Matching Rows" description="Try adjusting your filters." icon={Wand2} />
        ) : (
          <DataTable columns={result.columns.map((c) => ({ header: c.label, key: c.fieldKey }))} data={result.rows.map((r, i) => ({ ...r, id: i }))} />
        )
      ) : null}
    </div>
  );
};

export default ReportBuilderPage;
