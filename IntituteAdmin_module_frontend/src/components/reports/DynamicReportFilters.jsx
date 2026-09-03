import React, { useEffect, useState } from 'react';
import reportService from '../../services/reportService';

/**
 * Renders a report's filter form purely from its dynamic definition — never a hardcoded
 * form per report. Filters with a `source` but no static `options` are resolved lazily;
 * a filter with `dependsOn` re-resolves whenever its parent's value changes, and clears
 * itself if the parent is cleared (real cascading: Department → Course → Section → ...).
 */
export const DynamicReportFilters = ({ filters, values, onChange }) => {
  const [dynamicOptions, setDynamicOptions] = useState({});
  const [loadingKeys, setLoadingKeys] = useState({});

  // Pre-load static/independent options once (definition already includes these).
  useEffect(() => {
    const initial = {};
    filters.forEach((f) => { if (f.options) initial[f.fieldKey] = f.options; });
    setDynamicOptions(initial);
  }, [filters]);

  // Resolve/re-resolve any dependent filter whenever its parent value changes.
  useEffect(() => {
    filters
      .filter((f) => f.dependsOn && f.source)
      .forEach((f) => {
        const parentValue = values[f.dependsOn];
        if (!parentValue) {
          setDynamicOptions((prev) => ({ ...prev, [f.fieldKey]: [] }));
          return;
        }
        setLoadingKeys((prev) => ({ ...prev, [f.fieldKey]: true }));
        reportService
          .getFilterOptions(f.source, { [f.dependsOn]: parentValue })
          .then((res) => setDynamicOptions((prev) => ({ ...prev, [f.fieldKey]: res.data || [] })))
          .catch(() => setDynamicOptions((prev) => ({ ...prev, [f.fieldKey]: [] })))
          .finally(() => setLoadingKeys((prev) => ({ ...prev, [f.fieldKey]: false })));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, JSON.stringify(filters.filter((f) => f.dependsOn).map((f) => values[f.dependsOn]))]);

  const handleChange = (fieldKey, value) => {
    const next = { ...values, [fieldKey]: value };
    // Clear any filter that directly depends on this one, since its option list is no
    // longer valid for the new parent value (a further clear cascades on the next render,
    // since that dependent's own `dependsOn` effect re-runs once its value disappears).
    filters.filter((f) => f.dependsOn === fieldKey).forEach((f) => { delete next[f.fieldKey]; });
    onChange(next);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {filters.map((f) => {
        const isDependentAndUnresolved = f.dependsOn && !values[f.dependsOn];
        return (
          <div key={f.fieldKey}>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {f.label}
              {f.required && <span className="text-rose-500"> *</span>}
            </label>

            {(f.inputType === 'DATE') && (
              <input
                type="date"
                value={values[f.fieldKey] || ''}
                onChange={(e) => handleChange(f.fieldKey, e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            )}

            {f.inputType === 'NUMBER' && (
              <input
                type="number"
                value={values[f.fieldKey] || ''}
                placeholder={f.placeholder || ''}
                onChange={(e) => handleChange(f.fieldKey, e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            )}

            {f.inputType === 'TEXT' && (
              <input
                type="text"
                value={values[f.fieldKey] || ''}
                placeholder={f.placeholder || ''}
                onChange={(e) => handleChange(f.fieldKey, e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            )}

            {f.inputType === 'BOOLEAN' && (
              <select
                value={values[f.fieldKey] ?? ''}
                onChange={(e) => handleChange(f.fieldKey, e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            )}

            {!['DATE', 'NUMBER', 'TEXT', 'BOOLEAN'].includes(f.inputType) && (
              <select
                value={values[f.fieldKey] || ''}
                onChange={(e) => handleChange(f.fieldKey, e.target.value)}
                disabled={isDependentAndUnresolved || loadingKeys[f.fieldKey]}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 disabled:opacity-50"
              >
                <option value="">
                  {isDependentAndUnresolved ? `Select ${f.label} above first` : loadingKeys[f.fieldKey] ? 'Loading...' : `All ${f.label}`}
                </option>
                {(dynamicOptions[f.fieldKey] || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DynamicReportFilters;
