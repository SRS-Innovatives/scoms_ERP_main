import React, { useState, useEffect } from 'react';
import FileUpload from '../../components/common/FileUpload';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { UploadCloud, Download, CheckCircle, FileSpreadsheet, AlertTriangle, XCircle, Layers } from 'lucide-react';
import departmentService from '../../services/departmentService';
import courseService from '../../services/courseService';
import semesterService from '../../services/semesterService';
import sectionService from '../../services/sectionService';
import studentService from '../../services/studentService';

export const BulkAdmissionPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState(null);

  const [classAssignment, setClassAssignment] = useState({ departmentId: '', courseId: '', semesterId: '', sectionId: '' });
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    departmentService.getAll().then((res) => setDepartments(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (classAssignment.departmentId) {
      courseService.getAll(classAssignment.departmentId).then((res) => setCourses(res.data || [])).catch(() => {});
    } else {
      setCourses([]);
    }
  }, [classAssignment.departmentId]);

  useEffect(() => {
    if (classAssignment.courseId) {
      semesterService.getAll(classAssignment.courseId).then((res) => setSemesters(res.data || [])).catch(() => {});
    } else {
      setSemesters([]);
    }
  }, [classAssignment.courseId]);

  useEffect(() => {
    if (classAssignment.semesterId) {
      sectionService.getAll(classAssignment.semesterId).then((res) => setSections(res.data || [])).catch(() => {});
    } else {
      setSections([]);
    }
  }, [classAssignment.semesterId]);

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const res = await studentService.downloadBulkTemplate();
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SCOMS_Bulk_Student_Admission_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      notifyError(`Failed to download template: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!classAssignment.courseId || !classAssignment.sectionId) {
      notifyError('Select Department, Course, Semester and Section — every uploaded student is assigned to this class.');
      return;
    }
    setIsProcessing(true);
    setResult(null);
    try {
      const res = await studentService.bulkUpload(selectedFile, classAssignment);
      setResult(res.data);
      notifySuccess(
        `Bulk admission processed: ${res.data.successCount}/${res.data.total} students admitted successfully!`,
        'Import Complete'
      );
    } catch (error) {
      notifyError(`Bulk import failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bulk Admission Upload (Excel / CSV)</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Import student batches in bulk — every row is admitted directly into the class you select below.</p>
      </div>

      <FormSection title="Download Excel Template" subtitle="Required column schema for batch import" icon={FileSpreadsheet}>
        <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs">
          <div>
            <p className="font-bold text-indigo-900 dark:text-indigo-200">SCOMS_Bulk_Student_Admission_Template.xlsx</p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">First Name, Last Name, Gender, DOB, Blood Group, Email, Phone, Roll Number, Father/Mother Name, Parent Phone/Email, Address, City, State, Pincode</p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors disabled:opacity-50 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Preparing...' : 'Download Sample Excel'}</span>
          </button>
        </div>
      </FormSection>

      <FormSection title="1. Select Target Class" subtitle="Every student in the uploaded file will be assigned to this Department / Course / Semester / Section" icon={Layers}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
            <select
              required
              value={classAssignment.departmentId}
              onChange={(e) => setClassAssignment({ departmentId: e.target.value, courseId: '', semesterId: '', sectionId: '' })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Course *</label>
            <select
              required
              disabled={!classAssignment.departmentId}
              value={classAssignment.courseId}
              onChange={(e) => setClassAssignment({ ...classAssignment, courseId: e.target.value, semesterId: '', sectionId: '' })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium disabled:opacity-50"
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
              disabled={!classAssignment.courseId}
              value={classAssignment.semesterId}
              onChange={(e) => setClassAssignment({ ...classAssignment, semesterId: e.target.value, sectionId: '' })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium disabled:opacity-50"
            >
              <option value="">Select Semester</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Section *</label>
            <select
              required
              disabled={!classAssignment.semesterId}
              value={classAssignment.sectionId}
              onChange={(e) => setClassAssignment({ ...classAssignment, sectionId: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium disabled:opacity-50"
            >
              <option value="">Select Section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection title="2. Upload Prepared Batch File" subtitle="Select your completed CSV or XLSX spreadsheet" icon={UploadCloud}>
        <div className="space-y-4">
          <FileUpload label="Select Excel File (.xlsx, .csv)" accept=".xlsx,.xls,.csv" onFileSelect={setSelectedFile} />
          {selectedFile && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleUpload}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isProcessing ? 'Validating & Importing...' : 'Import Students Batch'}</span>
              </button>
            </div>
          )}
        </div>
      </FormSection>

      {result && (
        <FormSection title="Import Results" subtitle={`${result.successCount} of ${result.total} rows admitted successfully`} icon={CheckCircle}>
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-white">{result.total}</p>
                <p className="text-[10px] text-slate-500">Total Rows</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{result.successCount}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Admitted</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{result.failedCount}</p>
                <p className="text-[10px] text-rose-600 dark:text-rose-400">Failed</p>
              </div>
            </div>

            {result.successCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <p className="font-bold text-amber-800 dark:text-amber-300">Login credentials for these {result.successCount} student(s)</p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Every account above was created with the default password <span className="font-mono font-bold text-slate-900 dark:text-white">Student@123</span> (since bulk upload has no password column). A welcome email is also sent to each student's own address, but if your institution's email isn't configured yet, this is the only place that password is shown — share it with your students directly, and ask them to change it after first login.
                </p>
              </div>
            )}

            {result.failures.length > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Rows that need correction:
                </p>
                <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {result.failures.map((f) => (
                    <div key={f.rowNumber} className="p-2.5 flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Row {f.rowNumber}</span>
                        <span className="text-slate-500"> — {f.name}: </span>
                        <span className="text-rose-600 dark:text-rose-400">{f.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FormSection>
      )}
    </div>
  );
};

export default BulkAdmissionPage;
