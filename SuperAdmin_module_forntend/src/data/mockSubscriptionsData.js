export const mockPlans = [
  {
    id: "PLAN-01",
    name: "Free Trial",
    priceMonthly: 0,
    priceYearly: 0,
    maxStudents: 500,
    maxStaff: 30,
    maxAdmins: 2,
    storageGB: 5,
    smsCredits: 500,
    whatsappMessages: 100,
    aiCredits: 50,
    features: ["Student Directory", "Daily Attendance", "Basic Reports", "Standard Support"]
  },
  {
    id: "PLAN-02",
    name: "Starter",
    priceMonthly: 4999,
    priceYearly: 49990,
    maxStudents: 1500,
    maxStaff: 100,
    maxAdmins: 5,
    storageGB: 50,
    smsCredits: 5000,
    whatsappMessages: 1000,
    aiCredits: 500,
    features: ["Student & Staff Portal", "Fee Management & Receipts", "SMS Gateway", "Timetable Generator", "Priority Email Support"]
  },
  {
    id: "PLAN-03",
    name: "Professional",
    priceMonthly: 12999,
    priceYearly: 129990,
    maxStudents: 5000,
    maxStaff: 350,
    maxAdmins: 15,
    storageGB: 250,
    smsCredits: 25000,
    whatsappMessages: 5000,
    aiCredits: 2500,
    features: ["Online Payment Gateway (Razorpay)", "Question Paper Generator", "Library & Hostel & Transport", "Payroll & HR", "WhatsApp Automation"]
  },
  {
    id: "PLAN-04",
    name: "Enterprise",
    priceMonthly: 24999,
    priceYearly: 249990,
    maxStudents: 15000,
    maxStaff: 1000,
    maxAdmins: 50,
    storageGB: 1000,
    smsCredits: 100000,
    whatsappMessages: 25000,
    aiCredits: 10000,
    features: ["All SCOMS Modules", "AI Assistant & Analytics", "Custom API Access", "Multi-Campus Support", "Dedicated Account Manager 24/7"]
  }
];

export const mockSubscriptions = [
  { id: "SUB-801", institution: "ABC Matriculation HSS", plan: "Enterprise", startDate: "2024-02-15", endDate: "2027-02-14", billingCycle: "Yearly", amount: 249990, status: "Active", autoRenewal: true },
  { id: "SUB-802", institution: "Sri Lakshmi Arts and Science College", plan: "Professional", startDate: "2024-04-10", endDate: "2027-04-09", billingCycle: "Yearly", amount: 129990, status: "Active", autoRenewal: true },
  { id: "SUB-803", institution: "SRS College of Engineering & Tech", plan: "Enterprise", startDate: "2023-11-20", endDate: "2026-11-19", billingCycle: "Yearly", amount: 249990, status: "Active", autoRenewal: true },
  { id: "SUB-804", institution: "Government Higher Secondary School", plan: "Free Trial", startDate: "2026-07-01", endDate: "2026-08-31", billingCycle: "Monthly", amount: 0, status: "Trial", autoRenewal: false }
];
