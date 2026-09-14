import React, { useState, useEffect, useRef } from 'react';
import StepperForm from '../../components/common/StepperForm';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import {
  User, IdCard, Users, MapPin, GraduationCap, HeartPulse, Landmark,
  Camera, CheckCircle, ArrowRight, ArrowLeft, Loader2, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../services/api';
import admissionCustomFieldService from '../../services/admissionCustomFieldService';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB

const emptyForm = {
  // 1. Personal & Identity
  firstName: '', lastName: '', gender: 'FEMALE', dob: '', bloodGroup: 'O+',
  religion: '', nationality: 'Indian', motherTongue: '', aadhaarNumber: '',
  category: 'General', subCaste: '', email: '', phone: '', alternatePhone: '',
  // 2. Parent & Guardian
  fatherName: '', fatherOccupation: '', fatherEmail: '',
  motherName: '', motherOccupation: '', motherEmail: '',
  guardianName: '', guardianRelation: '', parentPhone: '', parentEmail: '', annualIncome: '',
  // 3. Contact & Address
  address: '', city: '', state: '', pincode: '', district: '', permanentAddress: '', landmark: '',
  // 4. Academic Admission
  departmentId: '', courseId: '', semesterId: '', sectionId: '', rollNumber: '', registerNumber: '',
  previousSchoolName: '', previousSchoolBoard: '', lastQualificationExam: '', qualifyingScore: '',
  admissionQuota: 'Management', scholarshipType: '', emisId: '',
  // 5. Health & Emergency
  medicalConditions: '', allergies: '', emergencyContactName: '', emergencyContactPhone: '',
  // 6. Bank & Services
  bankAccountNumber: '', bankIfscCode: '', bankName: '',
  transportRequired: false, transport: 'None', hostelRequired: false, hostel: 'Day Scholar',
  // 7. Photo & Credentials
  photo: '', password: '',
  // 8. Additional (institution-defined, SuperAdmin-approved) fields — keyed by fieldKey
  customFields: {},
};

/** A labeled text/select field — defined once here rather than re-typed ~55 times across
 * this form's 7 sections. `as="select"` renders `children` as <option>s instead. */
const Field = ({ label, required, as = 'input', type = 'text', value, onChange, options, mono, ...rest }) => (
  <div>
    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
      {label}{required && ' *'}
    </label>
    {as === 'select' ? (
      <select
        required={required}
        value={value}
        onChange={onChange}
        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
        {...rest}
      >
        {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    ) : as === 'textarea' ? (
      <textarea
        required={required}
        rows={2}
        value={value}
        onChange={onChange}
        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
        {...rest}
      />
    ) : (
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium ${mono ? 'font-mono' : ''}`}
        {...rest}
      />
    )}
  </div>
);

export const StudentAdmissionPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(emptyForm);
  const set = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));
  const setBool = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.checked }));

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const setCustomField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, customFields: { ...prev.customFields, [key]: value } }));
  };

  useEffect(() => {
    admissionCustomFieldService.getApproved().then((res) => setCustomFieldDefs(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchDepartments(); }, []);
  useEffect(() => {
    if (formData.departmentId) fetchCourses(formData.departmentId);
    else setCourses([]);
  }, [formData.departmentId]);
  useEffect(() => {
    if (formData.courseId) fetchSemesters(formData.courseId);
    else setSemesters([]);
  }, [formData.courseId]);
  useEffect(() => {
    if (formData.semesterId) fetchSections(formData.semesterId);
    else setSections([]);
  }, [formData.semesterId]);

  const fetchDepartments = async () => {
    try { setDepartments((await apiCall('/setup/departments')).data); } catch (err) { console.error(err); }
  };
  const fetchCourses = async (deptId) => {
    try { setCourses((await apiCall('/setup/courses')).data.filter((c) => c.departmentId === deptId)); } catch (err) { console.error(err); }
  };
  const fetchSemesters = async (courseId) => {
    try { setSemesters((await apiCall(`/setup/semesters?courseId=${courseId}`)).data); } catch (err) { console.error(err); }
  };
  const fetchSections = async (semesterId) => {
    try { setSections((await apiCall(`/setup/sections?semesterId=${semesterId}`)).data); } catch (err) { console.error(err); }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      notifyError('Student photo must be a PNG or JPEG image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      notifyError('Photo must be 2MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFormData((prev) => ({ ...prev, photo: reader.result }));
    reader.onerror = () => notifyError('Failed to read the selected file.');
    reader.readAsDataURL(file);
  };

  const steps = [
    { label: 'Personal & Identity' },
    { label: 'Parent & Guardian' },
    { label: 'Contact & Address' },
    { label: 'Academic Admission' },
    { label: 'Health & Emergency' },
    { label: 'Bank & Services' },
    { label: 'Photo & Login' },
    ...(customFieldDefs.length > 0 ? [{ label: 'Additional Info' }] : []),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiCall('/students/admission', { method: 'POST', body: formData });
      notifySuccess(`Admission created successfully for ${formData.firstName} ${formData.lastName}!`, 'Admission Created');
      navigate('/admin/student/list');
    } catch (error) {
      notifyError(`Failed to create admission: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Student Admission Form</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Complete 7-step student registration capturing every detail the institution needs on record</p>
      </div>

      <StepperForm steps={steps} currentStep={currentStep} />

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal & Identity */}
        {currentStep === 1 && (
          <FormSection title="1. Personal & Identity Information" subtitle="Basic demographics & government ID details" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <Field label="First Name" required value={formData.firstName} onChange={set('firstName')} placeholder="e.g. Kavitha" />
              <Field label="Last Name" required value={formData.lastName} onChange={set('lastName')} placeholder="e.g. R. Sharma" />
              <Field label="Gender" as="select" required value={formData.gender} onChange={set('gender')} options={[{ value: 'FEMALE', label: 'Female' }, { value: 'MALE', label: 'Male' }, { value: 'OTHER', label: 'Other' }]} />
              <Field label="Date of Birth" type="date" required value={formData.dob} onChange={set('dob')} />
              <Field label="Blood Group" as="select" value={formData.bloodGroup} onChange={set('bloodGroup')} options={['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']} />
              <Field label="Nationality" value={formData.nationality} onChange={set('nationality')} />
              <Field label="Religion" value={formData.religion} onChange={set('religion')} placeholder="e.g. Hindu / Muslim / Christian" />
              <Field label="Mother Tongue" value={formData.motherTongue} onChange={set('motherTongue')} placeholder="e.g. Tamil" />
              <Field label="Community / Caste Category" as="select" value={formData.category} onChange={set('category')} options={['General', 'BC (OBC)', 'MBC / DNC', 'SC', 'ST', 'BC (Muslim)']} />
              <Field label="Sub-Caste" value={formData.subCaste} onChange={set('subCaste')} />
              <Field label="Aadhaar Card Number" mono value={formData.aadhaarNumber} onChange={set('aadhaarNumber')} placeholder="xxxx-xxxx-xxxx" />
              <Field label="Student Email Address" type="email" value={formData.email} onChange={set('email')} placeholder="student@example.com" />
              <Field label="Student Contact Mobile" value={formData.phone} onChange={set('phone')} placeholder="+91 98400 12345" />
              <Field label="Alternate Contact Number" value={formData.alternatePhone} onChange={set('alternatePhone')} />
            </div>
          </FormSection>
        )}

        {/* Step 2: Parent & Guardian */}
        {currentStep === 2 && (
          <FormSection title="2. Parent & Guardian Details" subtitle="Contact & background info for communication and eligibility" icon={Users}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <Field label="Father's Name" required value={formData.fatherName} onChange={set('fatherName')} />
              <Field label="Father's Occupation" value={formData.fatherOccupation} onChange={set('fatherOccupation')} />
              <Field label="Father's Email" type="email" value={formData.fatherEmail} onChange={set('fatherEmail')} />
              <Field label="Mother's Name" value={formData.motherName} onChange={set('motherName')} />
              <Field label="Mother's Occupation" value={formData.motherOccupation} onChange={set('motherOccupation')} />
              <Field label="Mother's Email" type="email" value={formData.motherEmail} onChange={set('motherEmail')} />
              <Field label="Guardian's Name (if applicable)" value={formData.guardianName} onChange={set('guardianName')} />
              <Field label="Guardian's Relation to Student" value={formData.guardianRelation} onChange={set('guardianRelation')} placeholder="e.g. Uncle, Elder Sibling" />
              <Field label="Parent/Guardian Login Email" type="email" value={formData.parentEmail} onChange={set('parentEmail')} placeholder="Used to create the parent portal login" />
              <Field label="Parent Contact Number (for SMS)" required value={formData.parentPhone} onChange={set('parentPhone')} placeholder="+91 94440 00000" />
              <Field label="Annual Family Income (INR)" value={formData.annualIncome} onChange={set('annualIncome')} placeholder="e.g. 2,50,000" />
            </div>
          </FormSection>
        )}

        {/* Step 3: Contact & Address */}
        {currentStep === 3 && (
          <FormSection title="3. Contact & Address" subtitle="Residential and permanent address details" icon={MapPin}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-3">
                <Field label="Residential Address" as="textarea" required value={formData.address} onChange={set('address')} />
              </div>
              <Field label="City" required value={formData.city} onChange={set('city')} />
              <Field label="State" required value={formData.state} onChange={set('state')} />
              <Field label="District" value={formData.district} onChange={set('district')} />
              <Field label="Pincode" mono required value={formData.pincode} onChange={set('pincode')} />
              <Field label="Landmark" value={formData.landmark} onChange={set('landmark')} />
              <div className="md:col-span-3">
                <Field label="Permanent Address (only if different from residential)" as="textarea" value={formData.permanentAddress} onChange={set('permanentAddress')} />
              </div>
            </div>
          </FormSection>
        )}

        {/* Step 4: Academic Admission */}
        {currentStep === 4 && (
          <FormSection title="4. Academic Admission & Previous School" subtitle="Choice of branch, class placement, and prior academic record" icon={GraduationCap}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
                <select required value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, courseId: '', semesterId: '', sectionId: '' })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium">
                  <option value="">Select Department</option>
                  {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Course / Degree Program *</label>
                <select required disabled={!formData.departmentId} value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value, semesterId: '', sectionId: '' })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium">
                  <option value="">Select Course</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester *</label>
                <select required disabled={!formData.courseId} value={formData.semesterId} onChange={(e) => setFormData({ ...formData, semesterId: e.target.value, sectionId: '' })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium">
                  <option value="">Select Semester</option>
                  {semesters.map((sem) => <option key={sem.id} value={sem.id}>{sem.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Section *</label>
                <select required disabled={!formData.semesterId} value={formData.sectionId} onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium">
                  <option value="">Select Section</option>
                  {sections.map((sec) => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                </select>
              </div>

              <Field label="Roll Number" value={formData.rollNumber} onChange={set('rollNumber')} />
              <Field label="Register Number" mono value={formData.registerNumber} onChange={set('registerNumber')} />
              <Field label="Admission Quota" as="select" value={formData.admissionQuota} onChange={set('admissionQuota')} options={['Management', 'Government', 'NRI', 'Sports', 'Management Merit']} />
              <Field label="Scholarship Type" as="select" value={formData.scholarshipType} onChange={set('scholarshipType')} options={['', 'First Generation Graduate (FGG)', '7.5% Govt School Quota', 'Post Matric Scholarship (PMS)', 'Institutional Merit Waiver']} />
              <Field label="Previous School / Junior College" value={formData.previousSchoolName} onChange={set('previousSchoolName')} />
              <Field label="Previous School Board" value={formData.previousSchoolBoard} onChange={set('previousSchoolBoard')} placeholder="e.g. CBSE / State Board / ICSE" />
              <Field label="Last Qualifying Exam" value={formData.lastQualificationExam} onChange={set('lastQualificationExam')} placeholder="e.g. 10th SSLC / 12th HSC" />
              <Field label="Qualifying Score" mono value={formData.qualifyingScore} onChange={set('qualifyingScore')} placeholder="e.g. 480/500 or 92%" />
              <Field label="State Student UID (EMIS ID)" mono value={formData.emisId} onChange={set('emisId')} />
            </div>
          </FormSection>
        )}

        {/* Step 5: Health & Emergency */}
        {currentStep === 5 && (
          <FormSection title="5. Health & Emergency Contact" subtitle="Medical information & who to reach in an emergency" icon={HeartPulse}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <Field label="Known Medical Conditions" as="textarea" value={formData.medicalConditions} onChange={set('medicalConditions')} placeholder="e.g. Asthma, Diabetes — leave blank if none" />
              <Field label="Known Allergies" as="textarea" value={formData.allergies} onChange={set('allergies')} placeholder="e.g. Peanuts, Penicillin — leave blank if none" />
              <Field label="Emergency Contact Name" value={formData.emergencyContactName} onChange={set('emergencyContactName')} />
              <Field label="Emergency Contact Phone" value={formData.emergencyContactPhone} onChange={set('emergencyContactPhone')} />
            </div>
          </FormSection>
        )}

        {/* Step 6: Bank & Services */}
        {currentStep === 6 && (
          <FormSection title="6. Bank Details & Campus Services" subtitle="Scholarship/refund disbursal account, transport & hostel" icon={Landmark}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
              <Field label="Bank Account Number" mono value={formData.bankAccountNumber} onChange={set('bankAccountNumber')} />
              <Field label="Bank IFSC Code" mono value={formData.bankIfscCode} onChange={set('bankIfscCode')} />
              <Field label="Bank Name & Branch" value={formData.bankName} onChange={set('bankName')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <Field label="Transport Facility" as="select" value={formData.transport} onChange={set('transport')} options={['None', 'Bus Route 04 (Velachery)', 'Bus Route 12 (Anna Nagar)']} />
                <label className="flex items-center gap-2 mt-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <input type="checkbox" checked={formData.transportRequired} onChange={setBool('transportRequired')} className="w-3.5 h-3.5 rounded accent-indigo-600" />
                  Student requires campus transport
                </label>
              </div>
              <div>
                <Field label="Hostel Accommodation" as="select" value={formData.hostel} onChange={set('hostel')} options={['Day Scholar', 'Bhavani Boys Hostel', 'Kaveri Girls Hostel']} />
                <label className="flex items-center gap-2 mt-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <input type="checkbox" checked={formData.hostelRequired} onChange={setBool('hostelRequired')} className="w-3.5 h-3.5 rounded accent-indigo-600" />
                  Student requires hostel accommodation
                </label>
              </div>
            </div>
          </FormSection>
        )}

        {/* Step 7: Photo & Login */}
        {currentStep === 7 && (
          <FormSection title="7. Student Photo & Login Credentials" subtitle="Passport photo and the password for the student's portal account" icon={IdCard}>
            <div className="flex items-start gap-5 mb-6">
              <div className="relative shrink-0">
                {formData.photo ? (
                  <img src={formData.photo} alt="Student" className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-500" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                    <User className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md"
                  title="Upload photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                {formData.photo && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, photo: '' }))}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handlePhotoSelect} className="hidden" />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Passport Size Photograph</p>
                <p>PNG or JPEG, up to 2MB. This photo shows on the student's profile, ID card, and reports.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <Field label="Student Portal Password" type="password" value={formData.password} onChange={set('password')} placeholder="Leave blank to use the default: Student@123" />
            </div>
          </FormSection>
        )}

        {/* Step 8: Additional Information — institution-defined, SuperAdmin-approved fields only */}
        {currentStep === 8 && customFieldDefs.length > 0 && (
          <FormSection title="8. Additional Information" subtitle="Extra fields your institution added, approved by SCOMS" icon={IdCard}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {customFieldDefs.map((f) => (
                f.fieldType === 'SELECT' ? (
                  <Field key={f.fieldKey} label={f.label} required={f.required} as="select" value={formData.customFields[f.fieldKey] || ''} onChange={setCustomField(f.fieldKey)} options={f.options || []} />
                ) : f.fieldType === 'TEXTAREA' ? (
                  <div key={f.fieldKey} className="md:col-span-3">
                    <Field label={f.label} required={f.required} as="textarea" value={formData.customFields[f.fieldKey] || ''} onChange={setCustomField(f.fieldKey)} />
                  </div>
                ) : f.fieldType === 'CHECKBOX' ? (
                  <label key={f.fieldKey} className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 pt-6">
                    <input type="checkbox" checked={!!formData.customFields[f.fieldKey]} onChange={setCustomField(f.fieldKey)} className="w-4 h-4 rounded text-indigo-600" />
                    {f.label}{f.required && ' *'}
                  </label>
                ) : (
                  <Field
                    key={f.fieldKey}
                    label={f.label}
                    required={f.required}
                    type={{ NUMBER: 'number', DATE: 'date', EMAIL: 'email', PHONE: 'tel' }[f.fieldType] || 'text'}
                    value={formData.customFields[f.fieldKey] || ''}
                    onChange={setCustomField(f.fieldKey)}
                  />
                )
              ))}
            </div>
          </FormSection>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          {currentStep > 1 ? (
            <button type="button" onClick={() => setCurrentStep((prev) => prev - 1)} className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          {currentStep < steps.length ? (
            <button type="button" onClick={() => setCurrentStep((prev) => prev + 1)} className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all">
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg transition-all disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>{submitting ? 'Submitting...' : 'Complete Admission'}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default StudentAdmissionPage;
