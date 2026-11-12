import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { useAcademic } from '../../context/InstitutionContext';
import houseService from '../../services/houseService';
import staffService from '../../services/staffService';
import sectionService from '../../services/sectionService';
import studentService from '../../services/studentService';
import { Shield, Pencil, Trash2, Users, Trophy, X, UserMinus, Plus, Minus } from 'lucide-react';

const emptyHouse = { name: '', color: '#6366f1', mentorStaffId: '', description: '' };
const fullName = (p) => (p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '');

/** Members + points log for one house, in a side panel. */
const HouseDetail = ({ house, sections, onClose, onChanged }) => {
  const academic = useAcademic();
  const { notifySuccess, notifyError } = useNotification();
  const [tab, setTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [points, setPoints] = useState([]);
  const [sectionId, setSectionId] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [award, setAward] = useState({ points: '', reason: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    houseService.getMembers(house.id).then((res) => setMembers(res.data || [])).catch((err) => notifyError(err.message));
    houseService.getPoints(house.id).then((res) => setPoints(res.data || [])).catch((err) => notifyError(err.message));
  }, [house.id, notifyError]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (search.trim().length < 2) { setResults([]); return undefined; }
    const t = setTimeout(() => {
      studentService.getAll({ search: search.trim(), limit: 8 }).then((res) => setResults(res.data?.students || res.data || [])).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const act = async (fn, msg) => {
    setBusy(true);
    try {
      const res = await fn();
      notifySuccess(msg || res.message || 'Saved');
      load();
      onChanged();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addSection = () => sectionId && act(() => houseService.assignMembers(house.id, { sectionId }), `Whole ${academic.label('section').toLowerCase()} added to ${house.name}`);
  const addStudent = (s) => { setSearch(''); setResults([]); act(() => houseService.assignMembers(house.id, { studentIds: [s.id] }), `${fullName(s)} added to ${house.name}`); };
  const submitPoints = (sign) => {
    const n = Math.abs(parseInt(award.points, 10));
    if (!n || !award.reason.trim()) { notifyError('Enter the points and a reason'); return; }
    act(() => houseService.awardPoints(house.id, { points: sign * n, reason: award.reason.trim() }), sign > 0 ? `${n} points awarded` : `${n} points deducted`)
      .then(() => setAward({ points: '', reason: '' }));
  };

  const inputCls = 'px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white';

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40 no-print" onClick={onClose}>
      <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl p-6 overflow-y-auto text-xs" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full" style={{ background: house.color }} />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{house.name}</h3>
            <span className="text-slate-500">· {members.length} members · {points.reduce((sum, p) => sum + p.points, 0)} pts</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-2 mb-4">
          {[['members', 'Members', Users], ['points', 'Points Log', Trophy]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold ${tab === key ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {tab === 'members' ? (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-3">
              <div className="flex gap-2">
                <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={`${inputCls} flex-1`}>
                  <option value="">Add a whole {academic.label('course').toLowerCase()} / {academic.label('section').toLowerCase()}…</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{[s.semester?.course?.name, s.name].filter(Boolean).join(' - ')}</option>)}
                </select>
                <button disabled={!sectionId || busy} onClick={addSection} className="px-3 py-2 bg-indigo-600 text-white rounded-lg font-semibold disabled:opacity-50">Add all</button>
              </div>
              <div className="relative">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="…or search one student by name / admission no" className={`${inputCls} w-full`} />
                {results.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {results.map((s) => (
                      <button key={s.id} onClick={() => addStudent(s)} className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-slate-800">
                        <span className="font-semibold">{fullName(s)}</span> <span className="font-mono text-slate-400">{s.admissionNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500">A student is in one house at a time — adding moves them from any other house.</p>
            </div>
            {members.length === 0 ? (
              <p className="text-center text-slate-500 py-6">No members yet.</p>
            ) : (
              <table className="w-full">
                <thead><tr className="text-left text-slate-500"><th className="py-1">Student</th><th>Adm No</th><th>{academic.label('course')}</th><th /></tr></thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-1.5 font-semibold text-slate-900 dark:text-white">{fullName(m)}</td>
                      <td className="font-mono">{m.admissionNumber}</td>
                      <td>{[m.section?.semester?.course?.name, m.section?.name].filter(Boolean).join(' - ')}</td>
                      <td className="text-right">
                        <button title="Remove from house" disabled={busy} onClick={() => act(() => houseService.removeMember(house.id, m.id), `${fullName(m)} removed`)} className="text-slate-400 hover:text-rose-600"><UserMinus className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex flex-wrap gap-2">
              <input type="number" min="1" value={award.points} onChange={(e) => setAward((a) => ({ ...a, points: e.target.value }))} placeholder="Points" className={`${inputCls} w-24`} />
              <input value={award.reason} onChange={(e) => setAward((a) => ({ ...a, reason: e.target.value }))} placeholder="Reason, e.g. Inter-house football — 1st place" className={`${inputCls} flex-1 min-w-[180px]`} />
              <button disabled={busy} onClick={() => submitPoints(1)} className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-50"><Plus className="w-3.5 h-3.5" /> Award</button>
              <button disabled={busy} onClick={() => submitPoints(-1)} className="flex items-center gap-1 px-3 py-2 bg-rose-600 text-white rounded-lg font-semibold disabled:opacity-50"><Minus className="w-3.5 h-3.5" /> Deduct</button>
            </div>
            {points.length === 0 ? (
              <p className="text-center text-slate-500 py-6">No points recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {points.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{p.reason}</p>
                      <p className="text-slate-400">{new Date(p.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                    <span className={`font-mono font-bold ${p.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{p.points > 0 ? '+' : ''}{p.points}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/** Houses / groups for inter-house competitions: mentor teacher, members and points standings. */
export const HouseGroupSetupPage = () => {
  const academic = useAcademic();
  const { notifySuccess, notifyError } = useNotification();
  const [houses, setHouses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyHouse);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    houseService.getAll()
      .then((res) => setHouses(res.data || []))
      .catch((err) => { notifyError(`Failed to load houses: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => {
    load();
    staffService.getAll().then((res) => setStaff(res.data || [])).catch(() => {});
    sectionService.getAll().then((res) => setSections(res.data || [])).catch(() => {});
  }, [load]);

  const openNew = () => { setEditing(null); setForm(emptyHouse); setModalOpen(true); };
  const openEdit = (h) => { setEditing(h); setForm({ name: h.name, color: h.color, mentorStaffId: h.mentorStaffId || '', description: h.description || '' }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await houseService.update(editing.id, form);
      else await houseService.create(form);
      notifySuccess(editing ? 'House updated' : 'House created');
      setModalOpen(false);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await houseService.remove(toDelete.id);
      notifySuccess(`${toDelete.name} deleted — its members are now unassigned`);
      setToDelete(null);
      load();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = houses.filter((h) => !q || h.name.toLowerCase().includes(q) || fullName(h.mentor).toLowerCase().includes(q));

  const columns = [
    { header: 'Rank', key: 'rank', render: (val) => <span className="font-mono font-bold">#{val}</span> },
    {
      header: 'House', key: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: row.color }} />
          <span className="font-bold text-slate-900 dark:text-white">{val}</span>
        </div>
      ),
    },
    { header: `${academic.label('teacher')} Mentor`, key: 'mentor', sortable: false, render: (val) => fullName(val) || <span className="text-slate-400">Not assigned</span> },
    { header: 'Members', key: 'members', render: (val) => `${val} students` },
    { header: 'Points', key: 'points', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-3 text-xs">
          <button onClick={() => setSelected(row)} className="flex items-center gap-1 text-indigo-600 font-bold hover:underline"><Users className="w-3.5 h-3.5" /> Manage</button>
          <button onClick={() => openEdit(row)} title="Edit" className="text-slate-500 hover:text-indigo-600"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => setToDelete(row)} title="Delete" className="text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  const fields = [
    { name: 'name', label: 'House Name', required: true, placeholder: 'Ruby House' },
    { name: 'color', label: 'Colour', type: 'color' },
    { name: 'mentorStaffId', label: `${academic.label('teacher')} Mentor`, type: 'select', placeholder: 'No mentor', options: staff.map((s) => ({ value: s.id, label: `${fullName(s)}${s.employeeCode ? ` (${s.employeeCode})` : ''}` })), span: 'full' },
    { name: 'description', label: 'Motto / Description', type: 'textarea', span: 'full' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">House / Group Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Houses for inter-house sports, cultural and academic competitions — assign a mentor, add students and keep a points log</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Add House" onAddClick={openNew} />
      {error ? <ErrorState onRetry={load} /> : <DataTable columns={columns} data={filtered} loading={loading} />}

      <FormModal
        isOpen={modalOpen}
        title={editing ? 'Edit House' : 'Add House'}
        icon={Shield}
        fields={fields}
        values={form}
        onChange={(name, value) => setForm((f) => ({ ...f, [name]: value }))}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
        submitLabel={editing ? 'Save Changes' : 'Create House'}
        isSubmitting={saving}
      />
      <ConfirmDialog
        isOpen={!!toDelete}
        title="Delete house?"
        message={toDelete ? `${toDelete.name} and its points log will be deleted. Its ${toDelete.members} member(s) will become unassigned.` : ''}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
      {selected && <HouseDetail house={selected} sections={sections} onClose={() => setSelected(null)} onChanged={load} />}
    </div>
  );
};

export default HouseGroupSetupPage;
