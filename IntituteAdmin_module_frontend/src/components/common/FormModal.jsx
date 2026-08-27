import React from 'react';
import { X } from 'lucide-react';

/**
 * Generic Add/Edit form modal driven by a `fields` config.
 * field: { name, label, type: 'text'|'number'|'date'|'select'|'checkbox'|'textarea', required, options: [{value,label}], span: 'full' }
 */
export const FormModal = ({
  isOpen,
  title,
  subtitle,
  icon: Icon,
  fields = [],
  values = {},
  onChange,
  onSubmit,
  onClose,
  submitLabel = 'Save',
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {fields.map((f) => (
              <div key={f.name} className={f.span === 'full' ? 'sm:col-span-2' : ''}>
                {f.type !== 'checkbox' && (
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {f.label}
                    {f.required && ' *'}
                  </label>
                )}

                {f.type === 'select' ? (
                  <select
                    required={f.required}
                    disabled={f.disabled}
                    value={values[f.name] ?? ''}
                    onChange={(e) => onChange(f.name, e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium disabled:opacity-50"
                  >
                    <option value="">{f.placeholder || `Select ${f.label}`}</option>
                    {(f.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    rows={f.rows || 3}
                    required={f.required}
                    value={values[f.name] ?? ''}
                    onChange={(e) => onChange(f.name, e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                  />
                ) : f.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    <input
                      type="checkbox"
                      checked={!!values[f.name]}
                      onChange={(e) => onChange(f.name, e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    {f.label}
                  </label>
                ) : (
                  <input
                    type={f.type || 'text'}
                    required={f.required}
                    disabled={f.disabled}
                    placeholder={f.placeholder}
                    value={values[f.name] ?? ''}
                    onChange={(e) => onChange(f.name, e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium disabled:opacity-50"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;
