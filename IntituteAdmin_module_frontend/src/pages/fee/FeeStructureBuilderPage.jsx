import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Send, Copy, Archive, Users, Eye, Scale } from 'lucide-react';
import PaymentRulesModal from '../../components/fee/PaymentRulesModal';
import ItemRuleModal from '../../components/fee/ItemRuleModal';
import { describeRule } from '../../components/fee/ruleText';
import feePolicyService from '../../services/feePolicyService';
import feeEngineService from '../../services/feeEngineService';
import academicYearService from '../../services/academicYearService';
import courseService from '../../services/courseService';
import sectionService from '../../services/sectionService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';
import { useAcademic } from '../../context/InstitutionContext';

const FREQUENCIES = ['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'SEMESTER', 'INSTALLMENT', 'CUSTOM'];
const STATUS_STYLE = { DRAFT: 'bg-amber-100 text-amber-700', PUBLISHED: 'bg-emerald-100 text-emerald-700', ARCHIVED: 'bg-slate-200 text-slate-600' };

/**
 * Fee Structure Builder — Institute Admin composes a fee structure from unlimited fee-head
 * line items, previews the total, saves as Draft, and Publishes when ready. A published
 * structure can be assigned to every matching student in one click, duplicated as a new
 * version, or archived — never silently edited once real students are relying on it.
 */
export const FeeStructureBuilderPage = () => {
  const academic = useAcademic();
  const { error: showError, success } = useNotification();
  const [structures, setStructures] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState(false);
  const [rulesFor, setRulesFor] = useState(null); // structure whose own payment rules are being edited
  const [ruleIdx, setRuleIdx] = useState(null); // item row whose fee rule is being edited
  const [ruleOptions, setRuleOptions] = useState({});
  useEffect(() => { feePolicyService.getRuleOptions().then((r) => setRuleOptions(r.data || {})).catch(() => {}); }, []);

  const [name, setName] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [frequency, setFrequency] = useState('ANNUAL');
  const [lateFeePerDay, setLateFeePerDay] = useState(0);
  const [lateFeeGraceDays, setLateFeeGraceDays] = useState(0);
  const [lateFeeMaxAmount, setLateFeeMaxAmount] = useState('');
  const [items, setItems] = useState([{ feeHeadId: '', amount: '', frequency: 'ANNUAL' }]);

  const load = () => {
    setError(false);
    Promise.all([
      feeEngineService.getStructures(),
      feeEngineService.getFeeHeads(true),
      academicYearService.getAll(),
      courseService.getAll(),
    ])
      .then(([structRes, headsRes, ayRes, courseRes]) => {
        setStructures(structRes.data || []);
        setFeeHeads(headsRes.data || []);
        setAcademicYears(ayRes.data || []);
        setCourses(courseRes.data || []);
      })
      .catch((err) => { showError(`Failed to load: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!courseId) { setSections([]); return; }
    sectionService.getAll().then((res) => setSections(res.data || [])).catch(() => setSections([]));
  }, [courseId]);

  const handleItemChange = (idx, key, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  };
  const addItemRow = () => setItems((prev) => [...prev, { feeHeadId: '', amount: '', frequency }]);
  const removeItemRow = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const totalAmount = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  // Optional instalment schedule — every student assigned this structure gets these
  // instalments (each a % of their fee after discount, filled in head order)
  const [schedule, setSchedule] = useState([]);
  const scheduleTotal = Math.round(schedule.reduce((s, r) => s + (Number(r.percent) || 0), 0) * 100) / 100;
  const setScheduleRow = (idx, key, value) => setSchedule((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  const applyPreset = (parts) => setSchedule(parts.map((percent, i) => ({ label: parts.length === 1 ? 'Full payment' : `Instalment ${i + 1}`, percent, dueDate: '' })));

  const resetForm = () => {
    setName(''); setDueDate(''); setLateFeePerDay(0); setLateFeeGraceDays(0); setLateFeeMaxAmount('');
    setItems([{ feeHeadId: '', amount: '', frequency: 'ANNUAL' }]);
    setSchedule([]);
  };

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    // a head priced from the route fare / bed fee, or with special prices, may have no base amount
    const validItems = items.filter((i) => i.feeHeadId && (Number(i.amount) > 0 || i.rule?.amountFrom || i.rule?.amounts?.length));
    if (!name.trim() || !academicYearId || !dueDate || validItems.length === 0) {
      showError('Structure name, academic year, due date and at least one fee head with an amount are required.');
      return;
    }
    if (schedule.length > 0) {
      if (Math.abs(scheduleTotal - 100) > 0.01) { showError(`Instalment percentages must add up to 100% (now ${scheduleTotal}%).`); return; }
      if (schedule.some((r) => !r.dueDate || !(Number(r.percent) > 0))) { showError('Every instalment needs a percentage and a due date.'); return; }
    }
    setSaving(true);
    try {
      await feeEngineService.createStructure({
        name, academicYearId, courseId: courseId || undefined, sectionId: sectionId || undefined,
        dueDate, frequency, lateFeePerDay: Number(lateFeePerDay) || 0, items: validItems,
        lateFeeGraceDays: Number(lateFeeGraceDays) || 0,
        lateFeeMaxAmount: lateFeeMaxAmount === '' ? null : Number(lateFeeMaxAmount),
        installments: schedule.map((r) => ({ label: r.label, percent: Number(r.percent), dueDate: r.dueDate })),
      });
      success(`"${name}" saved as draft with ${validItems.length} fee head(s), total ₹${totalAmount.toLocaleString()}.`);
      resetForm();
      load();
    } catch (err) {
      showError(`Failed to create fee structure: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (structure) => {
    try {
      await feeEngineService.publishStructure(structure.id);
      success(`"${structure.name}" published — it can now be assigned to students.`);
      load();
    } catch (err) {
      showError(`Failed to publish: ${err.message}`);
    }
  };

  const handleAssign = async (structure) => {
    try {
      const res = await feeEngineService.assignStructure(structure.id);
      success(res.message);
      load();
    } catch (err) {
      showError(`Failed to assign: ${err.message}`);
    }
  };

  const handleDuplicate = async (structure, asNewVersion) => {
    try {
      await feeEngineService.duplicateStructure(structure.id, { asNewVersion });
      success(asNewVersion ? `New version of "${structure.name}" created as draft.` : `"${structure.name}" duplicated as a new draft.`);
      load();
    } catch (err) {
      showError(`Failed: ${err.message}`);
    }
  };

  const handleArchive = async (structure) => {
    try {
      await feeEngineService.archiveStructure(structure.id);
      success(`"${structure.name}" archived.`);
      load();
    } catch (err) {
      showError(`Failed to archive: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Structure Builder</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Compose a fee structure from your fee heads, preview the total, save as draft, then publish and assign to students.</p>
      </div>

      {feeHeads.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-10 text-center text-xs text-slate-500">
          No active fee heads yet — create some in <span className="font-bold">Fee Heads (Dynamic)</span> first.
        </div>
      ) : (
        <form onSubmit={handleCreateDraft} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Structure Name *</label>
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2026-2027 Grade 10 Fee Structure"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Academic Year *</label>
              <select required value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                <option value="">Select...</option>
                {academicYears.map((y) => <option key={y.id} value={y.id}>{y.yearName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Due Date *</label>
              <input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">{academic.label('course')} (optional)</label>
              <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setSectionId(''); }} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                <option value="">All {academic.label('course')}s</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">{academic.label('section')} (optional)</label>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!courseId} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50">
                <option value="">All {academic.label('section')}s</option>
                {sections.filter((s) => s.semester?.course?.id === courseId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Default Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Late Fee / Day (₹)</label>
              <input type="number" min="0" value={lateFeePerDay} onChange={(e) => setLateFeePerDay(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Late Fee Grace Days</label>
              <input type="number" min="0" max="365" step="1" value={lateFeeGraceDays} onChange={(e) => setLateFeeGraceDays(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Maximum Late Fee (₹)</label>
              <input type="number" min="0" placeholder="No limit" value={lateFeeMaxAmount} onChange={(e) => setLateFeeMaxAmount(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
            </div>
          </div>
          {Number(lateFeePerDay) > 0 && (
            <p className="text-[11px] text-slate-500 -mt-1">
              Late fee: ₹{Number(lateFeePerDay)} per day, starting {Number(lateFeeGraceDays) || 0} day(s) after the due date
              {lateFeeMaxAmount !== '' ? `, never more than ₹${Number(lateFeeMaxAmount).toLocaleString()}` : ', no maximum'}. Charged automatically; only the Institute Admin can collect or waive it.
            </p>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Fee Items</h4>
              <button type="button" onClick={addItemRow} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add Fee Head
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx}>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <select value={item.feeHeadId} onChange={(e) => handleItemChange(idx, 'feeHeadId', e.target.value)} className="col-span-4 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <option value="">Select fee head...</option>
                    {feeHeads.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                  <input type="number" min="0" placeholder="Amount" value={item.amount} onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                    className="col-span-3 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  <select value={item.frequency} onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)} className="col-span-3 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    {FREQUENCIES.map((f) => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
                  </select>
                  <button type="button" onClick={() => setRuleIdx(idx)} title="Who pays this head and how much" className={`col-span-1 px-1.5 py-1.5 text-[11px] font-bold rounded-lg ${item.rule ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    Rule
                  </button>
                  <button type="button" onClick={() => removeItemRow(idx)} disabled={items.length === 1} className="col-span-1 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg disabled:opacity-30">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {item.rule && <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 ml-1">{describeRule(item.rule, ruleOptions)}</p>}
                </div>
              ))}
              {items.some((i) => i.rule) && <p className="text-[11px] text-slate-500">With fee rules each student's total can differ from the total shown here — it's worked out when the fee is assigned.</p>}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Instalment Schedule <span className="font-normal text-slate-400">(optional)</span></h4>
                <p className="text-[11px] text-slate-500">Every student assigned this fee gets these instalments. Percentages are of the fee after any discount and must add up to 100%.</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[['2 halves', [50, 50]], ['3 terms', [40, 30, 30]], ['4 quarters', [25, 25, 25, 25]]].map(([label, parts]) => (
                  <button key={label} type="button" onClick={() => applyPreset(parts)} className="px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg">{label}</button>
                ))}
                <button type="button" onClick={() => setSchedule((prev) => [...prev, { label: `Instalment ${prev.length + 1}`, percent: '', dueDate: '' }])} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add Instalment
                </button>
              </div>
            </div>
            {schedule.length === 0 ? (
              <p className="text-[11px] text-slate-400">No instalments — the whole fee is due by the due date above.</p>
            ) : (
              <div className="space-y-2">
                {schedule.map((r, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input value={r.label} onChange={(e) => setScheduleRow(idx, 'label', e.target.value)} placeholder="Label (e.g. Term 1)" className="col-span-4 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                    <div className="col-span-2 relative">
                      <input type="number" min="0" max="100" step="0.01" value={r.percent} onChange={(e) => setScheduleRow(idx, 'percent', e.target.value)} placeholder="%" className="w-full px-2 py-1.5 pr-6 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">%</span>
                    </div>
                    <input type="date" value={r.dueDate} onChange={(e) => setScheduleRow(idx, 'dueDate', e.target.value)} className="col-span-3 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                    <span className="col-span-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">≈ ₹{Math.round((totalAmount * (Number(r.percent) || 0)) / 100).toLocaleString()}</span>
                    <button type="button" onClick={() => setSchedule((prev) => prev.filter((_, i) => i !== idx))} className="col-span-1 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <p className={`text-[11px] font-bold ${Math.abs(scheduleTotal - 100) <= 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Total: {scheduleTotal}% {Math.abs(scheduleTotal - 100) <= 0.01 ? '✓' : '— must be 100%'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Total Structure Amount: ₹{totalAmount.toLocaleString()}</p>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
          </div>
        </form>
      )}

      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Fee Structures</h3>
        {structures.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No fee structures created yet.</p>
        ) : (
          <div className="space-y-3">
            {structures.map((s) => (
              <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                      {s.version > 1 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">v{s.version}</span>}
                      {s.policyOverride && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Own payment rules</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {s.academicYear?.yearName} • {s.course?.name || 'All Courses'} • ₹{s.totalAmount.toLocaleString()} • {s._count?.assignments ?? 0} student(s) assigned
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-lg">
                      <Eye className="w-3 h-3" /> {expandedId === s.id ? 'Hide' : 'Preview'}
                    </button>
                    {s.status === 'DRAFT' && (
                      <button onClick={() => handlePublish(s)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white bg-emerald-600 rounded-lg">
                        <Send className="w-3 h-3" /> Publish
                      </button>
                    )}
                    {s.status === 'PUBLISHED' && (
                      <>
                        <button onClick={() => handleAssign(s)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white bg-indigo-600 rounded-lg">
                          <Users className="w-3 h-3" /> Assign to Students
                        </button>
                        <button onClick={() => handleDuplicate(s, true)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-lg">
                          <Copy className="w-3 h-3" /> New Version
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDuplicate(s, false)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-lg">
                      <Copy className="w-3 h-3" /> Duplicate
                    </button>
                    {s.status !== 'ARCHIVED' && (
                      <button onClick={() => setRulesFor(s)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-lg">
                        <Scale className="w-3 h-3" /> Payment rules
                      </button>
                    )}
                    {s.status !== 'ARCHIVED' && (
                      <button onClick={() => handleArchive(s)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
                        <Archive className="w-3 h-3" /> Archive
                      </button>
                    )}
                  </div>
                </div>

                {expandedId === s.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left text-[11px]">
                      <thead className="text-slate-500 uppercase font-semibold">
                        <tr><th className="py-1">Fee Head</th><th className="py-1">Amount</th><th className="py-1">Frequency</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {s.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-1.5 font-semibold text-slate-800 dark:text-slate-200">{item.feeHead?.name}{item.rule && <span className="block font-normal text-amber-700 dark:text-amber-400">{describeRule(item.rule, ruleOptions)}</span>}</td>
                            <td className="py-1.5">₹{item.amount.toLocaleString()}</td>
                            <td className="py-1.5">{item.frequency}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {s.installmentSchedule?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Instalment Schedule</p>
                        <div className="flex flex-wrap gap-2">
                          {s.installmentSchedule.map((r) => (
                            <span key={r.id} className="text-[11px] px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                              {r.label || `Instalment ${r.installmentNumber}`}: <b>{r.percent}%</b> (≈ ₹{Math.round((s.totalAmount * r.percent) / 100).toLocaleString()}) by {new Date(r.dueDate).toLocaleDateString('en-IN')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {ruleIdx !== null && items[ruleIdx] && (
        <ItemRuleModal
          headName={feeHeads.find((h) => h.id === items[ruleIdx].feeHeadId)?.name}
          baseAmount={items[ruleIdx].amount}
          rule={items[ruleIdx].rule}
          options={ruleOptions}
          onClose={() => setRuleIdx(null)}
          onSave={(rule) => { handleItemChange(ruleIdx, 'rule', rule); setRuleIdx(null); }}
        />
      )}
      {rulesFor && (
        <PaymentRulesModal
          structure={rulesFor}
          onClose={() => setRulesFor(null)}
          onSaved={(msg) => { success(msg); setRulesFor(null); load(); }}
          onError={(msg) => showError(msg)}
        />
      )}
    </div>
  );
};

export default FeeStructureBuilderPage;
