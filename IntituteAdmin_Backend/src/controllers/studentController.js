/**
 * Institute Admin Student Management Controller
 */

const ExcelJS = require('exceljs');
const { Readable } = require('stream');
const {
  prisma,
  sendSuccess,
  sendPaginated,
  hashPassword,
  generateAdmissionNumber,
  ROLES,
  sendEmailNotification,
  sendSMSNotification,
  NotFoundError,
  ValidationError,
} = require('../../../shared');

const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', departmentId, courseId, sectionId } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      institutionId: req.institutionId,
      ...(departmentId && { departmentId }),
      ...(courseId && { courseId }),
      ...(sectionId && { sectionId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { admissionNumber: { contains: search, mode: 'insensitive' } },
          { rollNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: {
          course: { select: { name: true, code: true } },
          department: { select: { name: true } },
          section: { select: { name: true, semester: { select: { name: true } } } },
          user: { select: { avatar: true } },
          feeAssignments: { select: { status: true, scholarshipName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    // Real, computed — never fabricated: overall fee status across all of a student's fee
    // assignments, and their scholarship name if any assignment carries one.
    const withComputed = students.map((s) => {
      const feeStatus = s.feeAssignments.length === 0
        ? 'No Fees Assigned'
        : s.feeAssignments.some((a) => a.status === 'PENDING' || a.status === 'PARTIAL')
          ? 'Pending'
          : 'Paid';
      const scholarship = s.feeAssignments.find((a) => a.scholarshipName)?.scholarshipName || 'None';
      return { ...s, feeStatus, scholarship, feeAssignments: undefined };
    });

    return sendPaginated(res, withComputed, page, limit, total, 'Students retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Core admission logic shared by single admission and bulk (Excel) admission.
 * Runs entirely inside the caller's transaction — creates User + Student (+ Parent if
 * details given) + Audit Log. Throws on any validation/uniqueness failure so the
 * caller's transaction rolls back cleanly for that one student.
 */
const admitStudentWithinTx = async (tx, institutionId, actingUserId, data) => {
  const {
    firstName, lastName, dob, gender, bloodGroup, email, phone,
    address, city, state, pincode,
    fatherName, motherName, guardianName, parentPhone, parentEmail,
    departmentId, courseId, semesterId, sectionId, rollNumber, password,
  } = data;

  if (!firstName || !lastName) throw new ValidationError('firstName and lastName are required');
  if (!email) throw new ValidationError('email is required');
  if (!dob || isNaN(new Date(dob).getTime())) throw new ValidationError('A valid dob is required');

  // 1. Validate Academic setup belongs to Tenant
  if (sectionId) {
    const section = await tx.section.findFirst({
      where: { id: sectionId, semester: { course: { institutionId } } }
    });
    if (!section) throw new NotFoundError('Invalid section or access denied');
  }

  // 2. Generate admission number (sequential, tenant-scoped)
  const count = await tx.student.count({ where: { institutionId } });
  const year = new Date().getFullYear();
  const paddedCount = String(count + 1).padStart(6, '0');
  const admissionNumber = `SCOMS/${year}/${paddedCount}`;

  // 3. Create User Login
  const hashedPassword = await hashPassword(password || 'Student@123');
  const user = await tx.user.create({
    data: {
      institutionId,
      email,
      mobile: phone,
      admissionNumber,
      password: hashedPassword,
      role: ROLES.STUDENT,
      status: 'ACTIVE',
    },
  });

  // 4. Create Student
  const student = await tx.student.create({
    data: {
      userId: user.id,
      institutionId,
      admissionNumber,
      rollNumber,
      firstName,
      lastName,
      dob: new Date(dob),
      gender: gender || 'OTHER',
      bloodGroup,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      departmentId,
      courseId,
      semesterId,
      sectionId,
    },
  });

  // 5. Create Parent User (optional)
  if (fatherName || motherName || guardianName) {
    const parentPassword = await hashPassword('Parent@123');
    const parentUser = await tx.user.create({
      data: {
        institutionId,
        email: parentEmail || `parent.${admissionNumber.replace(/\//g, '')}@scoms.edu.in`,
        mobile: parentPhone,
        password: parentPassword,
        role: ROLES.PARENT,
        status: 'ACTIVE',
      }
    });

    const parent = await tx.parent.create({
      data: {
        userId: parentUser.id,
        fatherName,
        motherName,
        guardianName,
        fatherPhone: parentPhone,
        address,
      }
    });

    await tx.parentStudent.create({
      data: {
        parentId: parent.id,
        studentId: student.id,
        relation: fatherName ? 'FATHER' : (motherName ? 'MOTHER' : 'GUARDIAN')
      }
    });
  }

  // 6. Create Audit Log
  await tx.auditLog.create({
    data: {
      institutionId,
      userId: actingUserId,
      action: 'CREATE',
      module: 'STUDENT',
      entity: 'Student',
      entityId: student.id,
      newValues: JSON.stringify({ admissionNumber: student.admissionNumber }),
    }
  });

  return { student, user };
};

const createStudentAdmission = async (req, res, next) => {
  try {
    const {
      firstName, lastName, dob, gender, bloodGroup, email, phone,
      address, city, state, pincode,
      fatherName, motherName, guardianName, parentPhone, parentEmail,
      departmentId, courseId, semesterId, sectionId, rollNumber, password,
    } = req.body;

    const result = await prisma.$transaction((tx) =>
      admitStudentWithinTx(tx, req.institutionId, req.user.id, {
        firstName, lastName, dob, gender, bloodGroup, email, phone,
        address, city, state, pincode,
        fatherName, motherName, guardianName, parentPhone, parentEmail,
        departmentId, courseId, semesterId, sectionId, rollNumber, password,
      })
    );

    // Send email & SMS notifications to student with credentials
    const studentPlainPassword = password || 'Student@123';
    if (email) {
      sendEmailNotification({
        to: email,
        subject: 'Welcome to SCOMS - Your Student Account Credentials',
        text: `Dear ${firstName} ${lastName},\n\nWelcome to SCOMS! Your student account has been successfully created. Here are your login credentials:\n\nLogin URL: http://localhost:5176/login\nAdmission Number: ${result.student.admissionNumber}\nEmail: ${email}\nTemporary Password: ${studentPlainPassword}\n\nPlease change your password after logging in.\n\nBest Regards,\nInstitution Administration`,
        html: `<p>Dear ${firstName} ${lastName},</p><p>Welcome to SCOMS! Your student account has been successfully created. Here are your login credentials:</p><ul><li><b>Login URL:</b> <a href="http://localhost:5176/login">http://localhost:5176/login</a></li><li><b>Admission Number:</b> ${result.student.admissionNumber}</li><li><b>Email:</b> ${email}</li><li><b>Temporary Password:</b> ${studentPlainPassword}</li></ul><p>Please change your password after logging in.</p><p>Best Regards,<br>Institution Administration</p>`,
        institutionId: req.institutionId,
        purpose: 'WELCOME_CREDENTIALS'
      }).catch(err => console.error('Error sending student welcome email:', err));
    }
    if (phone) {
      sendSMSNotification({
        to: phone,
        message: `Welcome to SCOMS! Your student account is active. Login at http://localhost:5176/login. User: ${result.student.admissionNumber}, Temp Pass: ${studentPlainPassword}`,
        institutionId: req.institutionId,
        purpose: 'WELCOME_CREDENTIALS'
      }).catch(err => console.error('Error sending student welcome SMS:', err));
    }

    return sendSuccess(res, result, 'Student admitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Bulk Admission (Excel / CSV upload)
// ============================================================

// Excel/CSV column header -> internal field name. Matched case-insensitively, ignoring
// spaces/underscores, so "First Name", "first_name", "FirstName" all resolve the same way.
const COLUMN_ALIASES = {
  firstname: 'firstName',
  lastname: 'lastName',
  gender: 'gender',
  dob: 'dob',
  dateofbirth: 'dob',
  bloodgroup: 'bloodGroup',
  email: 'email',
  phone: 'phone',
  mobile: 'phone',
  rollnumber: 'rollNumber',
  rollno: 'rollNumber',
  fathername: 'fatherName',
  mothername: 'motherName',
  guardianname: 'guardianName',
  parentphone: 'parentPhone',
  parentemail: 'parentEmail',
  address: 'address',
  city: 'city',
  state: 'state',
  pincode: 'pincode',
};

const normalizeHeader = (header) => String(header || '').trim().toLowerCase().replace(/[\s_]+/g, '');

const normalizeGender = (val) => {
  const g = String(val || '').trim().toUpperCase();
  if (g.startsWith('M')) return 'MALE';
  if (g.startsWith('F')) return 'FEMALE';
  return 'OTHER';
};

/**
 * Parses an uploaded .xlsx or .csv buffer into an array of row objects keyed by our
 * internal field names, using the first row as the header.
 */
const parseStudentRows = async (buffer, originalName) => {
  const workbook = new ExcelJS.Workbook();
  const isCsv = /\.csv$/i.test(originalName || '');

  let worksheet;
  if (isCsv) {
    worksheet = await workbook.csv.read(Readable.from(buffer));
  } else {
    await workbook.xlsx.load(buffer);
    worksheet = workbook.worksheets[0];
  }
  if (!worksheet) throw new ValidationError('Could not read any sheet from the uploaded file');

  const headerRow = worksheet.getRow(1);
  const columnMap = {}; // column index -> internal field name
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const field = COLUMN_ALIASES[normalizeHeader(cell.value)];
    if (field) columnMap[colNumber] = field;
  });

  if (Object.keys(columnMap).length === 0) {
    throw new ValidationError('No recognized columns found. Please use the provided template headers.');
  }

  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const data = {};
    let hasAnyValue = false;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const field = columnMap[colNumber];
      if (!field) return;
      let value = cell.value;
      if (value && typeof value === 'object' && value.text !== undefined) value = value.text; // rich text
      if (value !== null && value !== undefined && value !== '') hasAnyValue = true;
      data[field] = value instanceof Date ? value : (value !== null && value !== undefined ? String(value).trim() : value);
    });
    if (hasAnyValue) rows.push({ rowNumber, data });
  });

  return rows;
};

const getBulkAdmissionTemplate = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Students');
    const headers = ['First Name', 'Last Name', 'Gender', 'DOB', 'Blood Group', 'Email', 'Phone', 'Roll Number', 'Father Name', 'Mother Name', 'Parent Phone', 'Parent Email', 'Address', 'City', 'State', 'Pincode'];
    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };
    sheet.addRow(['Kavitha', 'Sharma', 'Female', '2008-06-15', 'O+', 'kavitha.sharma@example.com', '9840012345', '21CS101', 'Ramesh Sharma', 'Latha Sharma', '9440000000', '', '12 Anna Nagar', 'Chennai', 'Tamil Nadu', '600040']);
    sheet.columns.forEach((col) => { col.width = 18; });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="SCOMS_Bulk_Student_Admission_Template.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

const bulkStudentAdmission = async (req, res, next) => {
  try {
    if (!req.file) throw new ValidationError('No file uploaded. Attach an .xlsx or .csv file as "file".');

    const { departmentId, courseId, semesterId, sectionId } = req.body;
    if (!sectionId || !courseId) {
      throw new ValidationError('courseId and sectionId are required — select the class every uploaded student will be assigned to.');
    }

    // Validate the target class belongs to this tenant once, up front.
    const section = await prisma.section.findFirst({
      where: { id: sectionId, semester: { course: { institutionId: req.institutionId } } },
    });
    if (!section) throw new NotFoundError('Invalid section or access denied for this institution');

    const rows = await parseStudentRows(req.file.buffer, req.file.originalname);
    if (rows.length === 0) throw new ValidationError('The uploaded file has no data rows');
    if (rows.length > 500) throw new ValidationError('Bulk upload is limited to 500 students per file');

    const created = [];
    const failures = [];

    // Sequential on purpose: admission numbers are generated from a live count, so
    // concurrent per-row transactions could race and collide.
    for (const { rowNumber, data } of rows) {
      try {
        const result = await prisma.$transaction((tx) =>
          admitStudentWithinTx(tx, req.institutionId, req.user.id, {
            ...data,
            gender: normalizeGender(data.gender),
            departmentId: departmentId || undefined,
            courseId,
            semesterId: semesterId || undefined,
            sectionId,
          })
        );
        created.push({ rowNumber, admissionNumber: result.student.admissionNumber, name: `${data.firstName} ${data.lastName}` });
      } catch (err) {
        failures.push({ rowNumber, name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || '(unnamed)', reason: err.message || 'Unknown error' });
      }
    }

    await prisma.auditLog.create({
      data: {
        institutionId: req.institutionId,
        userId: req.user.id,
        action: 'BULK_CREATE',
        module: 'STUDENT',
        entity: 'Student',
        newValues: JSON.stringify({ sectionId, courseId, total: rows.length, created: created.length, failed: failures.length }),
      },
    }).catch(() => {});

    return sendSuccess(res, {
      total: rows.length,
      successCount: created.length,
      failedCount: failures.length,
      created,
      failures,
    }, `Bulk admission processed: ${created.length}/${rows.length} students admitted successfully`, 201);
  } catch (err) {
    next(err);
  }
};

/** Full profile — real parent, transport, and hostel data joined in, nothing fabricated. */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findFirst({
      where: { id, institutionId: req.institutionId },
      include: {
        course: { select: { name: true, code: true } },
        department: { select: { name: true } },
        section: { select: { name: true, semester: { select: { name: true } } } },
        user: { select: { avatar: true, email: true } },
        parents: { include: { parent: true } },
        feeAssignments: { select: { status: true, scholarshipName: true, scholarshipRef: true } },
        transport: { include: { route: { select: { routeName: true } } } },
        hostelBed: { include: { hostel: { select: { name: true } } } },
      },
    });
    if (!student) throw new NotFoundError('Student not found or access denied');

    const feeStatus = student.feeAssignments.length === 0
      ? 'No Fees Assigned'
      : student.feeAssignments.some((a) => a.status === 'PENDING' || a.status === 'PARTIAL')
        ? 'Pending'
        : 'Paid';
    const scholarshipRow = student.feeAssignments.find((a) => a.scholarshipName);

    return sendSuccess(res, {
      ...student,
      feeStatus,
      scholarship: scholarshipRow?.scholarshipName || 'None',
      scholarshipRef: scholarshipRow?.scholarshipRef || null,
      feeAssignments: undefined,
    }, 'Student profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Bulk-promotes selected students to a new section (e.g. next semester's section). */
const promoteStudents = async (req, res, next) => {
  try {
    const { studentIds, targetSectionId } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) throw new ValidationError('studentIds must be a non-empty array');
    if (!targetSectionId) throw new ValidationError('targetSectionId is required');

    const section = await prisma.section.findFirst({
      where: { id: targetSectionId, semester: { course: { institutionId: req.institutionId } } },
    });
    if (!section) throw new NotFoundError('Target section not found or access denied');

    const result = await prisma.student.updateMany({
      where: { id: { in: studentIds }, institutionId: req.institutionId },
      data: { sectionId: targetSectionId },
    });

    return sendSuccess(res, { promotedCount: result.count }, `${result.count} student(s) promoted successfully`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  promoteStudents,
  createStudentAdmission,
  bulkStudentAdmission,
  getBulkAdmissionTemplate,
};
