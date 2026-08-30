import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { MapPin } from 'lucide-react';
import transportService from '../../services/transportService';
import studentService from '../../services/studentService';

const emptyForm = { studentId: '', routeId: '', pickupPoint: '' };

export const StudentRouteMappingPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [mappings, setMappings] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([transportService.getMappings(), transportService.getRoutes(), studentService.getAll()])
      .then(([mapRes, routeRes, studentRes]) => {
        setMappings(mapRes.data || []);
        setRoutes(routeRes.data || []);
        setStudents(studentRes.data || []);
      })
      .catch((err) => notifyError(`Failed to load route mappings: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await transportService.assignStudentToRoute(form);
      notifySuccess('Student mapped to bus route successfully!');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to map student: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Roll No', key: 'student', sortable: false, render: (val) => <span className="font-mono font-bold text-indigo-600">{val?.rollNumber}</span> },
    { header: 'Student Name', key: 'student2', sortable: false, render: (_, row) => <span className="font-bold text-slate-900 dark:text-white">{row.student?.firstName} {row.student?.lastName}</span> },
    { header: 'Course', key: 'student3', sortable: false, render: (_, row) => row.student?.course?.name },
    { header: 'Assigned Route', key: 'route', sortable: false, render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val?.routeName}</span> },
    { header: 'Pickup Point', key: 'pickupPoint' },
    { header: 'Monthly Fee (₹)', key: 'route2', sortable: false, render: (_, row) => <span className="font-mono font-bold text-emerald-600">₹{row.route?.monthlyFare.toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Bus Route Mapping</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Map students to bus pickup stops and routes</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
          <MapPin className="w-4 h-4" /> Map Student to Route
        </button>
      </div>

      {!loading && mappings.length === 0 ? (
        <EmptyState title="No Students Mapped Yet" description="Map the first student to a bus route." actionLabel="Map Student to Route" onAction={() => setModalOpen(true)} icon={MapPin} />
      ) : (
        <DataTable columns={columns} data={mappings} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Map Student to Bus Route"
        icon={MapPin}
        submitLabel="Assign Route"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'studentId', label: 'Student', type: 'select', required: true, span: 'full', options: students.map((s) => ({ value: s.id, label: `${s.rollNumber} — ${s.firstName} ${s.lastName}` })) },
          { name: 'routeId', label: 'Bus Route', type: 'select', required: true, span: 'full', options: routes.map((r) => ({ value: r.id, label: `${r.routeName} (₹${r.monthlyFare.toLocaleString()}/mo)` })) },
          { name: 'pickupPoint', label: 'Pickup Stop Point', required: true, span: 'full' },
        ]}
      />
    </div>
  );
};

export default StudentRouteMappingPage;
