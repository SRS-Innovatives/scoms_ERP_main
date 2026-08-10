import React, { useState } from 'react';
import FormInput from '../../components/common/FormInput';
import Select from '../../components/common/Select';
import FileUpload from '../../components/common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { Check, ChevronRight, ChevronLeft, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OnboardingWizardPage = () => {
  const { success } = useNotification();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

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
    name: 'SRS Institute of Technology',
    code: 'ENG-TN-909',
    type: 'Engineering College',
    category: 'College',
    affiliation: 'Anna University',
    email: 'admin@srstech.edu.in',
    phone: '+91 94433 11223',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641001',
    adminName: 'Dr. V. Rajesh',
    adminEmail: 'principal@srstech.edu.in',
    plan: 'Enterprise'
  });

  const handleNext = () => {
    if (currentStep < 9) {
      setCurrentStep(prev => prev + 1);
    } else {
      success(`Institution ${formData.name} successfully onboarded and activated!`, 'Onboarding Complete');
      navigate('/super-admin/institutions');
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
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    isCompleted
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
            <FormInput label="Institution Name" required value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Institution Code" required value={formData.code} onChange={(v) => setFormData({ ...formData, code: v })} />
              <Select label="Category" value={formData.category} onChange={(v) => setFormData({ ...formData, category: v })} options={[{ value: 'School', label: 'School' }, { value: 'College', label: 'College' }, { value: 'University', label: 'University' }]} />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 2: Contact & Address Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Official Email" required value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
              <FormInput label="Official Phone" required value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
              <FormInput label="City" required value={formData.city} onChange={(v) => setFormData({ ...formData, city: v })} />
              <FormInput label="State" required value={formData.state} onChange={(v) => setFormData({ ...formData, state: v })} />
            </div>
          </div>
        )}

        {currentStep >= 3 && currentStep <= 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step {currentStep}: {steps[currentStep - 1]}</h3>
            <p className="text-xs text-slate-500">Configure parameters for {steps[currentStep - 1]}. All validation constraints met.</p>
            <FileUpload label={`Upload ${steps[currentStep - 1]} verification PDF document`} />
          </div>
        )}

        {currentStep === 8 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 8: Final Review & Inspection</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
              <p><span className="font-bold">Institution:</span> {formData.name} ({formData.code})</p>
              <p><span className="font-bold">Category:</span> {formData.category} • Location: {formData.city}, {formData.state}</p>
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
            className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
          >
            <span>{currentStep === 9 ? 'Activate Institution' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizardPage;
