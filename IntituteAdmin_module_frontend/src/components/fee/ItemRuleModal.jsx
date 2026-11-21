import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const field = 'mt-1 w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg';
const label = 'block text-[11px] font-semibold text-slate-600 dark:text-slate-300';
import { ord } from './ruleText';

const Chips = ({ values = [], choices, onChange }) => (
  <div className="flex flex-wrap gap-1 mt-1">
    {choices.map(([v, l]) => {
      const on = values.includes(v);
      return (
        <button key={v} type="button" onClick={() => onChange(on ? values.filter((x) => x !== v) : [...values, v])}
          className={`px-2 py-1 rounded-lg text-[11px] font-semibold border ${on ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{l}</button>
      );
    })}
  </div>
);

/** Free values (quota, category) — known ones as chips, plus typing new ones. */
const ValueList = ({ values = [], known = [], onChange, placeholder }) => {
  const [text, setText] = useState('');
  const all = [...new Set([...known, ...values])];
  const add = () => {
    const v = text.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setText('');
  };
  return (
    <div>
      {all.length > 0 && <Chips values={values} choices={all.map((v) => [v, v])} onChange={onChange} />}
      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} onBlur={add} placeholder={placeholder} className={field} />
    </div>
  );
};

const Tri = ({ value, onChange, yes, no }) => (
  <select value={value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value === 'true')} className={field}>
    <option value="">Anyone</option>
    <option value="true">{yes}</option>
    <option value="false">{no}</option>
  </select>
);

/** Edits one condition object (every set part must match). */
export const ConditionEditor = ({ value = {}, onChange, options }) => {
  const c = value || {};
  const set = (k, v) => {
    const next = { ...c };
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) delete next[k];
    else next[k] = v;
    onChange(next);
  };
  const setCustom = (key, vals) => {
    const custom = { ...(c.custom || {}) };
    if (vals.length) custom[key] = vals; else delete custom[key];
    set('custom', Object.keys(custom).length ? custom : undefined);
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className={label}>Admission quota<ValueList values={c.quota} known={options.quotas} onChange={(v) => set('quota', v)} placeholder="Type a quota and press Enter" /></label>
      <label className={label}>Category<ValueList values={c.category} known={options.categories} onChange={(v) => set('category', v)} placeholder="Type a category and press Enter" /></label>
      <label className={label}>Gender<Chips values={c.gender} choices={[['MALE', 'Male'], ['FEMALE', 'Female'], ['OTHER', 'Other']]} onChange={(v) => set('gender', v)} /></label>
      <label className={label}>Admission<Tri value={c.newAdmission} onChange={(v) => set('newAdmission', v)} yes="New admissions (this year)" no="Existing students" /></label>
      <label className={label}>Hostel<Tri value={c.hostel} onChange={(v) => set('hostel', v)} yes="Has a hostel bed" no="Day scholars" /></label>
      <label className={label}>Transport<Tri value={c.transport} onChange={(v) => set('transport', v)} yes="Uses the bus" no="Doesn't use the bus" /></label>
      {options.routes?.length > 0 && <label className={label}>Bus routes<Chips values={c.routeIds} choices={options.routes.map((r) => [r.id, r.routeName])} onChange={(v) => set('routeIds', v)} /></label>}
      {options.hostels?.length > 0 && <label className={label}>Hostels<Chips values={c.hostelIds} choices={options.hostels.map((h) => [h.id, h.name])} onChange={(v) => set('hostelIds', v)} /></label>}
      <label className={label}>Siblings
        <select value={c.siblingOrderMin || ''} onChange={(e) => set('siblingOrderMin', e.target.value ? Number(e.target.value) : undefined)} className={field}>
          <option value="">Any child</option>
          {[2, 3, 4].map((n) => <option key={n} value={n}>{ord(n)} child or later</option>)}
        </select>
      </label>
      {(options.customFields || []).filter((f) => Array.isArray(f.options) && f.options.length).map((f) => (
        <label key={f.fieldKey} className={label}>{f.label}<Chips values={c.custom?.[f.fieldKey]} choices={f.options.map((o) => [String(o), String(o)])} onChange={(v) => setCustom(f.fieldKey, v)} /></label>
      ))}
    </div>
  );
};

const clean = (c) => (c && Object.keys(c).length ? c : undefined);

/**
 * Who pays one fee head and how much. Saves { when, amounts, amountFrom, months } (or null).
 * The head's own amount stays the default price.
 */
export const ItemRuleModal = ({ headName, baseAmount, rule, options, onSave, onClose }) => {
  const [when, setWhen] = useState(rule?.when || {});
  const [onlySome, setOnlySome] = useState(!!rule?.when);
  const [priceFrom, setPriceFrom] = useState(rule?.amountFrom || '');
  const [months, setMonths] = useState(rule?.months || 10);
  const [amounts, setAmounts] = useState(rule?.amounts || []);

  const save = () => {
    const out = {};
    if (onlySome && clean(when)) out.when = when;
    if (priceFrom) { out.amountFrom = priceFrom; out.months = Number(months) || 1; }
    const priced = amounts.filter((a) => clean(a.when) && a.amount !== '' && Number(a.amount) >= 0).map((a) => ({ when: a.when, amount: Number(a.amount) }));
    if (!priceFrom && priced.length) out.amounts = priced;
    onSave(Object.keys(out).length ? out : null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Fee rule — {headName || 'fee head'}</h3>
          <p className="text-xs text-slate-500">Who pays this head and how much. Without a rule every student pays ₹{Number(baseAmount || 0).toLocaleString('en-IN')}.</p>
        </div>

        <section className="space-y-2">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Who pays</p>
          <div className="flex gap-2 text-xs">
            {[[false, 'Every student'], [true, 'Only some students']].map(([v, l]) => (
              <button key={l} type="button" onClick={() => setOnlySome(v)} className={`px-3 py-1.5 rounded-lg border font-semibold ${onlySome === v ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700' : 'border-slate-200 dark:border-slate-700'}`}>{l}</button>
            ))}
          </div>
          {onlySome && <ConditionEditor value={when} onChange={setWhen} options={options} />}
        </section>

        <section className="space-y-2">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">How much</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {[['', `The head's amount (₹${Number(baseAmount || 0).toLocaleString('en-IN')})`], ['TRANSPORT_ROUTE', "The student's bus route fare"], ['HOSTEL_BED', "The student's hostel bed fee"]].map(([v, l]) => (
              <button key={l} type="button" onClick={() => setPriceFrom(v)} className={`px-3 py-1.5 rounded-lg border font-semibold ${priceFrom === v ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700' : 'border-slate-200 dark:border-slate-700'}`}>{l}</button>
            ))}
          </div>
          {priceFrom && (
            <label className={`${label} max-w-xs`}>× months (the monthly fare / fee is set on the route / bed)
              <input type="number" min="1" max="24" value={months} onChange={(e) => setMonths(e.target.value)} className={field} />
            </label>
          )}
          {!priceFrom && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500">Special prices — the first one that matches the student is used (₹0 = waived).</p>
              {amounts.map((a, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-end gap-2">
                    <label className={`${label} w-40`}>Price (₹)
                      <input type="number" min="0" value={a.amount} onChange={(e) => setAmounts((p) => p.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} className={field} />
                    </label>
                    <button type="button" onClick={() => setAmounts((p) => p.filter((_, j) => j !== i))} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <ConditionEditor value={a.when} onChange={(w) => setAmounts((p) => p.map((x, j) => (j === i ? { ...x, when: w } : x)))} options={options} />
                </div>
              ))}
              <button type="button" onClick={() => setAmounts((p) => [...p, { when: {}, amount: '' }])} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add a special price
              </button>
            </div>
          )}
        </section>

        <div className="flex justify-between gap-2 pt-1">
          <button type="button" onClick={() => onSave(null)} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Remove rule</button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
            <button type="button" onClick={save} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">Save rule</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemRuleModal;
