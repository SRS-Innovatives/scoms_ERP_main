/**
 * Seeds 20 platform-default message templates (institutionId: null, isSystem: true) for
 * each of SMS, Email and WhatsApp — 60 total. Every institution sees these automatically
 * in the broadcast compose modals; Institute Admins can still create their own custom
 * templates on top (institutionId set, isSystem: false), fully editable/deletable.
 *
 * {{name}} is the one placeholder the real broadcast sender substitutes automatically
 * with each recipient's actual name. Every other {{placeholder}} (otp, amount, dueDate,
 * examName, date, ...) is intentionally left for the sender to fill in by hand before
 * dispatch — nothing here pretends to auto-fill data the compose flow doesn't actually
 * have (e.g. a live OTP, a specific fee amount per student).
 *
 * Run once: node prisma/seed/seedMessageTemplates.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIES = [
  {
    category: 'OTP_LOGIN',
    title: 'OTP for Login Verification',
    sms: 'Your SCOMS login OTP is {{otp}}. Valid for 10 minutes. Do not share this code with anyone. - SCOMS',
    emailSubject: 'Your SCOMS Login Verification Code',
    email: "Hello {{name}},\n\nYour one-time verification code to log in to your SCOMS account is:\n\n{{otp}}\n\nThis code is valid for 10 minutes. If you did not request this, please ignore this email or contact your institution's admin office.\n\nRegards,\nSCOMS Platform",
    whatsapp: "Hello {{name}}, your SCOMS login OTP is *{{otp}}*. It is valid for 10 minutes. Please do not share this code with anyone.",
  },
  {
    category: 'WELCOME_CREDENTIALS',
    title: 'Welcome — New Account Credentials',
    sms: 'Welcome to SCOMS, {{name}}! Your login ID is {{loginId}} and temporary password is {{password}}. Please change it after first login. - SCOMS',
    emailSubject: 'Welcome to SCOMS — Your Account is Ready',
    email: 'Hello {{name}},\n\nYour SCOMS account has been created successfully.\n\nLogin ID: {{loginId}}\nTemporary Password: {{password}}\n\nPlease log in and change your password at the earliest. If you face any issues, reach out to your institution office.\n\nWelcome aboard!\nSCOMS Platform',
    whatsapp: "Welcome to SCOMS, {{name}}! 🎓\nYour Login ID: *{{loginId}}*\nTemporary Password: *{{password}}*\n\nPlease log in and change your password at your earliest convenience.",
  },
  {
    category: 'PASSWORD_RESET',
    title: 'Password Reset Confirmation',
    sms: 'Your SCOMS account password was reset successfully. If this wasn\'t you, contact your institution admin immediately. - SCOMS',
    emailSubject: 'Your SCOMS Password Has Been Reset',
    email: 'Hello {{name}},\n\nThis is a confirmation that the password for your SCOMS account was recently reset.\n\nIf you made this change, no further action is needed. If you did NOT request this change, please contact your institution office immediately to secure your account.\n\nRegards,\nSCOMS Platform',
    whatsapp: 'Hello {{name}}, your SCOMS account password was just reset. If this was not you, please contact your institution office immediately. 🔒',
  },
  {
    category: 'FEE_DUE_REMINDER',
    title: 'Fee Due Reminder',
    sms: 'Dear Parent/Student, a fee amount of Rs.{{amount}} is due by {{dueDate}}. Please pay on time to avoid late fees. - SCOMS Accounts',
    emailSubject: 'Reminder: Fee Payment Due',
    email: 'Dear {{name}},\n\nThis is a gentle reminder that a fee payment of Rs.{{amount}} is due on {{dueDate}}.\n\nPlease make the payment through the SCOMS Student Portal or visit the accounts office. Late payment may attract additional charges.\n\nThank you,\nAccounts Department',
    whatsapp: 'Dear {{name}}, a fee payment of *Rs.{{amount}}* is due by *{{dueDate}}*. Please pay via the SCOMS portal to avoid late fees. 💳',
  },
  {
    category: 'FEE_PAYMENT_RECEIVED',
    title: 'Fee Payment Received / Receipt',
    sms: 'Payment of Rs.{{amount}} received successfully. Receipt No: {{receiptNo}}. Thank you! - SCOMS Accounts',
    emailSubject: 'Payment Received — Receipt Confirmation',
    email: 'Dear {{name}},\n\nWe have received your payment of Rs.{{amount}}.\n\nReceipt Number: {{receiptNo}}\nDate: {{date}}\n\nYou can download the official receipt from the SCOMS Student Portal under Fees > Receipts.\n\nThank you,\nAccounts Department',
    whatsapp: 'Thank you {{name}}! We\'ve received your payment of *Rs.{{amount}}* (Receipt: {{receiptNo}}). Download your receipt from the SCOMS portal. ✅',
  },
  {
    category: 'ATTENDANCE_ABSENT',
    title: "Today's Absence Alert",
    sms: 'Dear Parent, your ward {{name}} was marked ABSENT today ({{date}}). Please contact the class teacher if unaware. - SCOMS',
    emailSubject: 'Attendance Alert — Your Ward Was Absent Today',
    email: "Dear Parent,\n\nThis is to inform you that {{name}} was marked ABSENT on {{date}}.\n\nIf you were not aware of this absence, please contact the class teacher or institution office at the earliest.\n\nRegards,\nClass Teacher",
    whatsapp: 'Dear Parent, your ward *{{name}}* was marked *ABSENT* today ({{date}}). Please contact the class teacher if you were not aware. 📋',
  },
  {
    category: 'LOW_ATTENDANCE_WARNING',
    title: 'Low Attendance Warning',
    sms: 'Alert: {{name}}\'s attendance is {{percentage}}%, below the required minimum. Please ensure regular attendance. - SCOMS',
    emailSubject: 'Low Attendance Warning',
    email: "Dear Parent,\n\n{{name}}'s current attendance stands at {{percentage}}%, which is below the institution's minimum requirement.\n\nContinued low attendance may affect exam eligibility. Please ensure regular attendance going forward, and contact the class teacher if there are genuine reasons.\n\nRegards,\nInstitution Office",
    whatsapp: "Attention: *{{name}}*'s attendance is currently *{{percentage}}%*, below the required minimum. Please ensure regular attendance to avoid exam eligibility issues. ⚠️",
  },
  {
    category: 'EXAM_SCHEDULE',
    title: 'Exam Schedule Published',
    sms: 'The timetable for {{examName}} is now published on the SCOMS portal. Please check your exam dates and hall ticket. - SCOMS',
    emailSubject: 'Exam Timetable Published — {{examName}}',
    email: 'Dear {{name}},\n\nThe examination timetable for {{examName}} has been published.\n\nPlease log in to the SCOMS Student Portal to view your subject-wise schedule and download your hall ticket.\n\nAll the best for your exams!\nExamination Cell',
    whatsapp: 'The timetable for *{{examName}}* is now live on the SCOMS portal 📅. Please check your exam dates and download your hall ticket.',
  },
  {
    category: 'EXAM_RESULT_PUBLISHED',
    title: 'Exam Results Published',
    sms: 'Results for {{examName}} have been published. Login to SCOMS portal to view your marksheet. - SCOMS',
    emailSubject: 'Results Published — {{examName}}',
    email: 'Dear {{name}},\n\nYour results for {{examName}} have been published.\n\nPlease log in to the SCOMS Student Portal to view your detailed marksheet, grades and rank.\n\nRegards,\nExamination Cell',
    whatsapp: 'Good news! Results for *{{examName}}* are out 🎉. Log in to the SCOMS portal to view your marksheet.',
  },
  {
    category: 'HOMEWORK_ASSIGNED',
    title: 'New Homework/Assignment Posted',
    sms: 'New homework in {{subjectName}} has been posted, due {{dueDate}}. Please check the SCOMS portal. - SCOMS',
    emailSubject: 'New Homework Assigned — {{subjectName}}',
    email: 'Dear {{name}},\n\nA new homework/assignment has been posted for {{subjectName}}, due on {{dueDate}}.\n\nPlease log in to the SCOMS Student Portal to view the details and submit your work on time.\n\nRegards,\nSubject Teacher',
    whatsapp: 'New homework posted for *{{subjectName}}*, due *{{dueDate}}*. Please check the SCOMS portal for details. 📚',
  },
  {
    category: 'HOLIDAY_NOTICE',
    title: 'Holiday / Institution Closure Notice',
    sms: 'Notice: The institution will remain closed on {{date}} on account of {{reason}}. Classes resume {{resumeDate}}. - SCOMS',
    emailSubject: 'Holiday Notice',
    email: 'Dear Parents/Students,\n\nPlease be informed that the institution will remain closed on {{date}} on account of {{reason}}.\n\nRegular classes will resume on {{resumeDate}}.\n\nRegards,\nInstitution Office',
    whatsapp: '📢 Holiday Notice: The institution will be closed on *{{date}}* on account of {{reason}}. Classes resume on *{{resumeDate}}*.',
  },
  {
    category: 'PARENT_TEACHER_MEETING',
    title: 'Parent-Teacher Meeting Reminder',
    sms: 'Reminder: Parent-Teacher Meeting for {{name}} is scheduled on {{date}} at {{time}}. Your presence is requested. - SCOMS',
    emailSubject: 'Parent-Teacher Meeting Scheduled',
    email: 'Dear Parent,\n\nA Parent-Teacher Meeting has been scheduled to discuss {{name}}\'s academic progress.\n\nDate: {{date}}\nTime: {{time}}\nVenue: {{venue}}\n\nYour presence is important and appreciated.\n\nRegards,\nClass Teacher',
    whatsapp: 'Reminder: Parent-Teacher Meeting for *{{name}}* is on *{{date}}* at *{{time}}*, {{venue}}. We look forward to seeing you. 🤝',
  },
  {
    category: 'LIBRARY_BOOK_DUE',
    title: 'Library Book Return Due',
    sms: 'Dear {{name}}, the library book "{{bookTitle}}" is due for return on {{dueDate}}. Please return on time to avoid fines. - SCOMS Library',
    emailSubject: 'Library Book Return Reminder',
    email: 'Dear {{name}},\n\nThis is a reminder that the book "{{bookTitle}}" issued to you is due for return on {{dueDate}}.\n\nPlease return it to the library on time to avoid a late fine.\n\nRegards,\nLibrary Department',
    whatsapp: 'Reminder: "{{bookTitle}}" is due for return on *{{dueDate}}*. Please return it on time to avoid fines. 📖',
  },
  {
    category: 'TRANSPORT_DELAY',
    title: 'Transport Delay Notification',
    sms: 'Notice: Bus Route {{routeName}} is running approx {{delayMinutes}} mins late today due to {{reason}}. - SCOMS Transport',
    emailSubject: 'Transport Delay Notification',
    email: 'Dear Parent,\n\nThis is to inform you that Bus Route {{routeName}} is running approximately {{delayMinutes}} minutes late today due to {{reason}}.\n\nWe apologize for the inconvenience.\n\nRegards,\nTransport Department',
    whatsapp: '🚌 Notice: Bus Route *{{routeName}}* is running approx *{{delayMinutes}} mins* late today due to {{reason}}. Sorry for the inconvenience.',
  },
  {
    category: 'HOSTEL_NOTICE',
    title: 'Hostel Notice',
    sms: 'Hostel Notice: {{noticeText}}. Please contact the hostel warden for any queries. - SCOMS Hostel',
    emailSubject: 'Hostel Notice',
    email: 'Dear {{name}},\n\n{{noticeText}}\n\nFor any queries, please contact the hostel warden.\n\nRegards,\nHostel Administration',
    whatsapp: '🏠 Hostel Notice: {{noticeText}}. Contact the hostel warden for any queries.',
  },
  {
    category: 'EVENT_INVITATION',
    title: 'Event Invitation',
    sms: 'You are invited to {{eventName}} on {{date}} at {{venue}}. We look forward to your participation! - SCOMS',
    emailSubject: "You're Invited — {{eventName}}",
    email: 'Dear {{name}},\n\nYou are cordially invited to {{eventName}}.\n\nDate: {{date}}\nTime: {{time}}\nVenue: {{venue}}\n\nWe look forward to your participation!\n\nRegards,\nEvent Committee',
    whatsapp: "You're invited to *{{eventName}}* on *{{date}}* at {{venue}}! 🎉 We look forward to seeing you there.",
  },
  {
    category: 'ADMISSION_CONFIRMATION',
    title: 'Admission Confirmation',
    sms: 'Congratulations {{name}}! Your admission to {{courseName}} is confirmed. Admission No: {{admissionNumber}}. - SCOMS',
    emailSubject: 'Admission Confirmed — Welcome to SCOMS',
    email: 'Dear {{name}},\n\nCongratulations! We are pleased to confirm your admission to {{courseName}}.\n\nAdmission Number: {{admissionNumber}}\n\nYour SCOMS Student Portal login credentials will be shared separately. We look forward to having you with us.\n\nWarm regards,\nAdmissions Office',
    whatsapp: 'Congratulations *{{name}}*! 🎓 Your admission to *{{courseName}}* is confirmed. Admission No: *{{admissionNumber}}*. Welcome aboard!',
  },
  {
    category: 'TC_ISSUED',
    title: 'Transfer Certificate Issued',
    sms: 'Your Transfer Certificate (TC No: {{tcNumber}}) has been issued and is ready for collection from the office. - SCOMS',
    emailSubject: 'Transfer Certificate Issued',
    email: 'Dear {{name}},\n\nYour Transfer Certificate has been issued.\n\nTC Number: {{tcNumber}}\n\nPlease visit the institution office during working hours to collect the original copy.\n\nRegards,\nAdministration Office',
    whatsapp: 'Your Transfer Certificate (TC No: *{{tcNumber}}*) is ready. Please collect it from the office during working hours. 📄',
  },
  {
    category: 'CERTIFICATE_READY',
    title: 'Certificate Ready for Collection',
    sms: 'Your {{certificateType}} certificate is ready for collection from the office. - SCOMS',
    emailSubject: 'Your Certificate is Ready',
    email: 'Dear {{name}},\n\nYour requested {{certificateType}} certificate has been processed and is ready for collection.\n\nPlease visit the institution office during working hours with a valid ID.\n\nRegards,\nAdministration Office',
    whatsapp: 'Your *{{certificateType}}* certificate is ready! 📃 Please collect it from the office with a valid ID.',
  },
  {
    category: 'EMERGENCY_ALERT',
    title: 'Emergency / Urgent Alert',
    sms: 'URGENT: {{alertMessage}} Please stay safe and follow institution instructions. - SCOMS',
    emailSubject: 'URGENT: Important Alert',
    email: 'Dear Parent/Student,\n\nThis is an urgent alert:\n\n{{alertMessage}}\n\nPlease follow the instructions from the institution and stay safe. We will keep you updated.\n\nRegards,\nInstitution Administration',
    whatsapp: '🚨 *URGENT*: {{alertMessage}} Please stay safe and follow institution instructions.',
  },
];

const run = async () => {
  const existing = await prisma.messageTemplate.count({ where: { isSystem: true } });
  if (existing > 0) {
    console.log(`Already have ${existing} system templates — skipping (delete them first if you want to reseed).`);
    await prisma.$disconnect();
    return;
  }

  const rows = [];
  CATEGORIES.forEach((c) => {
    rows.push({ channel: 'SMS', category: c.category, title: c.title, body: c.sms, isSystem: true });
    rows.push({ channel: 'EMAIL', category: c.category, title: c.title, subject: c.emailSubject, body: c.email, isSystem: true });
    rows.push({ channel: 'WHATSAPP', category: c.category, title: c.title, body: c.whatsapp, isSystem: true });
  });

  await prisma.messageTemplate.createMany({ data: rows });
  console.log(`Seeded ${rows.length} system message templates (${CATEGORIES.length} categories x 3 channels).`);
  await prisma.$disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
