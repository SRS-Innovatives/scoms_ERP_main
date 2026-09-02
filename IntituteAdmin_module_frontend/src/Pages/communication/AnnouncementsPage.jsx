import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import announcementService from '../../services/announcementService';
import courseService from '../../services/courseService';
import sectionService from '../../services/sectionService';

const emptyForm = { title: '', content: '', targetRole: 'ALL', targetCourseId: '', targetSectionId: '', priority: 'NORMAL' };

export const AnnouncementsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [annRes, courseRes] = await Promise.all([announcementService.getAll(), courseService.getAll()]);
      setAnnouncements(annRes.data || []);
      setCourses(courseRes.data || []);
    } catch (error) {
      notifyError(`Failed to load announcements: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (form.targetCourseId) {
      sectionService.getAll()
        .then((res) => setSections((res.data || []).filter((s) => s.semester?.course?.id === form.targetCourseId)))
        .catch(() => {});
    } else {
      setSections([]);
    }
  }, [form.targetCourseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await announcementService.create({
        ...form,
        targetCourseId: form.targetCourseId || undefined,
        targetSectionId: form.targetSectionId || undefined,
      });
      notifySuccess(`Announcement "${form.title}" published successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to publish announcement: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    try {
      await announcementService.remove(id);
      notifySuccess(`Announcement "${title}" removed.`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
    }
  };

  const columns = [
    { header: 'Announcement', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Target Audience', key: 'targetRole', render: (val, row) => `${val}${row.targetCourse ? ` · ${row.targetCourse.name}` : ''}${row.targetSection ? ` · ${row.targetSection.name}` : ''}` },
    { header: 'Priority', key: 'priority', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${val === 'URGENT' ? 'bg-rose-100 text-rose-800' : val === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{val}</span> },
    { header: 'Author', key: 'author', sortable: false, render: (val) => val?.email || 'Platform' },
    { header: 'Published', key: 'createdAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString('en-IN')}</span> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id, row) => (
        <button onClick={() => handleDelete(id, row.title)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Announcements & Campus News Broadcast</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Post announcements visible to staff, students, or a specific course/section</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Post New Announcement</span>
        </button>
      </div>

      {!loading && announcements.length === 0 ? (
        <EmptyState title="No Announcements Yet" description="Post your institution's first announcement." actionLabel="Post New Announcement" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={announcements} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Post Announcement"
        subtitle="Choose who should see this — everyone, staff, students, or one course/section"
        icon={Megaphone}
        submitLabel="Publish"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value, ...(name === 'targetCourseId' ? { targetSectionId: '' } : {}) }))}
        fields={[
          { name: 'title', label: 'Title', required: true, span: 'full' },
          { name: 'content', label: 'Message', type: 'textarea', required: true, span: 'full' },
          {
            name: 'targetRole',
            label: 'Audience',
            type: 'select',
            required: true,
            options: [
              { value: 'ALL', label: 'Everyone' },
              { value: 'STAFF', label: 'Staff Only' },
              { value: 'STUDENTS', label: 'Students Only' },
              { value: 'PARENTS', label: 'Parents Only' },
            ],
          },
          {
            name: 'priority',
            label: 'Priority',
            type: 'select',
            required: true,
            options: [
              { value: 'NORMAL', label: 'Normal' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ],
          },
          {
            name: 'targetCourseId',
            label: 'Course (optional — narrows audience)',
            type: 'select',
            options: courses.map((c) => ({ value: c.id, label: c.name })),
          },
          {
            name: 'targetSectionId',
            label: 'Section (optional — narrows further)',
            type: 'select',
            disabled: !form.targetCourseId,
            options: sections.map((s) => ({ value: s.id, label: `${s.name} — ${s.semester?.course?.name || ''}` })),
          },
        ]}
      />
    </div>
  );
};

export default AnnouncementsPage;
