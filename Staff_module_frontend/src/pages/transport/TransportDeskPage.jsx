import React, { useState, useEffect, useCallback } from 'react';
import { Bus, Plus, Loader2, X, Save, MapPin, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import transportDeskService from '../../services/transportDeskService';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const TABS = ['Vehicles', 'Routes', 'Mappings', 'Trip Log'];

const emptyVehicle = { vehicleNumber: '', vehicleType: 'BUS', capacity: '', driverName: '', driverPhone: '' };
const emptyRoute = { routeName: '', startPoint: '', endPoint: '', monthlyFare: '', vehicleId: '' };
const emptyMapping = { studentId: '', routeId: '', pickupPoint: '' };

export const TransportDeskPage = () => {
  const { success, error: showError } = useNotification();
  const [tab, setTab] = useState('Vehicles');
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [routeForm, setRouteForm] = useState(emptyRoute);
  const [mappingForm, setMappingForm] = useState(emptyMapping);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      transportDeskService.getVehicles(),
      transportDeskService.getRoutes(),
      transportDeskService.getMappings(),
      transportDeskService.getTrips(),
    ])
      .then(([v, r, m, t]) => { setVehicles(v.data || []); setRoutes(r.data || []); setMappings(m.data || []); setTrips(t.data || []); })
      .catch((err) => { showError(err.message || 'Failed to load transport desk', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await transportDeskService.createVehicle({ ...vehicleForm, capacity: Number(vehicleForm.capacity) || undefined });
      success('Vehicle added to fleet.');
      setVehicleForm(emptyVehicle); setFormOpen(false); fetchAll();
    } catch (err) { showError(err.message || 'Failed to add vehicle', 'Save Failed'); } finally { setSubmitting(false); }
  };

  const handleAddRoute = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await transportDeskService.createRoute({ ...routeForm, monthlyFare: Number(routeForm.monthlyFare), vehicleId: routeForm.vehicleId || undefined });
      success('Route created.');
      setRouteForm(emptyRoute); setFormOpen(false); fetchAll();
    } catch (err) { showError(err.message || 'Failed to create route', 'Save Failed'); } finally { setSubmitting(false); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await transportDeskService.assignStudent(mappingForm);
      success('Student assigned to route.');
      setMappingForm(emptyMapping); setFormOpen(false); fetchAll();
    } catch (err) { showError(err.message || 'Failed to assign student', 'Save Failed'); } finally { setSubmitting(false); }
  };

  const markTrip = async (vehicleId, session) => {
    try {
      await transportDeskService.markTripComplete({ vehicleId, session });
      success(`${session} trip marked complete.`);
      fetchAll();
    } catch (err) { showError(err.message || 'Failed to mark trip', 'Update Failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  if (error) return <ErrorState onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Transport Desk</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Fleet, routes, student mapping and daily boarding log</p>
        </div>
        {tab !== 'Trip Log' && (
          <button onClick={() => setFormOpen((v) => !v)} className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
            <Plus className="w-4 h-4" /> {formOpen ? 'Close' : `Add ${tab.replace(/s$/, '')}`}
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => (
          <button key={t} onClick={() => { setTab(t); setFormOpen(false); }}
            className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px ${tab === t ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {formOpen && tab === 'Vehicles' && (
        <form onSubmit={handleAddVehicle} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div><label className="block font-semibold mb-1">Vehicle Number</label><input required value={vehicleForm.vehicleNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div><label className="block font-semibold mb-1">Capacity</label><input type="number" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div><label className="block font-semibold mb-1">Driver Name</label><input value={vehicleForm.driverName} onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div><label className="block font-semibold mb-1">Driver Phone</label><input value={vehicleForm.driverPhone} onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div className="md:col-span-3 flex justify-end"><button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 rounded-xl disabled:opacity-50"><Save className="w-4 h-4" /> Save</button></div>
        </form>
      )}

      {formOpen && tab === 'Routes' && (
        <form onSubmit={handleAddRoute} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div><label className="block font-semibold mb-1">Route Name</label><input required value={routeForm.routeName} onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div><label className="block font-semibold mb-1">Start Point</label><input required value={routeForm.startPoint} onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div><label className="block font-semibold mb-1">End Point</label><input required value={routeForm.endPoint} onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div><label className="block font-semibold mb-1">Monthly Fare (₹)</label><input type="number" required value={routeForm.monthlyFare} onChange={(e) => setRouteForm({ ...routeForm, monthlyFare: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div>
            <label className="block font-semibold mb-1">Vehicle</label>
            <select value={routeForm.vehicleId} onChange={(e) => setRouteForm({ ...routeForm, vehicleId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <option value="">— Unassigned —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end"><button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 rounded-xl disabled:opacity-50"><Save className="w-4 h-4" /> Save</button></div>
        </form>
      )}

      {formOpen && tab === 'Mappings' && (
        <form onSubmit={handleAssign} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div><label className="block font-semibold mb-1">Student ID</label><input required value={mappingForm.studentId} onChange={(e) => setMappingForm({ ...mappingForm, studentId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div>
            <label className="block font-semibold mb-1">Route</label>
            <select required value={mappingForm.routeId} onChange={(e) => setMappingForm({ ...mappingForm, routeId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <option value="">Select route</option>
              {routes.map((r) => <option key={r.id} value={r.id}>{r.routeName}</option>)}
            </select>
          </div>
          <div><label className="block font-semibold mb-1">Pickup Point</label><input required value={mappingForm.pickupPoint} onChange={(e) => setMappingForm({ ...mappingForm, pickupPoint: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
          <div className="md:col-span-3 flex justify-end"><button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 rounded-xl disabled:opacity-50"><Save className="w-4 h-4" /> Save</button></div>
        </form>
      )}

      {tab === 'Vehicles' && (
        vehicles.length === 0 ? <EmptyState title="No Vehicles" message="Add the first vehicle to your fleet." icon={Bus} /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((v) => (
              <div key={v.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{v.vehicleNumber} <span className="text-[10px] font-normal text-slate-400">{v.vehicleType}</span></p>
                <p className="text-[11px] text-slate-500 mt-1">Capacity {v.capacity} • Driver {v.driverName || '—'} {v.driverPhone ? `(${v.driverPhone})` : ''}</p>
                <p className="text-[11px] text-slate-400 mt-1">{v._count?.routes || 0} route(s) assigned</p>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'Routes' && (
        routes.length === 0 ? <EmptyState title="No Routes" message="Create the first transport route." icon={MapPin} /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((r) => (
              <div key={r.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{r.routeName}</p>
                <p className="text-[11px] text-slate-500 mt-1">{r.startPoint} → {r.endPoint} • ₹{r.monthlyFare}/month</p>
                <p className="text-[11px] text-slate-400 mt-1">Vehicle: {r.vehicle?.vehicleNumber || 'Unassigned'} • {r._count?.mappings || 0} student(s)</p>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'Mappings' && (
        mappings.length === 0 ? <EmptyState title="No Students Mapped" message="Assign a student to a route above." icon={MapPin} /> : (
          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500"><tr><th className="text-left p-3 font-semibold">Student</th><th className="text-left p-3 font-semibold">Route</th><th className="text-left p-3 font-semibold">Pickup</th></tr></thead>
              <tbody>
                {mappings.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{m.student?.firstName} {m.student?.lastName} ({m.student?.rollNumber})</td>
                    <td className="p-3 text-slate-600">{m.route?.routeName} <span className="text-slate-400">({m.route?.vehicle?.vehicleNumber})</span></td>
                    <td className="p-3 text-slate-600">{m.pickupPoint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'Trip Log' && (
        trips.length === 0 ? <EmptyState title="No Vehicles" message="Add a vehicle to see today's trip log." icon={CheckCircle2} /> : (
          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500"><tr><th className="text-left p-3 font-semibold">Vehicle</th><th className="text-left p-3 font-semibold">Route</th><th className="text-left p-3 font-semibold">Morning</th><th className="text-left p-3 font-semibold">Evening</th></tr></thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{t.vehicleNumber}</td>
                    <td className="p-3 text-slate-500">{t.routeName}</td>
                    <td className="p-3">{t.morning ? <span className="text-emerald-600 font-semibold">Completed</span> : <button onClick={() => markTrip(t.id, 'MORNING')} className="px-2 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-lg text-[11px] font-semibold">Mark Complete</button>}</td>
                    <td className="p-3">{t.evening ? <span className="text-emerald-600 font-semibold">Completed</span> : <button onClick={() => markTrip(t.id, 'EVENING')} className="px-2 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-lg text-[11px] font-semibold">Mark Complete</button>}</td>
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

export default TransportDeskPage;
