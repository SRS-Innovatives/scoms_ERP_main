import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../common/DataTable';
import EmptyState from '../common/EmptyState';
import FormModal from '../common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import customFieldService from '../../services/customFieldService';
import { ListPlus, Send, Edit, Trash2, Clock, CheckCircle2, XCircle, FilePenLine, Info } from 'lucide-react';

const emptyForm = { label: '', fieldType: 'TEXT', section: 'Additional Information', required: false, optionsText: '' };

const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'EMAIL', 'PHONE', 'TEXTAREA', 'SELECT', 'CHECKBOX'];

const STATUS_META = {
  DRAFT: { label: 'Draft', style: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: FilePenLine },
  PENDING_APPROVAL: { label: 'Pending Review', style: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', icon: Clock },
  APPROVED: { label: 'Live', style: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', style: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400', icon: XCircle },
};

/** Generic institution custom-field builder — the same draft -> submit -> SuperAdmin
 * review -> live lifecycle serves any form that opts in, parameterized purely by
 * `entityType`. Used today by both the Admission Form and Staff Registration builders. */
export const CustomFieldBuilder = ({ entityType, title, subtitle, liveDescription, emptyDescription }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submittingAll, setSubmittingAll] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customFieldService.getAll(entityType);
      setFields(res.data || []);
    } catch (error) {
      notifyError(`Failed to load fields: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [entityType, notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (field) => {
    setEditing(field);
    setForm({
      label: field.label, fieldType: field.fieldType, section: field.section,
      required: field.required, optionsText: (field.options || []).join(', '),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        label: form.label, fieldType: form.fieldType, section: form.section, required: form.required,
        ...(form.fieldType === 'SELECT' && { options: form.optionsText.split(',').map((o) => o.trim()).filter(Boolean) }),
      };
      if (editing) {
        await customFieldService.update(editing.id, payload);
        notifySuccess(editing.status === 'APPROVED' ? `"${form.label}" updated and re-submitted for approval` : `"${form.label}" updated`);
      } else {
        await customFieldService.create(payload, entityType);
        notifySuccess(`"${form.label}" added as a draft — submit it for SuperAdmin approval when ready`);
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save field: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (field) => {
    if (!window.confirm(`Delete "${field.label}"? This cannot be undone.`)) return;
    try {
      await customFieldService.remove(field.id);
      notifySuccess('Field deleted');
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
    }
  };

  const handleSubmitAll = async () => {
    setSubmittingAll(true);
    try {
      const res = await customFieldService.submitForApproval(entityType);
      notifySuccess(res.message);
      fetchAll();
    } catch (error) {
      notifyError(error.message);
    } finally {
      setSubmittingAll(false);
    }
  };

  const eligibleCount = fields.filter((f) => f.status === 'DRAFT' || f.status === 'REJECTED').length;

  const columns = [
    {
      header: 'Field', key: 'label',
      render: (val, row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{val}</p>
          <p className="text-[10px] text-slate-400">{row.section}</p>
        </div>
      ),
    },
    { header: 'Type', key: 'fieldType', render: (val) => <span className="text-[10px] font-semibold text-slate-500 uppercase">{val}</span> },
    { header: 'Required', key: 'required', render: (val) => val ? <span className="text-rose-500 font-bold text-xs">Yes</span> : <span className="text-slate-400 text-xs">No</span> },
    {
      header: 'Status', key: 'status', sortable: false,
      render: (val, row) => {
        const meta = STATUS_META[val] || STATUS_META.DRAFT;
        const Icon = meta.icon;
        return (
          <div>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${meta.style}`}>
              <Icon className="w-3 h-3" /> {meta.label}
            </span>
            {val === 'REJECTED' && row.rejectionReason && (
              <p className="text-[10px] text-rose-500 mt-1 max-w-xs">{row.rejectionReason}</p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions', key: 'actions', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            disabled={row.status === 'PENDING_APPROVAL'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 disabled:opacity-30 disabled:cursor-not-allowed"
            title={row.status === 'PENDING_APPROVAL' ? 'Awaiting SuperAdmin review — cannot edit yet' : 'Edit'}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs"
          >
            <ListPlus className="w-4 h-4" />
            Add Field
          </button>
          <button
            onClick={handleSubmitAll}
            disabled={submittingAll || eligibleCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submittingAll ? 'Submitting...' : `Submit ${eligibleCount > 0 ? `${eligibleCount} ` : ''}for Approval`}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3.5 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-700 dark:text-indigo-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>{liveDescription}</p>
      </div>

      {!loading && fields.length === 0 ? (
        <EmptyState title="No Custom Fields Yet" description={emptyDescription} actionLabel="Add Field" onAction={openCreate} />
      ) : (
        <DataTable columns={columns} data={fields} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editing ? 'Edit Field' : 'Add Custom Field'}
        subtitle={editing?.status === 'APPROVED' ? 'This field is live — saving will re-submit it for approval' : undefined}
        icon={ListPlus}
        submitLabel={editing ? 'Save' : 'Add as Draft'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'label', label: 'Field Label', required: true, span: 'full', placeholder: 'e.g. Blood Donor Consent' },
          { name: 'fieldType', label: 'Field Type', type: 'select', options: FIELD_TYPES.map((t) => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase() })) },
          { name: 'section', label: 'Section' },
          ...(form.fieldType === 'SELECT' ? [{ name: 'optionsText', label: 'Options (comma separated)', span: 'full', placeholder: 'Yes, No' }] : []),
          { name: 'required', label: 'Required Field', type: 'checkbox', span: 'full' },
        ]}
      />
    </div>
  );
};

export default CustomFieldBuilder;
