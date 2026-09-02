import React, { useState, useEffect, useCallback } from 'react';
import { Printer, Loader2, Save, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import sectionService from '../../services/sectionService';
import subjectService from '../../services/subjectService';
import staffService from '../../services/staffService';
import timetableService from '../../services/timetableService';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS = { MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday' };
const PERIOD_TIMES = { 1: ['08:45', '09:40'], 2: ['09:40', '10:35'], 3: ['10:45', '11:40'], 4: ['11:40', '12:35'], 5: ['13:30', '14:25'], 6: ['14:25', '15:20'], 7: ['15:20', '16:15'] };
const PERIODS = Object.keys(PERIOD_TIMES).map(Number);

const staffDisplayName = (s) => {
  if (!s?.user?.email) return s?.employeeCode || '—';
  return s.user.email.split('@')[0].split(/[._-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const ClassTimetablePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [sectionId, setSectionId] = useState('');
  const [timetable, setTimetable] = useState(null);
  const [grid, setGrid] = useState({}); // key `${day}_${period}` -> { subjectId, staffId, roomNumber, label }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    Promise.all([sectionService.getAll(), staffService.getAll()])
      .then(([secRes, staffRes]) => {
        setSections(secRes.data || []);
        setStaffList(staffRes.data || []);
        if ((secRes.data || []).length > 0) setSectionId(secRes.data[0].id);
      })
      .catch((err) => notifyError(`Failed to load setup data: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const selectedSection = sections.find((s) => s.id === sectionId);

  const loadTimetable = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const [ttRes, subRes] = await Promise.all([
        timetableService.getForSection(sectionId),
        subjectService.getAll(selectedSection?.semester?.course?.id),
      ]);
      setTimetable(ttRes.data);
      setSubjects(subRes.data || []);
      const g = {};
      (ttRes.data.entries || []).forEach((e) => {
        g[`${e.dayOfWeek}_${e.period}`] = { subjectId: e.subjectId || '', staffId: e.staffId || '', roomNumber: e.roomNumber || '', label: e.label || '' };
      });
      setGrid(g);
    } catch (err) {
      notifyError(`Failed to load timetable: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [sectionId, selectedSection, notifyError]);

  useEffect(() => {
    loadTimetable();
  }, [sectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!timetable) return;
    setSaving(true);
    try {
      const entries = Object.entries(grid)
        .filter(([, cell]) => cell.subjectId || cell.label)
        .map(([key, cell]) => {
          const [day, period] = key.split('_');
          return {
            dayOfWeek: day,
            period: Number(period),
            startTime: PERIOD_TIMES[period][0],
            endTime: PERIOD_TIMES[period][1],
            subjectId: cell.subjectId || undefined,
            staffId: cell.staffId || undefined,
            label: cell.label || undefined,
            roomNumber: cell.roomNumber || undefined,
          };
        });
      await timetableService.saveEntries(timetable.id, entries);
      notifySuccess('Timetable saved successfully!');
    } catch (err) {
      notifyError(`Failed to save timetable: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const cellSubject = (day, period) => {
    const cell = grid[`${day}_${period}`];
    if (!cell) return null;
    if (cell.subjectId) {
      const subject = subjects.find((s) => s.id === cell.subjectId);
      const staff = staffList.find((s) => s.id === cell.staffId);
      return { label: subject?.name || 'Subject', sub: staff ? staffDisplayName(staff) : cell.roomNumber || '' };
    }
    if (cell.label) return { label: cell.label, sub: '' };
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Class Timetable Grid</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Click any cell to assign a subject, teacher, and room</p>
        </div>

        <div className="flex items-center gap-3">
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200">
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.semester?.course?.name} - {s.name}</option>
            ))}
          </select>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Timetable'}</span>
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3 border-r border-slate-200 dark:border-slate-700 text-left w-28">Day / Time</th>
                  {PERIODS.map((p) => (
                    <th key={p} className="p-3 border-r border-slate-200 dark:border-slate-700">
                      Period {p}<br /><span className="text-[9px] font-normal text-slate-400">{PERIOD_TIMES[p][0]} - {PERIOD_TIMES[p][1]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {DAYS.map((day) => (
                  <tr key={day} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 border-r border-slate-200 dark:border-slate-700 font-bold text-left text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/40">{DAY_LABELS[day]}</td>
                    {PERIODS.map((p) => {
                      const content = cellSubject(day, p);
                      return (
                        <td
                          key={p}
                          onClick={() => setEditingCell({ day, period: p })}
                          className="p-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                        >
                          {content ? (
                            <div>
                              <p className="font-semibold text-indigo-600 dark:text-indigo-400">{content.label}</p>
                              {content.sub && <p className="text-[10px] text-slate-400">{content.sub}</p>}
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">+</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingCell && (
        <CellEditorModal
          cell={grid[`${editingCell.day}_${editingCell.period}`] || {}}
          day={DAY_LABELS[editingCell.day]}
          period={editingCell.period}
          subjects={subjects}
          staffList={staffList}
          onClose={() => setEditingCell(null)}
          onSave={(cellData) => {
            setGrid((prev) => ({ ...prev, [`${editingCell.day}_${editingCell.period}`]: cellData }));
            setEditingCell(null);
          }}
          onClear={() => {
            setGrid((prev) => {
              const next = { ...prev };
              delete next[`${editingCell.day}_${editingCell.period}`];
              return next;
            });
            setEditingCell(null);
          }}
        />
      )}
    </div>
  );
};

const CellEditorModal = ({ cell, day, period, subjects, staffList, onClose, onSave, onClear }) => {
  const [subjectId, setSubjectId] = useState(cell.subjectId || '');
  const [staffId, setStaffId] = useState(cell.staffId || '');
  const [roomNumber, setRoomNumber] = useState(cell.roomNumber || '');
  const [label, setLabel] = useState(cell.label || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{day} — Period {period}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setLabel(''); }} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <option value="">— None (use label instead) —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {!subjectId && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Or Label (Assembly, Lunch, Games...)</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
            </div>
          )}
          {subjectId && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Teacher</label>
                <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <option value="">Unassigned</option>
                  {staffList.map((s) => <option key={s.id} value={s.id}>{staffDisplayName(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Room</label>
                <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. Room 304" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-between gap-2 mt-5">
          <button onClick={onClear} className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg">Clear Cell</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg">Cancel</button>
            <button onClick={() => onSave({ subjectId, staffId, roomNumber, label: subjectId ? '' : label })} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassTimetablePage;
