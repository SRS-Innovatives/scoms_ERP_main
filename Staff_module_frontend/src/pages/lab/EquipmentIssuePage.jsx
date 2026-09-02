import React, { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { FlaskConical, Check, Loader2, RotateCcw } from 'lucide-react';
import labService from '../../services/labService';
import attendanceService from '../../services/attendanceService';

export const EquipmentIssuePage = () => {
  const { success, error: showError } = useNotification();
  const [students, setStudents] = useState([]);
  const [assets, setAssets] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const load = () => {
    Promise.all([attendanceService.getMyClasses(), labService.getAssets(), labService.getIssuedEquipment()])
      .then(async ([classesRes, assetsRes, issuesRes]) => {
        const mappings = classesRes.data || [];
        const seen = new Map();
        mappings.forEach((m) => { if (!seen.has(m.section.id)) seen.set(m.section.id, m.section); });
        const rosters = await Promise.all(
          Array.from(seen.values()).map((section) =>
            attendanceService.getRoster(section.id).then((res) => (res.data || []).map((s) => ({ ...s, sectionName: section.name })))
          )
        );
        const flat = rosters.flat();
        const unique = Array.from(new Map(flat.map((s) => [s.id, s])).values());
        setStudents(unique);
        if (unique.length > 0) setStudentId((prev) => prev || unique[0].id);

        const assetList = assetsRes.data || [];
        setAssets(assetList);
        if (assetList.length > 0) setAssetId((prev) => prev || assetList[0].id);

        setIssues(issuesRes.data || []);
      })
      .catch((err) => showError(err.message || 'Failed to load data', 'Load Failed'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !assetId) return;
    setSaving(true);
    try {
      await labService.issueEquipment({ studentId, assetId, quantity });
      const student = students.find((s) => s.id === studentId);
      const asset = assets.find((a) => a.id === assetId);
      success(`Equipment "${asset?.name}" issued to ${student?.firstName} ${student?.lastName}!`, 'Equipment Issued');
      load();
    } catch (err) {
      showError(err.message || 'Failed to issue equipment', 'Issue Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async (issueId) => {
    try {
      await labService.returnEquipment(issueId);
      success('Equipment marked as returned.', 'Returned');
      load();
    } catch (err) {
      showError(err.message || 'Failed to mark as returned', 'Failed');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  if (students.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-xl">
        You have no assigned classes yet.
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-xl">
        No lab equipment has been registered yet. Ask your Institute Admin to add lab instruments to the asset register.
      </div>
    );
  }

  const outstanding = issues.filter((i) => !i.returnedAt);

  return (
    <div className="space-y-6 max-w-xl">
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-500" /> Issue Lab Equipment / Apparatus
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.sectionName} (Roll {s.rollNumber})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Equipment</label>
              <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50">
              <Check className="w-4 h-4" /> {saving ? 'Issuing...' : 'Issue Apparatus'}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          Currently Issued (Not Yet Returned) — {outstanding.length}
        </h4>
        {outstanding.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No equipment currently checked out.</p>
        ) : (
          <div className="space-y-2 text-xs">
            {outstanding.map((i) => (
              <div key={i.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{i.asset?.name} × {i.quantity}</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {i.student?.firstName} {i.student?.lastName} ({i.student?.section?.name}) • Issued {new Date(i.issuedAt).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => handleReturn(i.id)} className="flex items-center gap-1 px-3 py-1.5 font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 rounded-lg hover:bg-emerald-100">
                  <RotateCcw className="w-3.5 h-3.5" /> Mark Returned
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentIssuePage;
