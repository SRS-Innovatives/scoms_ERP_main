export const mockStudentSubjects = [
  { code: "CS8401", title: "Operating Systems", faculty: "Dr. Malathi S.", credits: 4, type: "Theory", attendance: 92.0, internalMarks: 23, totalMarks: 25, grade: "O", status: "Active" },
  { code: "CS8402", title: "Data Structures & Algorithms", faculty: "Prof. R. Ramanathan", credits: 4, type: "Theory", attendance: 85.5, internalMarks: 21, totalMarks: 25, grade: "A+", status: "Active" },
  { code: "CS8403", title: "Database Management Systems", faculty: "Dr. K. Swaminathan", credits: 4, type: "Theory", attendance: 90.0, internalMarks: 24, totalMarks: 25, grade: "O", status: "Active" },
  { code: "CS8404", title: "Software Engineering", faculty: "Mrs. Leela Nair", credits: 3, type: "Theory", attendance: 74.0, internalMarks: 18, totalMarks: 25, grade: "B+", status: "Active" },
  { code: "CS8405", title: "Web Technology Lab", faculty: "Prof. Arvind Rao", credits: 2, type: "Practical", attendance: 96.0, internalMarks: 25, totalMarks: 25, grade: "O", status: "Active" }
];

export const mockTodaySchedule = [
  { period: 1, subject: "Operating Systems", code: "CS8401", teacher: "Dr. Malathi S.", room: "CS Lab-2", startTime: "09:30 AM", endTime: "10:30 AM", status: "Completed", onlineLink: "https://meet.google.com/abc-defg-hij" },
  { period: 2, subject: "Data Structures & Algorithms", code: "CS8402", teacher: "Prof. R. Ramanathan", room: "Hall-104", startTime: "10:30 AM", endTime: "11:30 AM", status: "In Progress", onlineLink: "https://meet.google.com/xyz-uvwx-rst" },
  { period: 3, subject: "Database Management Systems", code: "CS8403", teacher: "Dr. K. Swaminathan", room: "Hall-104", startTime: "11:45 AM", endTime: "12:45 PM", status: "Upcoming", onlineLink: "https://meet.google.com/pqr-stuv-wxy" },
  { period: 4, subject: "Web Technology Lab", code: "CS8405", teacher: "Prof. Arvind Rao", room: "Web Lab 1", startTime: "01:30 PM", endTime: "03:30 PM", status: "Upcoming", onlineLink: "https://meet.google.com/lmn-opqr-stu" }
];

export const mockAssignments = [
  { id: "ASN-401", subject: "Operating Systems", title: "Process Scheduling Simulation Algorithm", teacher: "Dr. Malathi S.", dueDate: "2026-08-14", maxMarks: 20, obtainedMarks: 18, status: "Pending", description: "Write Python/C script simulating Round Robin and FCFS process scheduling." },
  { id: "ASN-402", subject: "Database Management Systems", title: "Normalization ER-Diagram Case Study", teacher: "Dr. K. Swaminathan", dueDate: "2026-08-18", maxMarks: 15, obtainedMarks: 15, status: "Submitted", description: "Design 3NF normalized schema for University Library ERP." },
  { id: "ASN-403", subject: "Web Technology Lab", title: "React SPA Dashboard Layout", teacher: "Prof. Arvind Rao", dueDate: "2026-08-10", maxMarks: 25, obtainedMarks: 24, status: "Completed", description: "Build responsive React SPA with Tailwind CSS." }
];

export const mockExams = [
  { id: "EXM-801", examName: "Mid-Semester Internal II", subject: "Operating Systems", code: "CS8401", date: "2026-08-25", time: "10:00 AM - 12:00 PM", room: "Exam Hall A3", seatNo: "S-42", status: "Scheduled" },
  { id: "EXM-802", examName: "Mid-Semester Internal II", subject: "Data Structures", code: "CS8402", date: "2026-08-26", time: "10:00 AM - 12:00 PM", room: "Exam Hall A3", seatNo: "S-42", status: "Scheduled" },
  { id: "EXM-803", examName: "Mid-Semester Internal II", subject: "Database Management", code: "CS8403", date: "2026-08-27", time: "10:00 AM - 12:00 PM", room: "Exam Hall B1", seatNo: "S-42", status: "Scheduled" }
];

export const mockFeeLedger = {
  totalFee: 45000,
  paidFee: 35000,
  pendingFee: 10000,
  dueDate: "2026-08-31",
  breakdown: [
    { type: "Tuition Fee (Sem 4)", amount: 30000, paid: 30000, balance: 0, status: "Paid" },
    { type: "Special Lab & Web Tech Fee", amount: 5000, paid: 5000, balance: 0, status: "Paid" },
    { type: "Library & Digital Repository Fee", amount: 2000, paid: 0, balance: 2000, status: "Pending" },
    { type: "Semester Exam Fee", amount: 8000, paid: 0, balance: 8000, status: "Pending" }
  ]
};

export const mockFeeReceipts = [
  { id: "RCP-2026-904", receiptNo: "SCOMS/RCP/26-094", date: "2026-02-10", feeType: "Tuition & Lab Fee (Sem 4)", amount: 35000, paymentMode: "Razorpay (UPI)", txnid: "pay_OpL9928194", status: "Paid" }
];

export const mockLibraryBooks = [
  { id: "LIB-102", title: "Operating System Concepts (Silberschatz)", author: "Silberschatz, Galvin", issueDate: "2026-07-15", dueDate: "2026-08-15", fine: 0, status: "Borrowed" },
  { id: "LIB-104", title: "Fundamentals of Database Systems", author: "Elmasri, Navathe", issueDate: "2026-07-20", dueDate: "2026-08-20", fine: 0, status: "Borrowed" }
];

export const mockAnnouncements = [
  { id: "ANC-301", title: "Mid-Semester Examination Schedule Published", category: "Examination", date: "2026-08-09", priority: "High", message: "Internal assessment II will commence from 25th August 2026. Hall tickets available in portal." },
  { id: "ANC-302", title: "Independence Day Campus Flag Hoisting & Cultural Event", category: "Events", date: "2026-08-08", priority: "Medium", message: "All students are invited for 79th Independence Day celebration at Main Auditorium 8:00 AM." }
];

export const mockQuestionBank = [
  { id: "Q-101", subject: "Operating Systems", chapter: "CPU Scheduling", topic: "Round Robin Algorithm", type: "MCQ", difficulty: "Medium", question: "Which CPU scheduling algorithm gives minimum average waiting time?", options: ["FCFS", "SJF", "Round Robin", "Priority"], answer: "SJF" },
  { id: "Q-102", subject: "Database Management", chapter: "Normalization", topic: "3NF & BCNF", type: "Short Answer", difficulty: "Hard", question: "Explain the main difference between 3NF and BCNF with a relational schema example." }
];
