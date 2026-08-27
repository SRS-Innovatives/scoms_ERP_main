import React, { useState } from 'react';
import FormInput from '../../components/common/FormInput';
import Select from '../../components/common/Select';
import FileUpload from '../../components/common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { Check, ChevronRight, ChevronLeft, Building2, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import institutionService from '../../services/institutionService';

export const OnboardingWizardPage = () => {
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    "Basic Info",
    "Contact Info",
    "Academic Info",
    "Admin Account",
    "Plan",
    "Modules",
    "Documents",
    "Review",
    "Activate"
  ];

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: '',
    affiliation: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    plan: '',
    establishmentYear: '',
    accreditation: '',
    modules: ['', '']
  });

  const handleNext = async () => {
    if (currentStep < 9) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        const response = await institutionService.createInstitution(formData);

        if (response?.status === 201 || response?.status === 200) {
          success(`Institution ${formData.name} successfully onboarded and activated!`, 'Onboarding Complete');
          navigate('/super-admin/institutions');
        } else {
          console.error('Failed to create institution', response);
          // notification could be added here
        }
      } catch (error) {
        console.error("Onboarding failed", error);
        showError(error.message || "Failed to onboard institution.", "Activation Failed");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Wizard Header Progress Bar */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
          Institution Onboarding Wizard (Step {currentStep} of 9)
        </h2>
        <p className="text-xs text-slate-500 mb-4">Multi-step provisioner for new schools, colleges & universities.</p>

        {/* Progress Bar Steps */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto py-2">
          {steps.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div key={idx} className="flex items-center gap-1 shrink-0">
                <div
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                <span className={`text-[10px] font-semibold hidden md:inline ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {label}
                </span>
                {stepNum < 9 && <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700 hidden sm:inline" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Form Step Body */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 1: Basic Institution Information</h3>
            <FormInput label="Institution Name" required value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} placeholder="Enter institution name" />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Institution Code" required value={formData.code} onChange={(v) => setFormData({ ...formData, code: v })} placeholder="Enter institution code" />
              <Select label="Institution Type" value={formData.type} onChange={(v) => setFormData({ ...formData, type: v })} options={[{ value: 'SCHOOL', label: 'School' }, { value: 'COLLEGE', label: 'College' }, { value: 'UNIVERSITY', label: 'University' }, { value: 'POLYTECHNIC', label: 'Polytechnic' }]} />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 2: Contact & Address Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Official Email" required value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} placeholder="Enter official email" />
              <FormInput label="Official Phone" required value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} placeholder="Enter official phone" />
              <FormInput label="Street Address" required value={formData.address} onChange={(v) => setFormData({ ...formData, address: v })} placeholder="Enter street address" />
              <FormInput label="City" required value={formData.city} onChange={(v) => setFormData({ ...formData, city: v })} placeholder="Enter city" />
              <FormInput label="State" required value={formData.state} onChange={(v) => setFormData({ ...formData, state: v })} placeholder="Enter state" />
              <FormInput label="Pincode" required value={formData.pincode} onChange={(v) => setFormData({ ...formData, pincode: v })} placeholder="Enter pincode" />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 3: Academic Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Affiliation / University" required value={formData.affiliation} onChange={(v) => setFormData({ ...formData, affiliation: v })} placeholder="Enter affiliation / university" />
              <FormInput label="Establishment Year" required value={formData.establishmentYear} onChange={(v) => setFormData({ ...formData, establishmentYear: v })} placeholder="Enter establishment year" />
              <Select label="Accreditation Status" value={formData.accreditation} onChange={(v) => setFormData({ ...formData, accreditation: v })} options={[{ value: 'NAAC A++', label: 'NAAC A++' }, { value: 'NAAC A+', label: 'NAAC A+' }, { value: 'NAAC A', label: 'NAAC A' }, { value: 'NBA', label: 'NBA' }, { value: 'None', label: 'None' }]} placeholder="Select accreditation status" />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 4: Admin Account</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Admin Full Name" required value={formData.adminName} onChange={(v) => setFormData({ ...formData, adminName: v })} placeholder="Enter admin full name" />
              <FormInput label="Admin Official Email" required value={formData.adminEmail} onChange={(v) => setFormData({ ...formData, adminEmail: v })} placeholder="Enter admin official email" />
              <FormInput label="Temporary Password" type="password" required value={formData.adminPassword} onChange={(v) => setFormData({ ...formData, adminPassword: v })} placeholder="Enter temporary password" />
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 5: Subscription Plan</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Select Plan" value={formData.plan} onChange={(v) => setFormData({ ...formData, plan: v })} options={[{ value: 'Free', label: 'Free Tier' }, { value: 'Basic', label: 'Basic Plan' }, { value: 'Pro', label: 'Pro Plan' }, { value: 'Enterprise', label: 'Enterprise Plan' }]} />
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 6: Modules</h3>
            <p className="text-xs text-slate-500">Select the modules you wish to enable for this institution.</p>
            <div className="grid grid-cols-2 gap-4">
              {['Library Management', 'Hostel Management', 'Transport', 'Cafeteria', 'Alumni', 'Placement'].map(mod => (
                <label key={mod} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={formData.modules?.includes(mod)}
                    onChange={(e) => {
                      const newModules = e.target.checked
                        ? [...(formData.modules || []), mod]
                        : (formData.modules || []).filter(m => m !== mod);
                      setFormData({ ...formData, modules: newModules });
                    }}
                  />
                  {mod}
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 7: Documents</h3>
            <p className="text-xs text-slate-500">Upload mandatory registration and tax documents.</p>
            <FileUpload label="Registration Certificate (PDF)" />
            <FileUpload label="Tax Registration / GST (PDF)" />
          </div>
        )}

        {currentStep === 8 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 8: Final Review & Inspection</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
              <p><span className="font-bold">Institution:</span> {formData.name} ({formData.code})</p>
              <p><span className="font-bold">Type:</span> {formData.type} • Location: {formData.city}, {formData.state}</p>
              <p><span className="font-bold">Admin Email:</span> {formData.adminEmail}</p>
              <p><span className="font-bold">Subscription Plan:</span> {formData.plan}</p>
            </div>
          </div>
        )}

        {currentStep === 9 && (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Ready for Live Activation</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Clicking Activate will issue tenant isolation credentials and deploy institute admin login credentials.
            </p>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            disabled={currentStep === 1}
            onClick={handlePrev}
            className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{currentStep === 9 ? 'Activate Institution' : 'Next Step'}</span>}
            {!isSubmitting && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizardPage;
