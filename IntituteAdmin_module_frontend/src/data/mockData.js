// Comprehensive Mock Dataset for SCOMS - School & College Management System (Indian Context)

export const instituteInfo = {
  name: "Sri Ramakrishna College of Engineering & Technology",
  shortName: "SRCET",
  code: "INS-30492",
  type: "Autonomous / Engineering & Arts",
  affiliation: "Anna University / Approved by AICTE & UGC",
  accreditation: "NAAC A++ Grade (CGPA 3.68) | NBA Accredited",
  established: "1994",
  logo: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=200",
  address: "45/A, Education Corridor, IT Expressway, OMR, Chennai, Tamil Nadu - 600119",
  phone: "+91 44 2847 9900",
  email: "admin@srcet.edu.in",
  website: "www.srcet.edu.in",
  bankDetails: {
    bankName: "State Bank of India",
    branch: "OMR Tech Campus Branch",
    accountName: "Sri Ramakrishna Educational Trust",
    accountNumber: "304892019482",
    ifscCode: "SBIN0004920",
    micrCode: "600002104"
  }
};

export const dashboardStats = {
  totalStudents: 3450,
  totalStaff: 285,
  todayAttendance: 94.8, // %
  pendingFees: 1845000, // INR
  todayCollection: 245000, // INR
  upcomingExams: 12,
  activeCourses: 18,
  newAdmissions: 420
};

export const chartData = {
  monthlyCollection: [
    { month: "Jan", amount: 1250000 },
    { month: "Feb", amount: 1840000 },
    { month: "Mar", amount: 2100000 },
    { month: "Apr", amount: 950000 },
    { month: "May", amount: 3200000 },
    { month: "Jun", amount: 4500000 },
    { month: "Jul", amount: 3800000 },
    { month: "Aug", amount: 2900000 }
  ],
  attendanceTrend: [
    { day: "Mon", rate: 96.2 },
    { day: "Tue", rate: 95.8 },
    { day: "Wed", rate: 94.1 },
    { day: "Thu", rate: 93.5 },
    { day: "Fri", rate: 94.8 },
    { day: "Sat", rate: 91.2 }
  ],
  departmentStudents: [
    { name: "Computer Science", count: 920 },
    { name: "Electronics (ECE)", count: 680 },
    { name: "AI & Data Science", count: 540 },
    { name: "Mechanical Engg", count: 420 },
    { name: "Civil Engg", count: 310 },
    { name: "Arts & Science", count: 580 }
  ],
  feePendingBreakdown: [
    { category: "Tuition Fee", amount: 1100000 },
    { category: "Hostel & Mess", amount: 420000 },
    { category: "Bus Transport", amount: 225000 },
    { category: "Exam Fee", amount: 100000 }
  ]
};

export const academicYears = [
  { id: "AY2025-26", year: "2025 - 2026", status: "Active", startDate: "2025-06-01", endDate: "2026-05-31" },
  { id: "AY2024-25", year: "2024 - 2025", status: "Completed", startDate: "2024-06-01", endDate: "2025-05-31" },
  { id: "AY2023-24", year: "2023 - 2024", status: "Archived", startDate: "2023-06-01", endDate: "2024-05-31" }
];

export const departments = [
  { id: "DEP-CSE", code: "CSE", name: "Computer Science & Engineering", hod: "Dr. R. Ramanathan", staffCount: 42, studentCount: 920, status: "Active" },
  { id: "DEP-ECE", code: "ECE", name: "Electronics & Communication Engg", hod: "Dr. K. Meenakshi", staffCount: 36, studentCount: 680, status: "Active" },
  { id: "DEP-AIDS", code: "AIDS", name: "Artificial Intelligence & Data Science", hod: "Dr. S. Sundararajan", staffCount: 28, studentCount: 540, status: "Active" },
  { id: "DEP-MECH", code: "MECH", name: "Mechanical Engineering", hod: "Prof. P. Venkatesh", staffCount: 30, studentCount: 420, status: "Active" },
  { id: "DEP-CIVIL", code: "CIVIL", name: "Civil Engineering", hod: "Dr. M. Anbarasan", staffCount: 20, studentCount: 310, status: "Active" },
  { id: "DEP-HUM", code: "HUM", name: "Science & Humanities", hod: "Dr. V. Lakshmi", staffCount: 45, studentCount: 580, status: "Active" }
];

export const courses = [
  { id: "CRS-BE-CSE", name: "B.E. Computer Science & Engineering", code: "BE-CSE", dept: "Computer Science & Engineering", duration: "4 Years", type: "Undergraduate", totalSeats: 240, feesPerYear: 85000 },
  { id: "CRS-BE-AIDS", name: "B.Tech. AI & Data Science", code: "TECH-AIDS", dept: "Artificial Intelligence & Data Science", duration: "4 Years", type: "Undergraduate", totalSeats: 180, feesPerYear: 90000 },
  { id: "CRS-BE-ECE", name: "B.E. Electronics & Communication", code: "BE-ECE", dept: "Electronics & Communication Engg", duration: "4 Years", type: "Undergraduate", totalSeats: 180, feesPerYear: 80000 },
  { id: "CRS-ME-CSE", name: "M.E. Computer Science & Engg", code: "ME-CSE", dept: "Computer Science & Engineering", duration: "2 Years", type: "Postgraduate", totalSeats: 30, feesPerYear: 65000 },
  { id: "CRS-BSC-CS", name: "B.Sc. Computer Science", code: "BSC-CS", dept: "Science & Humanities", duration: "3 Years", type: "Undergraduate", totalSeats: 120, feesPerYear: 45000 }
];

export const studentsList = [
  {
    id: "STU-2025-001",
    rollNo: "21CS101",
    regNo: "311521104001",
    name: "Kavitha R. Sharma",
    gender: "Female",
    dob: "2003-05-14",
    bloodGroup: "O+",
    aadhaarNo: "8492-3049-1029",
    casteCommunity: "BC (OBC)",
    scholarship: "First Generation Graduate (Govt of TN)",
    course: "B.E. Computer Science & Engineering",
    dept: "Computer Science & Engineering",
    yearSem: "3rd Year / 6th Sem",
    section: "A",
    phone: "+91 98401 23456",
    email: "kavitha.s@student.srcet.edu.in",
    fatherName: "Rajendra Sharma",
    fatherOcc: "Business Executive",
    motherName: "Sunitha Sharma",
    parentPhone: "+91 94441 98765",
    address: "Door No 12, Gandhi Street, T. Nagar, Chennai - 600017",
    transport: "Bus Route 04 (Velachery)",
    hostel: "Day Scholar",
    status: "Active",
    feeStatus: "Paid",
    pendingFeeAmount: 0,
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "STU-2025-002",
    rollNo: "21CS102",
    regNo: "311521104002",
    name: "Aditya V. Karthik",
    gender: "Male",
    dob: "2003-08-22",
    bloodGroup: "B+",
    aadhaarNo: "7402-9182-3847",
    casteCommunity: "OC / General",
    scholarship: "Merit Scholarship 2025",
    course: "B.E. Computer Science & Engineering",
    dept: "Computer Science & Engineering",
    yearSem: "3rd Year / 6th Sem",
    section: "A",
    phone: "+91 97910 44556",
    email: "aditya.k@student.srcet.edu.in",
    fatherName: "Venkatesh Karthik",
    fatherOcc: "Software Architect",
    motherName: "Deepa Karthik",
    parentPhone: "+91 98840 33221",
    address: "Plot 88, Anna Nagar West, Chennai - 600040",
    transport: "Self / Bike",
    hostel: "Day Scholar",
    status: "Active",
    feeStatus: "Pending",
    pendingFeeAmount: 25000,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "STU-2025-003",
    rollNo: "21AD015",
    regNo: "311521205015",
    name: "Priyanka M. Sundaram",
    gender: "Female",
    dob: "2003-11-05",
    bloodGroup: "A+",
    aadhaarNo: "6392-1049-5839",
    casteCommunity: "MBC",
    scholarship: "7.5% Govt School Quota",
    course: "B.Tech. AI & Data Science",
    dept: "Artificial Intelligence & Data Science",
    yearSem: "3rd Year / 6th Sem",
    section: "B",
    phone: "+91 94452 77889",
    email: "priyanka.s@student.srcet.edu.in",
    fatherName: "Muthusamy Sundaram",
    fatherOcc: "Farmer",
    motherName: "Revathi Sundaram",
    parentPhone: "+91 93601 55443",
    address: "Main Road, Thiruvannamalai, Tamil Nadu - 606601",
    transport: "None",
    hostel: "Kaveri Girls Hostel - Room 304",
    status: "Active",
    feeStatus: "Paid",
    pendingFeeAmount: 0,
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "STU-2025-004",
    rollNo: "22EC044",
    regNo: "311522106044",
    name: "Siddharth N. Nair",
    gender: "Male",
    dob: "2004-03-18",
    bloodGroup: "AB+",
    aadhaarNo: "9182-4739-2049",
    casteCommunity: "OC",
    scholarship: "None",
    course: "B.E. Electronics & Communication",
    dept: "Electronics & Communication Engg",
    yearSem: "2nd Year / 4th Sem",
    section: "A",
    phone: "+91 98845 11223",
    email: "siddharth.n@student.srcet.edu.in",
    fatherName: "Narayanan Nair",
    fatherOcc: "Bank Officer",
    motherName: "Shailaja Nair",
    parentPhone: "+91 94440 66778",
    address: "Block B, Prestige Cyber Towers, OMR, Chennai",
    transport: "Bus Route 12 (Adyar)",
    hostel: "Day Scholar",
    status: "Active",
    feeStatus: "Partial",
    pendingFeeAmount: 15000,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "STU-2025-005",
    rollNo: "23ME012",
    regNo: "311523114012",
    name: "Vigneshwaran K. Pandian",
    gender: "Male",
    dob: "2005-01-29",
    bloodGroup: "O-",
    aadhaarNo: "4820-1948-2948",
    casteCommunity: "SC",
    scholarship: "Post Matric Scholarship (PMS)",
    course: "B.E. Mechanical Engineering",
    dept: "Mechanical Engineering",
    yearSem: "1st Year / 2nd Sem",
    section: "A",
    phone: "+91 97890 33445",
    email: "vignesh.p@student.srcet.edu.in",
    fatherName: "Karuppasamy Pandian",
    fatherOcc: "Govt Employee",
    motherName: "Lakshmi Pandian",
    parentPhone: "+91 94431 88990",
    address: "24, West Street, Madurai - 625001",
    transport: "None",
    hostel: "Bhavani Boys Hostel - Room 112",
    status: "Active",
    feeStatus: "Paid",
    pendingFeeAmount: 0,
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
  }
];

export const staffList = [
  {
    id: "EMP-1042",
    empId: "T-CSE-012",
    name: "Dr. R. Ramanathan",
    type: "Teaching",
    role: "Professor & HOD",
    dept: "Computer Science & Engineering",
    qualification: "Ph.D. (IIT Madras), M.E., B.E.",
    experience: "18 Years",
    doj: "2010-06-15",
    phone: "+91 98402 55667",
    email: "ramanathan.r@srcet.edu.in",
    salary: 135000,
    status: "Active",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "EMP-1045",
    empId: "T-CSE-028",
    name: "Prof. S. Malathi",
    type: "Teaching",
    role: "Associate Professor",
    dept: "Computer Science & Engineering",
    qualification: "M.E. (CSE), (Ph.D.)",
    experience: "12 Years",
    doj: "2014-08-01",
    phone: "+91 97901 88990",
    email: "malathi.s@srcet.edu.in",
    salary: 95000,
    status: "Active",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "EMP-2004",
    empId: "NT-ADM-004",
    name: "G. Murugesan",
    type: "Non-Teaching",
    role: "Senior Accountant",
    dept: "Finance & Accounts",
    qualification: "M.Com, Tally ERP 9",
    experience: "15 Years",
    doj: "2011-03-10",
    phone: "+91 94442 33441",
    email: "accounts@srcet.edu.in",
    salary: 58000,
    status: "Active",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "EMP-2009",
    empId: "NT-LIB-002",
    name: "K. Saraswathi",
    type: "Non-Teaching",
    role: "Librarian",
    dept: "Central Library",
    qualification: "M.L.I.S, B.Sc",
    experience: "10 Years",
    doj: "2016-01-20",
    phone: "+91 98841 90909",
    email: "library@srcet.edu.in",
    salary: 48000,
    status: "Active",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
  }
];

export const feeCategories = [
  { id: "CAT-TUI", code: "TUI", name: "Tuition Fee", frequency: "Per Semester", mandatory: true, description: "Core academic instruction fee" },
  { id: "CAT-EXM", code: "EXM", name: "Examination & University Fee", frequency: "Per Semester", mandatory: true, description: "University exam registration, evaluation and marksheet fee" },
  { id: "CAT-LAB", code: "LAB", name: "Special Lab & Skill Development", frequency: "Per Year", mandatory: false, description: "Advanced Computing, IoT, Cloud & AI lab subscription" },
  { id: "CAT-BUS", code: "BUS", name: "Bus Transport Fee", frequency: "Per Year", mandatory: false, description: "College AC / Non-AC bus pickup and drop facility" },
  { id: "CAT-HST", code: "HST", name: "Hostel & Mess Boarding", frequency: "Per Semester", mandatory: false, description: "Accommodation, laundry, security and dining mess" }
];

export const feeStructures = [
  {
    id: "FS-2025-CSE",
    academicYear: "2025 - 2026",
    course: "B.E. Computer Science & Engineering",
    category: "Tuition Fee",
    semester: "Semester 6",
    amount: 42500,
    dueDate: "2025-03-31",
    lateFeePerDay: 100
  },
  {
    id: "FS-2025-EXM",
    academicYear: "2025 - 2026",
    course: "All Engineering Branches",
    category: "Examination Fee",
    semester: "Semester 6",
    amount: 3500,
    dueDate: "2025-03-15",
    lateFeePerDay: 50
  },
  {
    id: "FS-2025-BUS",
    academicYear: "2025 - 2026",
    course: "All Courses",
    category: "Bus Transport Fee",
    semester: "Annual",
    amount: 24000,
    dueDate: "2025-06-30",
    lateFeePerDay: 100
  }
];

export const feeTransactions = [
  {
    receiptNo: "REC/2025/04921",
    date: "2025-08-08",
    studentId: "STU-2025-001",
    studentName: "Kavitha R. Sharma",
    rollNo: "21CS101",
    course: "B.E. CSE - Sem 6",
    amountPaid: 46000,
    paymentMode: "UPI / GPay",
    transactionId: "UPI/382049182749",
    paidFor: "Tuition Fee (Rs 42,500) + Exam Fee (Rs 3,500)",
    status: "Success",
    collectedBy: "G. Murugesan (Accountant)"
  },
  {
    receiptNo: "REC/2025/04922",
    date: "2025-08-09",
    studentId: "STU-2025-003",
    studentName: "Priyanka M. Sundaram",
    rollNo: "21AD015",
    course: "B.Tech AI&DS - Sem 6",
    amountPaid: 28000,
    paymentMode: "Bank Challan / Cash",
    transactionId: "CHLN-849201",
    paidFor: "Hostel & Mess Boarding - Instalment 1",
    status: "Success",
    collectedBy: "SBI Tech Branch Cashier"
  },
  {
    receiptNo: "REC/2025/04923",
    date: "2025-08-09",
    studentId: "STU-2025-004",
    studentName: "Siddharth N. Nair",
    rollNo: "22EC044",
    course: "B.E. ECE - Sem 4",
    amountPaid: 20000,
    paymentMode: "Cheque",
    transactionId: "CHQ-004920 (HDFC Bank)",
    paidFor: "Tuition Fee - Partial",
    status: "Success",
    collectedBy: "G. Murugesan (Accountant)"
  }
];

export const bankChallans = [
  {
    challanNo: "CHLN/2025/849201",
    issueDate: "2025-08-05",
    dueDate: "2025-08-25",
    studentId: "STU-2025-002",
    studentName: "Aditya V. Karthik",
    rollNo: "21CS102",
    course: "B.E. CSE - 3rd Year",
    bankName: "State Bank of India",
    branch: "OMR Tech Campus Branch",
    accountNo: "304892019482",
    ifscCode: "SBIN0004920",
    items: [
      { feeHead: "Tuition Fee (Balance)", amount: 21500 },
      { feeHead: "Exam Registration Fee", amount: 3500 }
    ],
    totalAmount: 25000,
    status: "Issued / Unpaid"
  }
];

export const announcements = [
  {
    id: "ANC-001",
    title: "Submission of Even Semester Examination Registration Forms",
    category: "Academic",
    targetAudience: "All Students & HODs",
    publishDate: "2025-08-05",
    author: "Controller of Examinations",
    priority: "High",
    content: "All 2nd, 3rd, and 4th-year students are requested to complete exam fee payment and submit signed forms to respective department coordinators before 20th August 2025."
  },
  {
    id: "ANC-002",
    title: "Annual Tech Symposium 'INNOVISION 2025' Dates Announced",
    category: "Event",
    targetAudience: "All Students & Staff",
    publishDate: "2025-08-01",
    author: "Student Affairs Cell",
    priority: "Medium",
    content: "The annual inter-collegiate technical festival 'Innovision 2025' will take place on September 12-13, 2025. Registrations open on the portal next week."
  }
];

export const libraryBooks = [
  { id: "BK-001", title: "Introduction to Algorithms (4th Ed)", author: "Cormen, Leiserson, Rivest, Stein", isbn: "978-0262046305", copies: 25, available: 18, category: "Computer Science" },
  { id: "BK-002", title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell, Peter Norvig", isbn: "978-0134610993", copies: 20, available: 12, category: "AI & Data Science" },
  { id: "BK-003", title: "Digital Signal Processing: Principles & Applications", author: "John G. Proakis", isbn: "978-0131873742", copies: 15, available: 5, category: "Electronics" },
  { id: "BK-004", title: "Thermodynamics: An Engineering Approach", author: "Yunus A. Cengel", isbn: "978-0073398174", copies: 18, available: 14, category: "Mechanical" }
];

export const transportRoutes = [
  { id: "RT-01", routeName: "Velachery - Tambaram Corridor", busNo: "TN-09-CB-4920", driver: "M. Kumar (+91 98412 11223)", capacity: 55, assignedStudents: 48, fee: 24000 },
  { id: "RT-02", routeName: "Anna Nagar - Koyambedu Loop", busNo: "TN-09-CB-4921", driver: "P. Selvam (+91 94441 55667)", capacity: 55, assignedStudents: 52, fee: 26000 },
  { id: "RT-03", routeName: "Adyar - Thiruvanmiyur - ECR", busNo: "TN-09-CB-4922", driver: "K. Loganathan (+91 97910 88990)", capacity: 50, assignedStudents: 45, fee: 22000 }
];

export const hostelBlocks = [
  { id: "HST-BOYS", name: "Bhavani Boys Hostel", capacity: 450, occupied: 390, warden: "Prof. N. Sivakumar (+91 98401 77665)", messType: "Non-Veg / Veg Dining" },
  { id: "HST-GIRLS", name: "Kaveri Girls Hostel", capacity: 400, occupied: 365, warden: "Dr. P. Vimala (+91 94440 33221)", messType: "Non-Veg / Veg Dining" }
];

export const inventoryAssets = [
  { id: "AST-091", name: "Dell OptiPlex 7090 Desktop i7 16GB", location: "CSE Lab 3 - AI Centre", category: "Computing Hardware", qty: 60, status: "Good Condition", purchaseDate: "2023-11-15" },
  { id: "AST-094", name: "Epson 4K Laser Classroom Projectors", location: "Main Seminar Hall", category: "AV Equipment", qty: 8, status: "Operational", purchaseDate: "2024-02-10" },
  { id: "AST-102", name: "Keysight 100MHz Digital Oscilloscope", location: "ECE VLSI & Microprocessor Lab", category: "Lab Instruments", qty: 25, status: "Operational", purchaseDate: "2022-07-20" }
];
