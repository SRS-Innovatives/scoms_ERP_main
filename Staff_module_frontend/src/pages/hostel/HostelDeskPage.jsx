import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Loader2, BedDouble, ClipboardCheck, UserCheck2, Save } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import hostelDeskService from '../../services/hostelDeskService';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const TABS = ['Hostels', 'Beds', 'Night Attendance', 'Visitors'];
const emptyHostel = { name: '', type: 'BOYS', warden: '', messType: '', capacity: '' };
const emptyBed = { hostelId: '', roomNumber: '', bedNumber: '', monthlyFee: '' };
const emptyAllocate = { bedId: '', studentId: '' };
const emptyVisitor = { studentId: '', visitorName: '', relationship: '' };

export const HostelDeskPage = () => {
  const { success, error: showError } = useNotification();
  const [tab, setTab] = useState('Hostels');
  const [hostels, setHostels] = useState([]);
  const [beds, setBeds] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [hostelForm, setHostelForm] = useState(emptyHostel);
  const [bedForm, setBedForm] = useState(emptyBed);
  const [allocateForm, setAllocateForm] = useState(emptyAllocate);
  const [visitorForm, setVisitorForm] = useState(emptyVisitor);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([hostelDeskService.getHostels(), hostelDeskService.getBeds(), hostelDeskService.getAttendance(), hostelDeskService.getVisitors()])
      .then(([h, b, a, v]) => { setHostels(h.data || []); setBeds(b.data || []); setAttendance(a.data || []); setVisitors(v.data || []); })
      .catch((err) => { showError(err.message || 'Failed to load hostel desk', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddHostel = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await hostelDeskService.createHostel({ ...hostelForm, capacity: Number(hostelForm.capacity) || undefined });
      success('Hostel block created.');
      setHostelForm(emptyHostel); setFormOpen(false); fetchAll();
    } catch (err) { showError(err.message || 'Failed to create hostel', 'Save Failed'); } finally { setSubmitting(false); }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await hostelDeskService.createBed({ ...bedForm, monthlyFee: Number(bedForm.monthlyFee) || undefined });
      success('Bed added.');
      setBedForm(emptyBed); setFormOpen(false); fetchAll();
    } catch (err) { showError(err.message || 'Failed to add bed', 'Save Failed'); } finally { setSubmitting(false); }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await hostelDeskService.allocateBed(allocateForm);
      success('Bed allocated.');
      setAllocateForm(emptyAllocate); setFormOpen(false); fetchAll();
    } catch (err) { showError(err.message || 'Failed to allocate bed', 'Save Failed'); } finally { setSubmitting(false); }
  };

  const handleVacate = async (bedId) => {
    try { await hostelDeskService.vacateBed(bedId); success('Bed vacated.'); fetchAll(); }
    catch (err) { showError(err.message || 'Failed to vacate bed', 'Update Failed'); }
  };

  const markPresent = async (bedId, status) => {
    try { await hostelDeskService.markAttendance([{ bedId, status }]); success('Attendance recorded.'); fetchAll(); }
    catch (err) { showError(err.message || 'Failed to mark attendance', 'Update Failed'); }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await hostelDeskService.checkInVisitor(visitorForm);
      success('Visitor checked in.');
      setVisitorForm(emptyVisitor); setFormOpen(false); fetchAll();
    } catch (err) { showError(err.message || 'Failed to check in visitor', 'Save Failed'); } finally { setSubmitting(false); }
  };

  const handleCheckOut = async (id) => {
    try { await hostelDeskService.checkOutVisitor(id); success('Visitor checked out.'); fetchAll(); }
    catch (err) { showError(err.message || 'Failed to check out visitor', 'Update Failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  if (error) return <ErrorState onRetry={fetchAll} />;

  const addLabel = { Hostels: 'Add Hostel', Beds: 'Add Bed', 'Night Attendance': null, Visitors: 'Check In Visitor' }[tab];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Hostel Desk</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Blocks, bed allocation, night roll call and visitor register</p>
        </div>
        {addLabel && (
          <button onClick={() => setFormOpen((v) => !v)} className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
            <Plus className="w-4 h-4" /> {formOpen ? 'Close' : addLabel}
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => { setTab(t); setFormOpen(false); }}
            className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px ${tab === t ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {formOpen && tab === 'Hostels' && (
        <form onSubmit={handleAddHostel} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div><label className="block font-semibold mb-1">Hostel Name</label><input required value={hostelForm.name} onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div><label className="block font-semibold mb-1">Type</label><select value={hostelForm.type} onChange={(e) => setHostelForm({ ...hostelForm, type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">{['BOYS', 'GIRLS', 'CO_ED'].map((t) => <option key={t} value={t}>{t.replace('_', '-')}</option>)}</select></div>
          <div><label className="block font-semibold mb-1">Warden</label><input value={hostelForm.warden} onChange={(e) => setHostelForm({ ...hostelForm, warden: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div><label className="block font-semibold mb-1">Mess Type</label><input value={hostelForm.messType} onChange={(e) => setHostelForm({ ...hostelForm, messType: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div><label className="block font-semibold mb-1">Capacity</label><input type="number" value={hostelForm.capacity} onChange={(e) => setHostelForm({ ...hostelForm, capacity: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div className="md:col-span-3 flex justify-end"><button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 rounded-xl disabled:opacity-50"><Save className="w-4 h-4" /> Save</button></div>
        </form>
      )}

      {formOpen && tab === 'Beds' && (
        <div className="space-y-4">
          <form onSubmit={handleAddBed} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="md:col-span-4 text-[11px] font-bold text-slate-500 uppercase">Add Bed to Inventory</div>
            <div><label className="block font-semibold mb-1">Hostel</label><select required value={bedForm.hostelId} onChange={(e) => setBedForm({ ...bedForm, hostelId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"><option value="">Select</option>{hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
            <div><label className="block font-semibold mb-1">Room Number</label><input required value={bedForm.roomNumber} onChange={(e) => setBedForm({ ...bedForm, roomNumber: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
            <div><label className="block font-semibold mb-1">Bed Number</label><input required value={bedForm.bedNumber} onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
            <div><label className="block font-semibold mb-1">Monthly Fee (₹)</label><input type="number" value={bedForm.monthlyFee} onChange={(e) => setBedForm({ ...bedForm, monthlyFee: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
            <div className="md:col-span-4 flex justify-end"><button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 rounded-xl disabled:opacity-50"><Save className="w-4 h-4" /> Save</button></div>
          </form>
          <form onSubmit={handleAllocate} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-3 text-[11px] font-bold text-slate-500 uppercase">Allocate Bed to Student</div>
            <div><label className="block font-semibold mb-1">Bed</label><select required value={allocateForm.bedId} onChange={(e) => setAllocateForm({ ...allocateForm, bedId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"><option value="">Select</option>{beds.filter((b) => !b.isOccupied).map((b) => <option key={b.id} value={b.id}>{b.hostel?.name} — Room {b.roomNumber}/Bed {b.bedNumber}</option>)}</select></div>
            <div><label className="block font-semibold mb-1">Student ID</label><input required value={allocateForm.studentId} onChange={(e) => setAllocateForm({ ...allocateForm, studentId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
            <div className="flex items-end"><button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 rounded-xl disabled:opacity-50 w-full justify-center"><Save className="w-4 h-4" /> Allocate</button></div>
          </form>
        </div>
      )}

      {formOpen && tab === 'Visitors' && (
        <form onSubmit={handleCheckIn} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div><label className="block font-semibold mb-1">Student ID (Hosteler)</label><input required value={visitorForm.studentId} onChange={(e) => setVisitorForm({ ...visitorForm, studentId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div><label className="block font-semibold mb-1">Visitor Name</label><input required value={visitorForm.visitorName} onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div><label className="block font-semibold mb-1">Relationship</label><input value={visitorForm.relationship} onChange={(e) => setVisitorForm({ ...visitorForm, relationship: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div className="md:col-span-3 flex justify-end"><button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 rounded-xl disabled:opacity-50"><Save className="w-4 h-4" /> Check In</button></div>
        </form>
      )}

      {tab === 'Hostels' && (
        hostels.length === 0 ? <EmptyState title="No Hostels" message="Create the first hostel block." icon={Building2} /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hostels.map((h) => (
              <div key={h.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{h.name} <span className="text-[10px] font-normal text-slate-400">{h.type}</span></p>
                <p className="text-[11px] text-slate-500 mt-1">Warden: {h.warden || '—'} • Mess: {h.messType || '—'}</p>
                <p className="text-[11px] text-slate-400 mt-1">{h.occupiedBeds}/{h._count?.beds || 0} beds occupied • Capacity {h.capacity}</p>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'Beds' && (
        beds.length === 0 ? <EmptyState title="No Beds" message="Add bed inventory above." icon={BedDouble} /> : (
          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500"><tr><th className="text-left p-3 font-semibold">Hostel</th><th className="text-left p-3 font-semibold">Room/Bed</th><th className="text-left p-3 font-semibold">Occupant</th><th className="p-3"></th></tr></thead>
              <tbody>
                {beds.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-3 text-slate-600">{b.hostel?.name}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">Room {b.roomNumber} / Bed {b.bedNumber}</td>
                    <td className="p-3 text-slate-600">{b.student ? `${b.student.firstName} ${b.student.lastName} (${b.student.rollNumber})` : <span className="text-emerald-600 font-semibold">Vacant</span>}</td>
                    <td className="p-3">{b.isOccupied && <button onClick={() => handleVacate(b.id)} className="px-2 py-1 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg text-[11px] font-semibold">Vacate</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'Night Attendance' && (
        attendance.length === 0 ? <EmptyState title="No Occupied Beds" message="Allocate beds to see the roll call roster." icon={ClipboardCheck} /> : (
          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500"><tr><th className="text-left p-3 font-semibold">Student</th><th className="text-left p-3 font-semibold">Room</th><th className="text-left p-3 font-semibold">Status</th><th className="p-3"></th></tr></thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.bedId} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{a.student?.firstName} {a.student?.lastName}</td>
                    <td className="p-3 text-slate-500">{a.roomNumber}/{a.bedNumber}</td>
                    <td className="p-3">{a.attendance ? <span className="text-emerald-600 font-semibold">{a.attendance.status}</span> : <span className="text-slate-400">Not marked</span>}</td>
                    <td className="p-3 flex gap-1">
                      <button onClick={() => markPresent(a.bedId, 'PRESENT')} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-semibold">Present</button>
                      <button onClick={() => markPresent(a.bedId, 'ABSENT')} className="px-2 py-1 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg text-[11px] font-semibold">Absent</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'Visitors' && (
        visitors.length === 0 ? <EmptyState title="No Visitors" message="Check in a visitor above." icon={UserCheck2} /> : (
          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500"><tr><th className="text-left p-3 font-semibold">Gate Pass</th><th className="text-left p-3 font-semibold">Student</th><th className="text-left p-3 font-semibold">Visitor</th><th className="text-left p-3 font-semibold">In</th><th className="text-left p-3 font-semibold">Out</th><th className="p-3"></th></tr></thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-3 font-mono text-slate-500">{v.gatePassNo}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{v.student?.firstName} {v.student?.lastName}</td>
                    <td className="p-3 text-slate-600">{v.visitorName} {v.relationship ? `(${v.relationship})` : ''}</td>
                    <td className="p-3 text-slate-500">{new Date(v.checkInAt).toLocaleTimeString('en-IN')}</td>
                    <td className="p-3 text-slate-500">{v.checkOutAt ? new Date(v.checkOutAt).toLocaleTimeString('en-IN') : '—'}</td>
                    <td className="p-3">{!v.checkOutAt && <button onClick={() => handleCheckOut(v.id)} className="px-2 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-lg text-[11px] font-semibold">Check Out</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default HostelDeskPage;
