/**
 * Reusable Zod Validation Schemas for SCOMS
 */

const { z } = require('zod');

// Common fields
const emailSchema = z.string().email('Invalid email address');
const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits').max(15);
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

// Auth Schemas
const loginSchema = z.object({
  email: z.string().email().optional(),
  mobile: z.string().optional(),
  admissionNumber: z.string().optional(),
  password: passwordSchema,
}).refine((data) => data.email || data.mobile || data.admissionNumber, {
  message: 'Either email, mobile, or admissionNumber must be provided',
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: passwordSchema,
});

const otpVerifySchema = z.object({
  mobile: phoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Institution Onboarding Schema
const createInstitutionSchema = z.object({
  name: z.string().min(3, 'Institution name must be at least 3 characters'),
  code: z.string().min(2, 'Institution code is required'),
  type: z.enum(['SCHOOL', 'COLLEGE', 'UNIVERSITY', 'POLYTECHNIC']),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6),
  principalName: z.string().optional(),
});

// Student Creation Schema
const createStudentSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  email: emailSchema,
  phone: phoneSchema.optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dob: z.string(),
  admissionNumber: z.string().optional(),
  rollNumber: z.string().optional(),
  departmentId: z.string().optional(),
  courseId: z.string().optional(),
  semesterId: z.string().optional(),
  sectionId: z.string().optional(),
});

// Staff Creation Schema
const createStaffSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  email: emailSchema,
  phone: phoneSchema,
  employeeCode: z.string().optional(),
  departmentId: z.string().optional(),
  designation: z.string().min(2),
  qualification: z.string().optional(),
  role: z.string(),
});

// Attendance Marking Schema
const markAttendanceSchema = z.object({
  sectionId: z.string().min(1),
  subjectId: z.string().optional(),
  date: z.string(),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HALF_DAY', 'ON_DUTY']),
      remarks: z.string().optional(),
    })
  ),
});

// Fee Structure Schema
const createFeeStructureSchema = z.object({
  name: z.string().min(2),
  academicYearId: z.string().min(1),
  courseId: z.string().optional(),
  dueDate: z.string(),
  totalAmount: z.number().positive(),
  components: z.array(
    z.object({
      category: z.string(),
      amount: z.number().positive(),
    })
  ),
});

// Fee Collection Schema
const collectFeeSchema = z.object({
  studentId: z.string().min(1),
  assignmentId: z.string().min(1),
  amountPaid: z.number().positive(),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'DD', 'BANK_TRANSFER', 'UPI_MANUAL', 'RAZORPAY', 'ONLINE_CARD', 'OTHER']),
  paymentReference: z.string().optional(),
  bankName: z.string().optional(),
  chequeNumber: z.string().optional(),
  remarks: z.string().optional(),
});

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  otpVerifySchema,
  createInstitutionSchema,
  createStudentSchema,
  createStaffSchema,
  markAttendanceSchema,
  createFeeStructureSchema,
  collectFeeSchema,
};
