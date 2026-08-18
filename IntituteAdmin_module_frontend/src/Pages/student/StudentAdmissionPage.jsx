import React, { useState, useEffect } from 'react';
import StepperForm from '../../components/common/StepperForm';
import FormSection from '../../components/common/FormSection';
import FileUpload from '../../components/common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { User, Users, MapPin, GraduationCap, Bus, Home, Save, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../services/api';

export const StudentAdmissionPage = () => {
  const { notifySuccess } = useNotification();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    gender: 'Female',
    dob: '',
    bloodGroup: 'O+',
    aadhaarNo: '',
    casteCommunity: 'BC (OBC)',
    scholarship: 'None',
    email: '',
    phone: '',

    fatherName: '',
    fatherOcc: '',
    motherName: '',
    parentPhone: '',
    annualIncome: '',

    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600017',

    departmentId: '',
    courseId: '',
    semesterId: '',
    sectionId: '',
    
    previousSchool: '',
    cutoffMarks: '',
    rollNumber: '',
    password: '',

    transport: 'None',
    hostel: 'Day Scholar',
    photo: null
  });

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

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
    try {
      const res = await apiCall('/setup/departments');
      setDepartments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCourses = async (deptId) => {
    try {
      const res = await apiCall('/setup/courses');
      // For now, client side filter (can also be done server side with ?departmentId)
      setCourses(res.data.filter(c => c.departmentId === deptId));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSemesters = async (courseId) => {
    try {
      const res = await apiCall(`/setup/semesters?courseId=${courseId}`);
      setSemesters(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSections = async (semesterId) => {
    try {
      const res = await apiCall(`/setup/sections?semesterId=${semesterId}`);
      setSections(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const steps = [
    { label: 'Personal Info' },
    { label: 'Parent Details' },
    { label: 'Academic & Course' },
    { label: 'Services & Photo' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiCall('/students/admission', {
        method: 'POST',
        body: formData
      });
      notifySuccess(`Admission created successfully for ${formData.name || 'New Student'}!`, 'Admission Created');
      navigate('/admin/student/list');
    } catch (error) {
      notifySuccess(`Failed to create admission: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Student Admission Form</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Complete multi-step student registration adhering to Indian institutional standards</p>
      </div>

      <StepperForm steps={steps} currentStep={currentStep} />

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Details */}
        {currentStep === 1 && (
          <FormSection title="1. Personal Information" subtitle="Basic student demographics & government ID details" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kavitha R. Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Aadhaar Card Number *</label>
                <input
                  type="text"
                  required
                  placeholder="xxxx-xxxx-xxxx"
                  value={formData.aadhaarNo}
                  onChange={(e) => setFormData({ ...formData, aadhaarNo: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Community / Caste Category *</label>
                <select
                  value={formData.casteCommunity}
                  onChange={(e) => setFormData({ ...formData, casteCommunity: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="BC (OBC)">BC (OBC)</option>
                  <option value="MBC / DNC">MBC / DNC</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                  <option value="OC / General">OC / General</option>
                  <option value="BC (Muslim)">BC (Muslim)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Scholarship Eligible Option</label>
                <select
                  value={formData.scholarship}
                  onChange={(e) => setFormData({ ...formData, scholarship: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="None">None / Regular Fee</option>
                  <option value="First Generation Graduate (Govt of TN)">First Generation Graduate (FGG)</option>
                  <option value="7.5% Govt School Quota">7.5% Govt School Quota</option>
                  <option value="Post Matric Scholarship (PMS)">Post Matric Scholarship (PMS)</option>
                  <option value="Institutional Merit Waiver">Institutional Merit Waiver</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student Contact Mobile</label>
                <input
                  type="text"
                  placeholder="+91 98400 12345"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student Email Address</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Step 2: Parent Details */}
        {currentStep === 2 && (
          <FormSection title="2. Parent & Address Details" subtitle="Guardian info for emergency & communication" icon={Users}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Father's Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Father's Occupation</label>
                <input
                  type="text"
                  value={formData.fatherOcc}
                  onChange={(e) => setFormData({ ...formData, fatherOcc: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mother's Name</label>
                <input
                  type="text"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Parent Contact Number (For SMS) *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 94440 00000"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Annual Family Income (INR)</label>
                <input
                  type="text"
                  placeholder="e.g. 2,50,000"
                  value={formData.annualIncome}
                  onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Residential Address *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Step 3: Academic & Course */}
        {currentStep === 3 && (
          <FormSection title="3. Academic Admission & Previous School" subtitle="Choice of branch & HSC cutoff score" icon={GraduationCap}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, courseId: '', semesterId: '', sectionId: '' })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Course / Degree Program *</label>
                <select
                  required
                  disabled={!formData.departmentId}
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value, semesterId: '', sectionId: '' })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester *</label>
                <select
                  required
                  disabled={!formData.courseId}
                  value={formData.semesterId}
                  onChange={(e) => setFormData({ ...formData, semesterId: e.target.value, sectionId: '' })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">Select Semester</option>
                  {semesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>{sem.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Section *</label>
                <select
                  required
                  disabled={!formData.semesterId}
                  value={formData.sectionId}
                  onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">Select Section</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Previous School / Junior College</label>
                <input
                  type="text"
                  value={formData.previousSchool}
                  onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">12th Standard / HSC Cutoff Score</label>
                <input
                  type="text"
                  placeholder="e.g. 192.50 / 200"
                  value={formData.cutoffMarks}
                  onChange={(e) => setFormData({ ...formData, cutoffMarks: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-medium"
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Step 4: Services & Photo */}
        {currentStep === 4 && (
          <FormSection title="4. Transport, Hostel & Documents" subtitle="Avail campus bus, hostel accommodation and upload student photo" icon={Bus}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transport Facility</label>
                <select
                  value={formData.transport}
                  onChange={(e) => setFormData({ ...formData, transport: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="None">None / Self Transport</option>
                  <option value="Bus Route 04 (Velachery)">Bus Route 04 (Velachery Corridor - Rs 24,000/yr)</option>
                  <option value="Bus Route 12 (Anna Nagar)">Bus Route 12 (Anna Nagar Corridor - Rs 26,000/yr)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hostel Accommodation</label>
                <select
                  value={formData.hostel}
                  onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="Day Scholar">Day Scholar</option>
                  <option value="Bhavani Boys Hostel">Bhavani Boys Hostel (Rs 65,000/yr)</option>
                  <option value="Kaveri Girls Hostel">Kaveri Girls Hostel (Rs 65,000/yr)</option>
                </select>
              </div>
            </div>

            <FileUpload label="Upload Passport Size Student Photograph" accept=".jpg,.jpeg,.png" />
          </FormSection>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Admission</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default StudentAdmissionPage;
