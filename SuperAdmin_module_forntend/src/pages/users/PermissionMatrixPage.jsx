import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { Check, X, Save, ShieldAlert, Loader2, Info } from 'lucide-react';
import userService from '../../services/userService';

const systemRolesList = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'PLATFORM_ADMIN', label: 'Platform Admin' },
  { value: 'INSTITUTE_ADMIN', label: 'Institute Admin' },
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'HOD', label: 'Head of Department (HOD)' },
  { value: 'TEACHER', label: 'Teacher / Instructor' },
  { value: 'STAFF', label: 'Non-Teaching Staff' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'LIBRARIAN', label: 'Librarian' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'PARENT', label: 'Parent / Guardian' }
];

const permissionSchema = [
  {
    category: "Institutions & Platform Settings",
    permissions: [
      { key: "institutions.view", label: "View Institutions", desc: "List and view onboarded tenant records." },
      { key: "institutions.create", label: "Create / Onboard", desc: "Provision new tenant instances." },
      { key: "institutions.update", label: "Update Settings", desc: "Modify master config and metadata." },
      { key: "institutions.delete", label: "Soft Delete", desc: "Suspend or archive tenant workspaces." },
      { key: "institutions.manage_modules", label: "Authorize Modules", desc: "Map and override premium features." }
    ]
  },
  {
    category: "Users & Access Security",
    permissions: [
      { key: "users.view", label: "View Users Directory", desc: "List multi-tenant accounts list." },
      { key: "users.create", label: "Create Operator", desc: "Provision new platform operators." },
      { key: "users.update", label: "Modify Operator Status", desc: "Change roles and operational status." },
      { key: "users.delete", label: "Delete Operator", desc: "Revoke login credentials permanently." }
    ]
  },
  {
    category: "Academics & Structure",
    permissions: [
      { key: "academics.view", label: "View Academic Years", desc: "Inspect semesters, terms, and classes." },
      { key: "academics.manage", label: "Manage Course Setup", desc: "Configure course durations and departments." }
    ]
  },
  {
    category: "Students Master",
    permissions: [
      { key: "students.view", label: "View Students Directory", desc: "List profiles and roll registers." },
      { key: "students.create", label: "Register Student", desc: "Create new student profiles." },
      { key: "students.update", label: "Update Profiles", desc: "Edit personal and academic logs." },
      { key: "students.delete", label: "Archive Student", desc: "Mark student accounts as inactive/left." },
      { key: "students.promote", label: "Batch Promotion", desc: "Promote batches to subsequent semesters." }
    ]
  },
  {
    category: "Staff Master",
    permissions: [
      { key: "staff.view", label: "View Faculty List", desc: "Inspect teacher profiles and records." },
      { key: "staff.create", label: "Register Faculty", desc: "Add new teaching/admin personnel." },
      { key: "staff.update", label: "Update Faculty Profile", desc: "Edit designations, roles, and joining dates." },
      { key: "staff.delete", label: "Archive Staff Profile", desc: "Terminate faculty profiles from directory." }
    ]
  },
  {
    category: "Classroom Attendance",
    permissions: [
      { key: "attendance.view", label: "View Attendance Records", desc: "View reports and analytics." },
      { key: "attendance.mark", label: "Mark Classroom Attendance", desc: "Submit daily attendance logs." },
      { key: "attendance.update", label: "Override Logs", desc: "Edit retroactively marked logs." }
    ]
  },
  {
    category: "Leaves & Timetables",
    permissions: [
      { key: "leave.view", label: "View Leave Applications", desc: "Inspect applied student and staff leaves." },
      { key: "leave.apply", label: "Submit Leave Requests", desc: "Apply for sick or casual leaves." },
      { key: "leave.approve", label: "Approve Leaves", desc: "Sanction submitted leave applications." },
      { key: "timetable.view", label: "View Timetable Grid", desc: "Inspect weekly class timetables." },
      { key: "timetable.manage", label: "Configure Timetable", desc: "Assign teachers, subjects, and periods." }
    ]
  },
  {
    category: "Assignments & Materials",
    permissions: [
      { key: "assignments.view", label: "View Assignments List", desc: "Inspect homework timelines." },
      { key: "assignments.create", label: "Publish Homework", desc: "Post new assignments with due dates." },
      { key: "assignments.submit", label: "Upload Submissions", desc: "Submit assignment files as a student." },
      { key: "assignments.grade", label: "Grade Homework", desc: "Mark and review student file submissions." },
      { key: "materials.view", label: "Access Study Materials", desc: "Download lecture notes and files." },
      { key: "materials.upload", label: "Upload Resources", desc: "Publish lecture PDFs and videos." }
    ]
  },
  {
    category: "Examinations & Marks",
    permissions: [
      { key: "exams.view", label: "View Exam Timetables", desc: "Inspect scheduled test dates." },
      { key: "exams.create", label: "Configure Exams", desc: "Create unit tests and term examinations." },
      { key: "marks.enter", label: "Enter Subject Marks", desc: "Key in score values for class students." },
      { key: "results.publish", label: "Publish Grade Reports", desc: "Release exam marks to parents/students." },
      { key: "results.view", label: "View Gradebook Reports", desc: "Analyze student performance charts." }
    ]
  },
  {
    category: "Question Papers Bank",
    permissions: [
      { key: "questions.view", label: "View Question Bank", desc: "Browse subject questions directories." },
      { key: "questions.create", label: "Add Question Items", desc: "Input questions with difficulty ratings." },
      { key: "questions.generate_paper", label: "Generate Test Papers", desc: "Auto-assemble tests using AI template." }
    ]
  },
  {
    category: "Fees & Payment Gateways",
    permissions: [
      { key: "fees.view", label: "View Fees Statements", desc: "Inspect invoices and pay history." },
      { key: "fees.setup", label: "Configure Fees Structures", desc: "Setup tuition, transport, or hostel fees." },
      { key: "fees.collect", label: "Record Offline Fees", desc: "Accept cash/UPI and issue receipts." },
      { key: "fees.refund", label: "Record Fee Refund", desc: "Void payments and issue refunds." },
      { key: "payments.online", label: "Online Fees Gateway", desc: "Pay invoices via Razorpay/Stripe." }
    ]
  },
  {
    category: "Campus Add-ons",
    permissions: [
      { key: "library.manage", label: "Librarian Controls", desc: "Borrow/return logs and fine setup." },
      { key: "transport.manage", label: "Fleet & Routes", desc: "Map buses, drivers, and transport fees." },
      { key: "hostel.manage", label: "Dorm Allocations", desc: "Manage hostel rooms and bed listings." },
      { key: "certificates.generate", label: "Generate Credentials", desc: "Issue TC, bonafide, and ID Cards." }
    ]
  },
  {
    category: "Communication Desk",
    permissions: [
      { key: "announcements.create", label: "Create Announcements", desc: "Broadcast banner messages to portal." },
      { key: "notifications.send", label: "Send Alerts", desc: "Dispatch SMS, WhatsApp, and Emails." },
      { key: "grievances.submit", label: "File Grievances", desc: "File support and feedback reports." },
      { key: "grievances.resolve", label: "Resolve Grievances", desc: "Review complaints and issue responses." }
    ]
  },
  {
    category: "AI, Analytics & Audits",
    permissions: [
      { key: "ai.access", label: "AI Copilot Integration", desc: "Use generative helpers and grading bots." },
      { key: "analytics.view", label: "Platform Analytics", desc: "Inspect usage graphs and charts." },
      { key: "reports.view", label: "Custom PDF Reports", desc: "Export academic and business reports." },
      { key: "audit_logs.view", label: "View Audit Ledgers", desc: "Track administrative logs trail." }
    ]
  }
];

export const PermissionMatrixPage = () => {
  const { success, error: showError, warning } = useNotification();
  const [selectedRole, setSelectedRole] = useState('SUPER_ADMIN');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modified, setModified] = useState(false);

  useEffect(() => {
    fetchPermissions(selectedRole);
  }, [selectedRole]);

  const fetchPermissions = async (role) => {
    try {
      setLoading(true);
      const res = await userService.getRolePermissions(role);
      if (res?.data) {
        setPermissions(res.data);
        setModified(false);
      }
    } catch (err) {
      console.error("Failed to load permissions", err);
      showError("Could not retrieve permissions matrix for this role.", "Fetch Error");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePerm = (permKey) => {
    // Super admin permissions are locked
    if (selectedRole === 'SUPER_ADMIN') {
      warning("Super Admin permissions are fixed and cannot be customized.", "System Protection");
      return;
    }

    setPermissions(prev => {
      const exists = prev.includes(permKey);
      const newList = exists 
        ? prev.filter(k => k !== permKey) 
        : [...prev, permKey];
      
      setModified(true);
      return newList;
    });
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const res = await userService.updateRolePermissions(selectedRole, permissions);
      if (res?.status === 200 || res?.status === 201) {
        success(`RBAC permissions matrix successfully saved for role ${selectedRole}.`, "Permissions Saved");
        setModified(false);
      }
    } catch (err) {
      console.error("Failed to save permissions matrix", err);
      showError("Could not update role permission configurations.", "Update Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Permission Matrix"
        subtitle="Granular View, Create, Edit, Delete, Export, Approve, and Manage matrix across platform modules."
        actionLabel={modified ? "Save Permission Matrix" : null}
        onAction={handleSaveChanges}
        actionIcon={Save}
        badge={selectedRole === 'SUPER_ADMIN' ? 'Fixed Matrix' : 'Customizable'}
      />

      {/* Role Selection Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Configure Target Role:</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            {systemRolesList.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>

        {selectedRole === 'SUPER_ADMIN' && (
          <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold px-3 py-1.5 rounded-full border border-indigo-200/30">
            <Info className="w-3.5 h-3.5" /> Super Admin possesses system-wide permissions by design.
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 animate-fade-in">
          {permissionSchema.map((cat, catIdx) => (
            <div key={catIdx} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-black text-slate-950 dark:text-slate-50 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2">
                {cat.category}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.permissions.map(perm => {
                  const isChecked = permissions.includes(perm.key);

                  return (
                    <div 
                      key={perm.key}
                      onClick={() => handleTogglePerm(perm.key)}
                      className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-all duration-200 select-none ${
                        selectedRole === 'SUPER_ADMIN' ? 'cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isChecked
                          ? 'bg-emerald-500/5 border-emerald-500 dark:border-emerald-600/60 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] font-bold text-slate-400 block tracking-wide uppercase">
                          {perm.key}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {perm.label}
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-normal font-medium">
                          {perm.desc}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={selectedRole === 'SUPER_ADMIN'}
                        className={`w-6 h-6 rounded-lg inline-flex items-center justify-center shrink-0 border transition-all ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-400'
                        }`}
                      >
                        {isChecked ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-30" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PermissionMatrixPage;
