import React, { useState, useEffect } from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { useInstitution } from '../../context/InstitutionContext';
import { Building2, Save, MapPin, Loader2 } from 'lucide-react';
import institutionProfileService from '../../services/institutionProfileService';

const EMPTY_FORM = {
  affiliation: '', board: '', university: '', principalName: '', establishedYear: '',
  address: '', city: '', district: '', state: '', pincode: '', phone: '', email: '', website: '',
};

export const InstituteProfilePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const { institution, loading, refetch } = useInstitution();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (institution) {
      setFormData({
        affiliation: institution.affiliation || '',
        board: institution.board || '',
        university: institution.university || '',
        principalName: institution.principalName || '',
        establishedYear: institution.establishedYear || '',
        address: institution.address || '',
        city: institution.city || '',
        district: institution.district || '',
        state: institution.state || '',
        pincode: institution.pincode || '',
        phone: institution.phone || '',
        email: institution.email || '',
        website: institution.website || '',
      });
    }
  }, [institution]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await institutionProfileService.updateProfile(formData);
      await refetch();
      notifySuccess('Institute profile details updated successfully!', 'Saved');
    } catch (err) {
      notifyError(`Failed to save profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const field = (key) => ({
    value: formData[key],
    onChange: (e) => setFormData({ ...formData, [key]: e.target.value }),
  });

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Institute Profile Setup</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Contact and affiliation details printed on receipts, hall tickets & certificates</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <FormSection title="General Information" subtitle="Institution name & code are managed by SCOMS Platform Admin" icon={Building2}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Institution Name (Read-Only)</label>
            <input type="text" disabled value={institution?.name || ''} className="w-full p-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Institution Code (Read-Only)</label>
            <input type="text" disabled value={institution?.code || ''} className="w-full p-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Principal / Head Name</label>
            <input type="text" {...field('principalName')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" />
          </div>
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">University / Board Affiliation</label>
            <input type="text" {...field('affiliation')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Established Year</label>
            <input type="number" {...field('establishedYear')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Contact & Location Details" subtitle="Official address for communication and printed documents" icon={MapPin}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Campus Address</label>
            <input type="text" {...field('address')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
            <input type="text" {...field('city')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State</label>
            <input type="text" {...field('state')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Pincode</label>
            <input type="text" {...field('pincode')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input type="text" {...field('phone')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Email</label>
            <input type="email" {...field('email')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Website</label>
            <input type="text" {...field('website')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" />
          </div>
        </div>
      </FormSection>
    </form>
  );
};

export default InstituteProfilePage;
