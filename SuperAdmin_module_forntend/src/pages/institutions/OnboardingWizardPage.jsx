import React, { useState, useEffect } from 'react';
import FormInput from '../../components/common/FormInput';
import Select from '../../components/common/Select';
import FileUpload from '../../components/common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { Check, ChevronRight, ChevronLeft, Building2, CheckCircle2, ShieldCheck, Loader2, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import institutionService from '../../services/institutionService';

const TYPE_OPTIONS = [
  { value: 'SCHOOL', label: 'School' },
  { value: 'COLLEGE', label: 'College' },
  { value: 'AUTONOMOUS_COLLEGE', label: 'Autonomous College' },
  { value: 'UNIVERSITY', label: 'University' },
];

export const OnboardingWizardPage = () => {
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moduleCatalog, setModuleCatalog] = useState([]);
  const [modulesTouched, setModulesTouched] = useState(false); // once the admin manually edits the checklist, stop auto-recommending on type change
  const [universities, setUniversities] = useState([]);

  useEffect(() => {
    institutionService.getModuleCatalog()
      .then((res) => setModuleCatalog(res.data || []))
      .catch((err) => console.error('Failed to load module catalog', err));
    // Real universities already onboarded in SCOMS — offered as an affiliation target for
    // a College/Autonomous College, so the relationship is a real link, not a text label.
    institutionService.getInstitutions({ type: 'UNIVERSITY', limit: 200 })
      .then((res) => setUniversities(res.data || []))
      .catch((err) => console.error('Failed to load universities', err));
  }, []);

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
    affiliatedUniversityId: '',
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
    modules: [],
    logo: ''
  });

  const recommendedKeys = moduleCatalog.filter((m) => m.recommendedFor?.includes(formData.type)).map((m) => m.key);

  // Pre-check the sensible defaults for whichever type is picked — every module stays a
  // free checkbox either way, this just saves re-ticking the same ~10 boxes every time.
  useEffect(() => {
    if (modulesTouched || !formData.type || moduleCatalog.length === 0) return;
    setFormData((prev) => ({ ...prev, modules: recommendedKeys }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type, moduleCatalog]);

  const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB — plenty for a logo, keeps the data URI light

  const handleLogoSelect = (file) => {
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      showError('Logo must be 2MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFormData((prev) => ({ ...prev, logo: reader.result }));
    reader.onerror = () => showError('Failed to read the selected logo file.');
    reader.readAsDataURL(file);
  };

  // Only the fields genuinely needed to create a working tenant + a login for it are
  // required — everything else (contact/address/affiliation/plan/documents) can be filled
  // in later via Institute Profile. Real gating, not just a decorative asterisk.
  const STEP_REQUIREMENTS = {
    1: [['name', 'Institution Name'], ['code', 'Institution Code']],
    4: [['adminName', 'Admin Full Name'], ['adminEmail', 'Admin Official Email'], ['adminPassword', 'Temporary Password']],
  };

  const getMissingFields = (step) => (STEP_REQUIREMENTS[step] || []).filter(([field]) => !String(formData[field] || '').trim());

  const handleNext = async () => {
    const missing = getMissingFields(currentStep);
    if (missing.length > 0) {
      showError(`Please fill in: ${missing.map(([, label]) => label).join(', ')}`, 'Required Fields Missing');
      return;
    }

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
            <p className="text-[11px] text-slate-400 -mt-2">Only Institution Name and Code are required here — everything else can be added later from Institute Profile.</p>
            <FormInput label="Institution Name" required value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} placeholder="Enter institution name" />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Institution Code" required value={formData.code} onChange={(v) => setFormData({ ...formData, code: v })} placeholder="Enter institution code" />
              <Select label="Institution Type" value={formData.type} onChange={(v) => setFormData({ ...formData, type: v, affiliatedUniversityId: '' })} options={TYPE_OPTIONS} />
            </div>

            {(formData.type === 'COLLEGE' || formData.type === 'AUTONOMOUS_COLLEGE') && (
              <div>
                <Select
                  label="Affiliated University (optional)"
                  value={formData.affiliatedUniversityId}
                  onChange={(v) => setFormData({ ...formData, affiliatedUniversityId: v })}
                  options={[{ value: '', label: universities.length ? 'Select a university...' : 'No universities onboarded yet' }, ...universities.map((u) => ({ value: u.id, label: u.name }))]}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {formData.type === 'AUTONOMOUS_COLLEGE'
                    ? 'An autonomous college sets and evaluates its own exams and confers its own degree — this link is for record-keeping only.'
                    : "Only universities already onboarded in SCOMS appear here — this creates a real link so the university can see this college and, later, act as its exam/degree authority. Not the same as the free-text “Affiliation” field below."}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Institution Logo</label>
              <p className="text-[11px] text-slate-400 mb-2">
                Shown across the whole platform for this institution — staff/student portal branding, ID cards, certificates, and the left header of every generated report.
              </p>
              {formData.logo ? (
                <div className="flex items-center gap-3 p-3 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                  <img src={formData.logo} alt="Institution logo preview" className="w-14 h-14 rounded-lg object-cover border border-white shadow-sm shrink-0" />
                  <div className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300">Logo selected</div>
                  <button onClick={() => setFormData((prev) => ({ ...prev, logo: '' }))} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              ) : (
                <FileUpload label="" accept=".png,.jpg,.jpeg" onFileSelect={handleLogoSelect} />
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 2: Contact & Address Information</h3>
            <p className="text-[11px] text-slate-400 -mt-2">Optional — skip and fill in later if not on hand yet.</p>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Official Email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} placeholder="Enter official email" />
              <FormInput label="Official Phone" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} placeholder="Enter official phone" />
              <FormInput label="Street Address" value={formData.address} onChange={(v) => setFormData({ ...formData, address: v })} placeholder="Enter street address" />
              <FormInput label="City" value={formData.city} onChange={(v) => setFormData({ ...formData, city: v })} placeholder="Enter city" />
              <FormInput label="State" value={formData.state} onChange={(v) => setFormData({ ...formData, state: v })} placeholder="Enter state" />
              <FormInput label="Pincode" value={formData.pincode} onChange={(v) => setFormData({ ...formData, pincode: v })} placeholder="Enter pincode" />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 3: Academic Info</h3>
            <p className="text-[11px] text-slate-400 -mt-2">Optional — skip and fill in later if not on hand yet.</p>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Affiliation / University" value={formData.affiliation} onChange={(v) => setFormData({ ...formData, affiliation: v })} placeholder="Enter affiliation / university" />
              <FormInput label="Establishment Year" value={formData.establishmentYear} onChange={(v) => setFormData({ ...formData, establishmentYear: v })} placeholder="Enter establishment year" />
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
            <p className="text-xs text-slate-500">
              Every module here is optional — nothing is forced on. {formData.type ? <>Boxes marked <span className="font-semibold text-indigo-600 dark:text-indigo-400">Recommended</span> are pre-checked for a {TYPE_OPTIONS.find(t => t.value === formData.type)?.label || formData.type}, but toggle anything freely.</> : 'Pick an Institution Type in Step 1 to see recommended defaults.'}
              {' '}Core modules (Dashboard, Setup, Settings) are always included.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {moduleCatalog.map((mod) => {
                const isRecommended = recommendedKeys.includes(mod.key);
                return (
                  <label key={mod.key} className={`flex items-start gap-2 p-2.5 rounded-lg border text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${isRecommended ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-700'}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={formData.modules?.includes(mod.key)}
                      onChange={(e) => {
                        setModulesTouched(true);
                        const newModules = e.target.checked
                          ? [...(formData.modules || []), mod.key]
                          : (formData.modules || []).filter((m) => m !== mod.key);
                        setFormData({ ...formData, modules: newModules });
                      }}
                    />
                    <span>
                      <span className="font-semibold flex items-center gap-1.5">
                        {mod.label}
                        {isRecommended && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            <Sparkles className="w-2.5 h-2.5" /> Recommended
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400">{mod.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 7: Documents</h3>
            <p className="text-xs text-slate-500">Optional — registration and tax documents can be attached now or added later from Institute Profile.</p>
            <FileUpload label="Registration Certificate (PDF)" />
            <FileUpload label="Tax Registration / GST (PDF)" />
          </div>
        )}

        {currentStep === 8 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 8: Final Review & Inspection</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] text-slate-500">No logo</div>
                )}
                <p><span className="font-bold">Institution:</span> {formData.name} ({formData.code})</p>
              </div>
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
