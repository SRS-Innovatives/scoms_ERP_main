import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles, Bookmark } from 'lucide-react';
import reportService from '../../services/reportService';
import { useNotification } from '../../context/NotificationContext';
import DynamicReportFilters from './DynamicReportFilters';
import ReportPreview from './ReportPreview';

/**
 * The one reusable report-running screen for every report in the catalog. Receives only a
 * `reportCode`, fetches that report's own definition, and renders its filter form and
 * result table generically — this component never changes when report #11, #50 or #100
 * gets added to the catalog.
 */
export const ReportGenerator = ({ reportCode, onBack }) => {
  const { error: showError, success } = useNotification();
  const [definition, setDefinition] = useState(null);
  const [loadingDef, setLoadingDef] = useState(true);
  const [filterValues, setFilterValues] = useState({});
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    setLoadingDef(true);
    setResult(null);
    setFilterValues({});
    reportService
      .getDefinition(reportCode)
      .then((res) => setDefinition(res.data))
      .catch((err) => showError(`Failed to load report definition: ${err.message}`))
      .finally(() => setLoadingDef(false));
  }, [reportCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await reportService.generate(reportCode, filterValues);
      setResult(res.data);
    } catch (err) {
      showError(err.message || 'Failed to generate report');
      setResult(null);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!saveName.trim()) return;
    try {
      await reportService.createSaved(reportCode, saveName.trim(), filterValues);
      success('Report preset saved — find it under Saved Reports.');
      setSaveName('');
      setShowSaveForm(false);
    } catch (err) {
      showError(`Failed to save report: ${err.message}`);
    }
  };

  if (loadingDef) {
    return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>;
  }

  if (!definition) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs font-semibold text-slate-500 hover:text-indigo-600">← Back to Catalog</button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{definition.name}</h3>
        <p className="text-[11px] text-slate-500 mb-4">{definition.description}</p>

        {definition.filters.length === 0 ? (
          <p className="text-xs text-slate-400 mb-4">This report has no filters — it always covers the whole institution.</p>
        ) : (
          <DynamicReportFilters filters={definition.filters} values={filterValues} onChange={setFilterValues} />
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generating...' : 'Generate Report'}
          </button>

          <button
            onClick={() => setShowSaveForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
          >
            <Bookmark className="w-3.5 h-3.5" /> Save Filters
          </button>
        </div>

        {showSaveForm && (
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. Monthly Attendance — CSE Section A"
              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
            <button onClick={handleSave} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg">Save</button>
          </div>
        )}
      </div>

      {result && (
        <ReportPreview result={result} definition={definition} filters={filterValues} onGenerateAgain={handleGenerate} />
      )}
    </div>
  );
};

export default ReportGenerator;
