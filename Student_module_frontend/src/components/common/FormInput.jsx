import React from 'react';

export const FormInput = ({ label, type = 'text', value, onChange, placeholder, required = false, error, disabled = false }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        type={type}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed ${
          error
            ? 'border-rose-400 focus:ring-rose-500/20'
            : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
        }`}
      />
      {error && <p className="text-[11px] font-semibold text-rose-500 mt-1">{error}</p>}
    </div>
  );
};

export default FormInput;
