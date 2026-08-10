export const mockStaffProfile = {
  id: "STF-8842",
  name: "Dr. Rajesh Sharma",
  designation: "Head of Department (HOD) & Senior Lecturer",
  department: "Physics & Applied Science",
  email: "rajesh.sharma@scoms-edu.in",
  phone: "+91 98765 43210",
  altPhone: "+91 94123 56789",
  dob: "1982-08-15",
  gender: "Male",
  bloodGroup: "O+",
  joiningDate: "2015-06-01",
  experienceYears: 11,
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
  qualification: [
    { degree: "Ph.D. in Applied Physics", institute: "IIT Delhi", year: "2012", percentage: "88.5%" },
    { degree: "M.Sc. Physics", institute: "Delhi University (DU)", year: "2006", percentage: "84.2%" },
    { degree: "B.Sc. Physics (Hons)", institute: "St. Stephen's College, Delhi", year: "2004", percentage: "81.0%" }
  ],
  experience: [
    { role: "HOD & Senior Lecturer", organization: "SCOMS International Academy, Bengaluru", period: "2018 - Present" },
    { role: "Assistant Professor", organization: "National Institute of Technology, Surathkal", period: "2013 - 2018" },
    { role: "Research Associate", organization: "CSIR-NPL, New Delhi", period: "2011 - 2013" }
  ],
  bankDetails: {
    accountName: "Rajesh Sharma",
    bankName: "State Bank of India (SBI)",
    accountNumber: "30987654321",
    ifscCode: "SBIN0004561",
    branch: "MG Road, Bengaluru",
    panNumber: "ABCPS8842K"
  },
  emergencyContact: {
    name: "Sunita Sharma",
    relation: "Spouse",
    phone: "+91 98765 99999",
    address: "Plot 42, Green Glen Layout, Bellandur, Bengaluru - 560103"
  },
  documents: [
    { id: 1, name: "Aadhaar Card", type: "PDF", status: "Verified", date: "2024-01-10" },
    { id: 2, name: "PAN Card", type: "PDF", status: "Verified", date: "2024-01-10" },
    { id: 3, name: "Ph.D. Degree Certificate", type: "PDF", status: "Verified", date: "2024-01-10" },
    { id: 4, name: "Relieving Letter - NIT", type: "PDF", status: "Verified", date: "2024-01-10" }
  ]
};

export const mockDashboardStats = {
  todayClassesCount: 4,
  attendanceTakenCount: 3,
  pendingAttendanceCount: 1,
  pendingAssignmentsGrading: 14,
  upcomingExamsCount: 2,
  pendingMarksEntry: 1,
  leaveBalanceDays: 12,
  studentMessagesCount: 5
};

export const mockTodaySchedule = [
  { time: "08:30 AM - 09:15 AM", period: "Period 1", class: "Class 10-A", subject: "Physics", room: "Lab 201", status: "Completed", isCurrent: false },
  { time: "09:20 AM - 10:05 AM", period: "Period 2", class: "Class 11-B", subject: "Electrostatics", room: "Room 304", status: "Completed", isCurrent: false },
  { time: "10:15 AM - 11:00 AM", period: "Period 3", class: "Class 12-A", subject: "Quantum Physics", room: "Hall B", status: "In Progress", isCurrent: true },
  { time: "11:05 AM - 11:50 AM", period: "Period 4", class: "Free Period", subject: "Question Paper Review", room: "Staff Room", status: "Upcoming", isCurrent: false },
  { time: "01:00 PM - 02:30 PM", period: "Period 6-7", class: "Class 12-A Lab", subject: "Optics Practical", room: "Physics Lab 1", status: "Upcoming", isCurrent: false },
  { time: "02:40 PM - 03:30 PM", period: "Period 8", class: "Doubt Solving", subject: "Remedial Physics", room: "Room 304", status: "Upcoming", isCurrent: false }
];

export const mockAssignedClasses = [
  { id: "c1", name: "Class 10-A", section: "A", subject: "Physics", studentsCount: 42, room: "Lab 201", isClassTeacher: true, syllabusProgress: 68 },
  { id: "c2", name: "Class 11-B", section: "B", subject: "Applied Physics", studentsCount: 38, room: "Room 304", isClassTeacher: false, syllabusProgress: 60 },
  { id: "c3", name: "Class 12-A", section: "A", subject: "Advanced Physics & Electromagnetism", studentsCount: 40, room: "Hall B", isClassTeacher: false, syllabusProgress: 75 },
  { id: "c4", name: "Class 12-A Lab", section: "A", subject: "Physics Practicals", studentsCount: 40, room: "Physics Lab 1", isClassTeacher: false, syllabusProgress: 82 }
];

export const mockStudentsList = [
  { rollNo: "101", id: "STU-001", name: "Aarav Patel", gender: "Male", class: "Class 12-A", attendancePercent: 94.5, lastMarks: 88, status: "Present", parentContact: "+91 98111 22233" },
  { rollNo: "102", id: "STU-002", name: "Ananya Sen", gender: "Female", class: "Class 12-A", attendancePercent: 98.0, lastMarks: 95, status: "Present", parentContact: "+91 98111 44455" },
  { rollNo: "103", id: "STU-003", name: "Rohan Verma", gender: "Male", class: "Class 12-A", attendancePercent: 72.0, lastMarks: 52, status: "Absent", parentContact: "+91 98111 66677" },
  { rollNo: "104", id: "STU-004", name: "Priyansh Gupta", gender: "Male", class: "Class 12-A", attendancePercent: 91.2, lastMarks: 84, status: "Present", parentContact: "+91 98111 88899" },
  { rollNo: "105", id: "STU-005", name: "Diya Sharma", gender: "Female", class: "Class 12-A", attendancePercent: 88.5, lastMarks: 79, status: "Late", parentContact: "+91 98222 11122" },
  { rollNo: "106", id: "STU-006", name: "Ishaan Kumar", gender: "Male", class: "Class 12-A", attendancePercent: 64.0, lastMarks: 44, status: "Absent", parentContact: "+91 98222 33344" },
  { rollNo: "107", id: "STU-007", name: "Meera Nair", gender: "Female", class: "Class 12-A", attendancePercent: 96.0, lastMarks: 92, status: "Present", parentContact: "+91 98222 55566" },
  { rollNo: "108", id: "STU-008", name: "Vivaan Joshi", gender: "Male", class: "Class 12-A", attendancePercent: 82.3, lastMarks: 68, status: "On Duty", parentContact: "+91 98222 77788" }
];

export const mockAssignments = [
  { id: "ASN-201", title: "Electrostatic Potential & Capacitance", class: "Class 12-A", subject: "Physics", dueDate: "2026-08-15", totalSubmissions: 36, totalStudents: 40, maxMarks: 25, status: "Active" },
  { id: "ASN-202", title: "Ray Optics Practical Log & Diagrams", class: "Class 12-A Lab", subject: "Physics Lab", dueDate: "2026-08-12", totalSubmissions: 40, totalStudents: 40, maxMarks: 15, status: "Evaluating" },
  { id: "ASN-203", title: "Newton's Laws & Friction Problem Set", class: "Class 10-A", subject: "Physics", dueDate: "2026-08-18", totalSubmissions: 28, totalStudents: 42, maxMarks: 20, status: "Active" },
  { id: "ASN-204", title: "Thermodynamics & Kinetic Theory Worksheet", class: "Class 11-B", subject: "Applied Physics", dueDate: "2026-08-08", totalSubmissions: 38, totalStudents: 38, maxMarks: 30, status: "Completed" }
];

export const mockSubmissions = [
  { studentId: "STU-001", studentName: "Aarav Patel", rollNo: "101", submittedOn: "2026-08-11 10:14 AM", fileUrl: "electrostatics_aarav.pdf", status: "Submitted", marks: null, feedback: "" },
  { studentId: "STU-002", studentName: "Ananya Sen", rollNo: "102", submittedOn: "2026-08-10 08:45 PM", fileUrl: "ananya_optics.pdf", status: "Evaluated", marks: 25, feedback: "Excellent diagrams and step-by-step mathematical derivation." },
  { studentId: "STU-003", studentName: "Rohan Verma", rollNo: "103", submittedOn: "-", fileUrl: "-", status: "Pending", marks: 0, feedback: "Overdue by 1 day." },
  { studentId: "STU-004", studentName: "Priyansh Gupta", rollNo: "104", submittedOn: "2026-08-11 09:30 AM", fileUrl: "priyansh_physics.pdf", status: "Submitted", marks: null, feedback: "" }
];

export const mockQuestionBank = [
  { id: "Q-101", subject: "Physics", chapter: "Electrostatics", difficulty: "Medium", bloomLevel: "Applying", type: "5 Mark", question: "Derive an expression for the electric potential at a point due to an electric dipole along its axial line." },
  { id: "Q-102", subject: "Physics", chapter: "Ray Optics", difficulty: "Hard", bloomLevel: "Evaluating", type: "5 Mark", question: "State Huygens' principle. Using Huygens' wave theory, verify the laws of refraction at a plane interface." },
  { id: "Q-103", subject: "Physics", chapter: "Kinematics", difficulty: "Easy", bloomLevel: "Remembering", type: "MCQ", question: "Which of the following physical quantities is a scalar?", options: ["Acceleration", "Electric Field", "Work Done", "Magnetic Dipole"], answer: "Work Done" },
  { id: "Q-104", subject: "Physics", chapter: "Current Electricity", difficulty: "Medium", bloomLevel: "Analyzing", type: "2 Mark", question: "Distinguish between drift velocity and relaxation time of free electrons in a conductor." }
];

export const mockStudyMaterials = [
  { id: "MAT-501", title: "Unit 3: Wave Optics Complete Lecture Notes", subject: "Physics", class: "Class 12-A", type: "PDF", size: "4.8 MB", uploadsDate: "2026-08-01", downloads: 142 },
  { id: "MAT-502", title: "Electrostatics Formula Sheet & Mindmaps", subject: "Physics", class: "Class 12-A", type: "PDF", size: "1.2 MB", uploadsDate: "2026-07-28", downloads: 210 },
  { id: "MAT-503", title: "Lab Manual: Focal Length of Convex Lens", subject: "Physics Lab", class: "Class 12-A Lab", type: "DOCX", size: "850 KB", uploadsDate: "2026-07-20", downloads: 98 },
  { id: "MAT-504", title: "Class 11 Physics Revision Slides (Chapter 1-5)", subject: "Applied Physics", class: "Class 11-B", type: "PPTX", size: "12.4 MB", uploadsDate: "2026-08-04", downloads: 165 }
];

export const mockExamDuties = [
  { id: "EXM-01", title: "Unit Test II Invigilation", class: "Class 10-C", room: "Hall A-1", date: "2026-08-16", time: "09:30 AM - 11:30 AM", role: "Chief Invigilator" },
  { id: "EXM-02", title: "Mid-Term Physics Paper Evaluation", class: "Class 12-A", room: "Central Valuation Hall", date: "2026-08-20", time: "10:00 AM - 04:00 PM", role: "Evaluator" },
  { id: "EXM-03", title: "CBSE Board Practical External Examiner Duty", class: "Delhi Public School, Electronic City", room: "Physics Lab", date: "2026-08-25", time: "08:30 AM - 03:30 PM", role: "External Examiner" }
];

export const mockLeaveBalance = {
  casualLeave: { total: 12, used: 4, remaining: 8 },
  earnedLeave: { total: 15, used: 2, remaining: 13 },
  medicalLeave: { total: 10, used: 1, remaining: 9 },
  dutyLeave: { total: 5, used: 3, remaining: 2 },
  history: [
    { id: "LV-901", type: "Casual Leave", startDate: "2026-07-14", endDate: "2026-07-15", days: 2, reason: "Family Function", status: "Approved", approvedBy: "Principal - Dr. S. Mehta" },
    { id: "LV-902", type: "Duty Leave", startDate: "2026-06-22", endDate: "2026-06-22", days: 1, reason: "Physics Seminar at IISc Bengaluru", status: "Approved", approvedBy: "HOD Admin" },
    { id: "LV-903", type: "Medical Leave", startDate: "2026-05-10", endDate: "2026-05-11", days: 2, reason: "Viral Fever", status: "Approved", approvedBy: "Principal" }
  ]
};

export const mockNotifications = [
  { id: 1, title: "Submission Alert", message: "36 students submitted Assignment: Electrostatics", time: "10 mins ago", unread: true, category: "assignment" },
  { id: 2, title: "Principal Circular", message: "Staff Academic Committee meeting scheduled today at 4:00 PM in Conference Room 1.", time: "1 hour ago", unread: true, category: "announcement" },
  { id: 3, title: "Leave Approval", message: "Your Casual Leave request for Aug 22 has been APPROVED.", time: "3 hours ago", unread: false, category: "leave" },
  { id: 4, title: "Parent Message", message: "Parent of Aarav Patel requested an online meeting regarding Physics project.", time: "Yesterday", unread: false, category: "message" }
];

export const mockLabInventory = [
  { id: "EQU-01", name: "Digital Storage Oscilloscope (DSO)", code: "PHY-LAB-012", category: "Electronics", totalQty: 10, availableQty: 8, defectiveQty: 2, condition: "Good" },
  { id: "EQU-02", name: "Spectrometer (High Precision)", code: "PHY-LAB-045", category: "Optics", totalQty: 15, availableQty: 14, defectiveQty: 1, condition: "Excellent" },
  { id: "EQU-03", name: "Vernier Calliper & Screw Gauge Set", code: "PHY-LAB-102", category: "Mechanics", totalQty: 50, availableQty: 48, defectiveQty: 2, condition: "Good" },
  { id: "EQU-04", name: "Tangent Galvanometer", code: "PHY-LAB-089", category: "Magnetism", totalQty: 12, availableQty: 12, defectiveQty: 0, condition: "Good" }
];

export const mockLibraryStatus = [
  { issueId: "LIB-8801", studentName: "Aarav Patel", rollNo: "101", bookTitle: "Concepts of Physics (Vol 1 & 2) - H.C. Verma", issueDate: "2026-07-25", dueDate: "2026-08-10", status: "Overdue", fine: 20 },
  { issueId: "LIB-8802", studentName: "Ananya Sen", rollNo: "102", bookTitle: "Fundamentals of Physics - Halliday & Resnick", issueDate: "2026-08-01", dueDate: "2026-08-15", status: "Issued", fine: 0 },
  { issueId: "LIB-8803", studentName: "Meera Nair", rollNo: "107", bookTitle: "Problems in General Physics - I.E. Irodov", issueDate: "2026-08-04", dueDate: "2026-08-18", status: "Issued", fine: 0 }
];

export const mockWeeklyTimetable = [
  { time: "08:30 AM", mon: "10-A (Physics)", tue: "11-B (Physics)", wed: "12-A (Physics)", thu: "10-A (Physics)", fri: "Free Period", sat: "Doubt Session" },
  { time: "09:20 AM", mon: "11-B (Physics)", tue: "12-A (Physics)", wed: "10-A (Physics)", thu: "11-B (Physics)", fri: "12-A (Physics)", sat: "Class Teacher Time" },
  { time: "10:15 AM", mon: "12-A (Physics)", tue: "Free Period", wed: "11-B (Physics)", thu: "12-A (Physics)", fri: "10-A (Physics)", sat: "Weekly Quiz" },
  { time: "11:05 AM", mon: "Free Period", tue: "10-A (Physics)", wed: "Free Period", thu: "Free Period", fri: "11-B (Physics)", sat: "Free Period" },
  { time: "01:00 PM", mon: "12-A Lab (P1)", tue: "12-A Lab (P2)", wed: "11-B Lab", thu: "10-A Activity", fri: "Staff Meeting", sat: "Sports / Club" },
  { time: "01:50 PM", mon: "12-A Lab (P1)", tue: "12-A Lab (P2)", wed: "11-B Lab", thu: "Remedial Physics", fri: "Dept HOD Work", sat: "Free Period" }
];
