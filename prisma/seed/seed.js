/**
 * Database Seeder for SCOMS Platform
 * Populates PostgreSQL DB with realistic Indian School/College data
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SCOMS Database Seeding...');

  const hashedPassword = await bcrypt.hash('Password@123', 10);

  // 1. Create Super Admin User
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@scoms.in' },
    update: {},
    create: {
      email: 'superadmin@scoms.in',
      mobile: '+919876543210',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Super Admin created:', superAdminUser.email);

  // 2. Create Demo Institutions
  const demoSchool = await prisma.institution.upsert({
    where: { code: 'SCH-DELHI-001' },
    update: {},
    create: {
      code: 'SCH-DELHI-001',
      name: 'Delhi Public International School',
      type: 'SCHOOL',
      board: 'CBSE',
      email: 'info@dpis-delhi.edu.in',
      phone: '+911123456789',
      address: 'Sector 14, Dwarka',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110075',
      principalName: 'Dr. Rajesh Sharma',
      establishedYear: 1998,
      status: 'ACTIVE',
    },
  });

  const demoCollege = await prisma.institution.upsert({
    where: { code: 'COL-MUMBAI-001' },
    update: {},
    create: {
      code: 'COL-MUMBAI-001',
      name: 'St. Xavier Engineering & Technology College',
      type: 'COLLEGE',
      university: 'Mumbai University',
      affiliation: 'AICTE Approved',
      email: 'contact@stxavier-tech.edu.in',
      phone: '+912228901234',
      address: 'Mahim West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400016',
      principalName: 'Prof. Ananya Roy',
      establishedYear: 1985,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Demo Institutions created:', demoSchool.name, 'and', demoCollege.name);

  // 3. Create Institute Admin for School
  const schoolAdminUser = await prisma.user.upsert({
    where: { email: 'admin@dpis-delhi.edu.in' },
    update: {},
    create: {
      institutionId: demoSchool.id,
      email: 'admin@dpis-delhi.edu.in',
      mobile: '+919811122233',
      password: hashedPassword,
      role: 'INSTITUTE_ADMIN',
      status: 'ACTIVE',
    },
  });

  // 4. Create Academic Year for School
  const academicYear = await prisma.academicYear.upsert({
    where: {
      institutionId_yearName: {
        institutionId: demoSchool.id,
        yearName: '2025-2026',
      },
    },
    update: {},
    create: {
      institutionId: demoSchool.id,
      yearName: '2025-2026',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isCurrent: true,
    },
  });

  // 5. Create Departments & Courses
  const deptScience = await prisma.department.upsert({
    where: {
      institutionId_code: {
        institutionId: demoSchool.id,
        code: 'SCI',
      },
    },
    update: {},
    create: {
      institutionId: demoSchool.id,
      code: 'SCI',
      name: 'Science Department',
      description: 'Department of Physics, Chemistry, Biology, Mathematics',
    },
  });

  const courseClass10 = await prisma.course.upsert({
    where: {
      institutionId_code: {
        institutionId: demoSchool.id,
        code: 'CLASS-10',
      },
    },
    update: {},
    create: {
      institutionId: demoSchool.id,
      departmentId: deptScience.id,
      code: 'CLASS-10',
      name: 'Class 10th CBSE',
      durationYears: 1,
    },
  });

  const semesterTerm1 = await prisma.semester.upsert({
    where: {
      courseId_semesterNumber_academicYearId: {
        courseId: courseClass10.id,
        semesterNumber: 1,
        academicYearId: academicYear.id,
      },
    },
    update: {},
    create: {
      courseId: courseClass10.id,
      academicYearId: academicYear.id,
      name: 'Term 1',
      semesterNumber: 1,
    },
  });

  const sectionA = await prisma.section.create({
    data: {
      semesterId: semesterTerm1.id,
      name: 'Section A',
      capacity: 40,
    },
  });

  // 6. Create Teacher Staff
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@dpis-delhi.edu.in' },
    update: {},
    create: {
      institutionId: demoSchool.id,
      email: 'teacher@dpis-delhi.edu.in',
      mobile: '+919822233344',
      employeeCode: 'EMP-2025-0001',
      password: hashedPassword,
      role: 'TEACHER',
      status: 'ACTIVE',
    },
  });

  const teacherStaff = await prisma.staff.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      institutionId: demoSchool.id,
      employeeCode: 'EMP-2025-0001',
      departmentId: deptScience.id,
      designation: 'Senior PGT Physics Teacher',
      qualification: 'M.Sc Physics, B.Ed',
      experience: '8 Years',
    },
  });

  // 7. Create Student
  const studentUser = await prisma.user.upsert({
    where: { email: 'arun.kumar@student.dpis.edu.in' },
    update: {},
    create: {
      institutionId: demoSchool.id,
      email: 'arun.kumar@student.dpis.edu.in',
      mobile: '+919833344455',
      admissionNumber: 'ADM/2025/00001',
      password: hashedPassword,
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });

  const studentRecord = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      institutionId: demoSchool.id,
      admissionNumber: 'ADM/2025/00001',
      rollNumber: '1001',
      firstName: 'Arun',
      lastName: 'Kumar',
      dob: new Date('2010-05-15'),
      gender: 'MALE',
      bloodGroup: 'O+',
      email: 'arun.kumar@student.dpis.edu.in',
      phone: '+919833344455',
      departmentId: deptScience.id,
      courseId: courseClass10.id,
      semesterId: semesterTerm1.id,
      sectionId: sectionA.id,
    },
  });

  // 8. Create Parent
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent.kumar@dpis.edu.in' },
    update: {},
    create: {
      institutionId: demoSchool.id,
      email: 'parent.kumar@dpis.edu.in',
      mobile: '+919844455566',
      password: hashedPassword,
      role: 'PARENT',
      status: 'ACTIVE',
    },
  });

  const parentRecord = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      userId: parentUser.id,
      fatherName: 'Suresh Kumar',
      fatherOccupation: 'Government Servant',
      fatherPhone: '+919844455566',
      motherName: 'Sunita Kumar',
      motherOccupation: 'Homemaker',
    },
  });

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parentRecord.id,
        studentId: studentRecord.id,
      },
    },
    update: {},
    create: {
      parentId: parentRecord.id,
      studentId: studentRecord.id,
      relation: 'FATHER',
    },
  });

  // 9. Create Fee Structure & Assignment
  const feeStructure = await prisma.feeStructure.create({
    data: {
      institutionId: demoSchool.id,
      academicYearId: academicYear.id,
      courseId: courseClass10.id,
      name: 'Class 10th Annual Composite Fee 2025-26',
      totalAmount: 45000,
      dueDate: new Date('2025-06-30'),
    },
  });

  const feeAssignment = await prisma.studentFeeAssignment.create({
    data: {
      feeStructureId: feeStructure.id,
      studentId: studentRecord.id,
      totalAmount: 45000,
      discountAmount: 5000,
      paidAmount: 20000,
      dueAmount: 20000,
      status: 'PARTIAL',
    },
  });

  const feePayment = await prisma.feePayment.create({
    data: {
      institutionId: demoSchool.id,
      studentId: studentRecord.id,
      studentFeeAssignmentId: feeAssignment.id,
      amountPaid: 20000,
      paymentMode: 'UPI_MANUAL',
      paymentStatus: 'SUCCESS',
      transactionReference: 'UPI/2026/8948190283',
      receivedBy: 'Cashier Staff',
      remarks: 'First Installment Paid via GooglePay',
    },
  });

  await prisma.feeReceipt.create({
    data: {
      receiptNumber: 'SCH-DELHI-001/2026/000001',
      institutionId: demoSchool.id,
      studentId: studentRecord.id,
      paymentId: feePayment.id,
      amount: 20000,
    },
  });

  console.log('✅ Demo Academic structure, Teacher, Student, Parent, Fees & Receipts seeded successfully!');
  console.log('🎉 SCOMS Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
