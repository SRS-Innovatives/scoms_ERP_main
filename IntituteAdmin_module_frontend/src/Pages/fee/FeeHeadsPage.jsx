import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Tag, Layers } from 'lucide-react';
import feeEngineService from '../../services/feeEngineService';
import { useNotification } from '../../context/NotificationContext';

/**
 * Fee Head Master — the metadata layer. Institute Admin creates unlimited, fully custom
 * fee heads here (no developer/code/database change required); the Fee Structure Builder
 * then picks from these to compose a structure.
 */
export const FeeHeadsPage = () => {
  const { error: showError, success } = useNotification();
  const [heads, setHeads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [mandatory, setMandatory] = useState(true);
  const [taxApplicable, setTaxApplicable] = useState(false);
  const [lateFeeApplicable, setLateFeeApplicable] = useState(false);

  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');

  const load = () => {
    Promise.all([feeEngineService.getFeeHeads(), feeEngineService.getCategories()])
      .then(([headsRes, catRes]) => {
        setHeads(headsRes.data || []);
        setCategories(catRes.data || []);
      })
      .catch((err) => showError(`Failed to load fee heads: ${err.message}`))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateHead = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setSaving(true);
    try {
      await feeEngineService.createFeeHead({ name, code, categoryId: categoryId || undefined, mandatory, taxApplicable, lateFeeApplicable });
      success(`Fee head "${name}" created.`);
      setName(''); setCode('');
      load();
    } catch (err) {
      showError(`Failed to create fee head: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim() || !categoryCode.trim()) return;
    try {
      await feeEngineService.createCategory({ name: categoryName, code: categoryCode });
      success(`Category "${categoryName}" created.`);
      setCategoryName(''); setCategoryCode(''); setShowCategoryForm(false);
      load();
    } catch (err) {
      showError(`Failed to create category: ${err.message}`);
    }
  };

  const handleToggleActive = async (head) => {
    try {
      if (head.active) {
        await feeEngineService.deactivateFeeHead(head.id);
      } else {
        await feeEngineService.updateFeeHead(head.id, { active: true });
      }
      load();
    } catch (err) {
      showError(`Failed: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" /> Fee Head Master
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Create unlimited, fully custom fee heads (Tuition, Transport, Hostel, ...) — no code changes needed. The Fee Structure Builder picks from this list.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 uppercase text-[10px] font-semibold text-slate-500">
              <tr>
                <th className="p-3">Fee Head</th>
                <th className="p-3">Code</th>
                <th className="p-3">Category</th>
                <th className="p-3">Mandatory</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {heads.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No fee heads created yet. Add your first one.</td></tr>
              ) : heads.map((h) => (
                <tr key={h.id}>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{h.name}</td>
                  <td className="p-3 font-mono text-slate-500">{h.code}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{h.category?.name || '—'}</td>
                  <td className="p-3">{h.mandatory ? 'Yes' : 'Optional'}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleActive(h)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${h.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                    >
                      {h.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleCreateHead} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Fee Head</h3>
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Transport Fee"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
            <input required type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. TRANSPORT"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <option value="">No Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} /> Mandatory</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={taxApplicable} onChange={(e) => setTaxApplicable(e.target.checked)} /> Tax Applicable</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={lateFeeApplicable} onChange={(e) => setLateFeeApplicable(e.target.checked)} /> Late Fee Applicable</label>
            </div>
            <button type="submit" disabled={saving} className="w-full px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
              {saving ? 'Saving...' : 'Create Fee Head'}
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <button onClick={() => setShowCategoryForm((v) => !v)} className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> {showCategoryForm ? 'Hide' : 'Add a New Category'}
            </button>
            {showCategoryForm && (
              <form onSubmit={handleCreateCategory} className="mt-3 space-y-2">
                <input required type="text" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Facilities"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                <input required type="text" value={categoryCode} onChange={(e) => setCategoryCode(e.target.value.toUpperCase())} placeholder="e.g. FACILITIES"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
                <button type="submit" className="w-full px-4 py-2 text-xs font-bold text-white bg-slate-800 rounded-lg">Create Category</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeHeadsPage;
