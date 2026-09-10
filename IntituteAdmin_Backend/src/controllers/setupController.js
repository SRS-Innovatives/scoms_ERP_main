/**
 * Academic Setup Controller (Academic Years, Departments, Courses, Semesters, Sections, Subjects)
 */

const {
  prisma,
  sendSuccess,
  NotFoundError,
  BusinessRuleError,
} = require('../../../shared');

// ============================================================
// Academic Years
// ============================================================
const getAcademicYears = async (req, res, next) => {
  try {
    const academicYears = await prisma.academicYear.findMany({
      where: { institutionId: req.institutionId },
      orderBy: { startDate: 'desc' },
    });
    return sendSuccess(res, academicYears, 'Academic Years retrieved');
  } catch (err) {
    next(err);
  }
};

const createAcademicYear = async (req, res, next) => {
  try {
    const { yearName, startDate, endDate, isCurrent } = req.body;

    const academicYear = await prisma.$transaction(async (tx) => {
      if (isCurrent) {
        await tx.academicYear.updateMany({
          where: { institutionId: req.institutionId, isCurrent: true },
          data: { isCurrent: false },
        });
      }
      return tx.academicYear.create({
        data: {
          institutionId: req.institutionId,
          yearName,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isCurrent: !!isCurrent,
        },
      });
    });

    return sendSuccess(res, academicYear, 'Academic Year created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateAcademicYear = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { yearName, startDate, endDate, isCurrent } = req.body;

    const existing = await prisma.academicYear.findFirst({
      where: { id, institutionId: req.institutionId },
    });
    if (!existing) throw new NotFoundError('Academic Year not found');

    const academicYear = await prisma.$transaction(async (tx) => {
      if (isCurrent) {
        await tx.academicYear.updateMany({
          where: { institutionId: req.institutionId, isCurrent: true, NOT: { id } },
          data: { isCurrent: false },
        });
      }
      return tx.academicYear.update({
        where: { id },
        data: {
          ...(yearName !== undefined && { yearName }),
          ...(startDate !== undefined && { startDate: new Date(startDate) }),
          ...(endDate !== undefined && { endDate: new Date(endDate) }),
          ...(isCurrent !== undefined && { isCurrent: !!isCurrent }),
        },
      });
    });

    return sendSuccess(res, academicYear, 'Academic Year updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteAcademicYear = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.academicYear.findFirst({
      where: { id, institutionId: req.institutionId },
      include: { _count: { select: { semesters: true } } },
    });
    if (!existing) throw new NotFoundError('Academic Year not found');
    if (existing._count.semesters > 0) {
      throw new BusinessRuleError('Cannot delete an Academic Year with existing semesters linked to it');
    }
    await prisma.academicYear.delete({ where: { id } });
    return sendSuccess(res, null, 'Academic Year deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Departments
// ============================================================
const getDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { institutionId: req.institutionId },
      include: { _count: { select: { courses: true, staff: true, students: true } } },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, departments, 'Departments retrieved');
  } catch (err) {
    next(err);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const department = await prisma.department.create({
      data: {
        institutionId: req.institutionId,
        code,
        name,
        description,
      },
    });
    return sendSuccess(res, department, 'Department created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, description } = req.body;

    const existing = await prisma.department.findFirst({
      where: { id, institutionId: req.institutionId },
    });
    if (!existing) throw new NotFoundError('Department not found');

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });
    return sendSuccess(res, department, 'Department updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.department.findFirst({
      where: { id, institutionId: req.institutionId },
      include: { _count: { select: { courses: true, staff: true, students: true } } },
    });
    if (!existing) throw new NotFoundError('Department not found');
    if (existing._count.courses > 0 || existing._count.staff > 0 || existing._count.students > 0) {
      throw new BusinessRuleError('Cannot delete a Department with existing courses, staff, or students linked to it');
    }
    await prisma.department.delete({ where: { id } });
    return sendSuccess(res, null, 'Department deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Courses
// ============================================================
const getCourses = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const courses = await prisma.course.findMany({
      where: {
        institutionId: req.institutionId,
        ...(departmentId && { departmentId }),
      },
      include: { department: true, _count: { select: { students: true, subjects: true } } },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, courses, 'Courses retrieved');
  } catch (err) {
    next(err);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { departmentId, code, name, durationYears } = req.body;

    const department = await prisma.department.findFirst({
      where: { id: departmentId, institutionId: req.institutionId },
    });
    if (!department) throw new NotFoundError('Department not found or access denied');

    const course = await prisma.course.create({
      data: {
        institutionId: req.institutionId,
        departmentId,
        code,
        name,
        durationYears: Number(durationYears) || 1,
      },
    });
    return sendSuccess(res, course, 'Course created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { departmentId, code, name, durationYears } = req.body;

    const existing = await prisma.course.findFirst({
      where: { id, institutionId: req.institutionId },
    });
    if (!existing) throw new NotFoundError('Course not found');

    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: departmentId, institutionId: req.institutionId },
      });
      if (!department) throw new NotFoundError('Department not found or access denied');
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(departmentId !== undefined && { departmentId }),
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(durationYears !== undefined && { durationYears: Number(durationYears) }),
      },
    });
    return sendSuccess(res, course, 'Course updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.course.findFirst({
      where: { id, institutionId: req.institutionId },
      include: { _count: { select: { students: true, subjects: true, semesters: true } } },
    });
    if (!existing) throw new NotFoundError('Course not found');
    if (existing._count.students > 0 || existing._count.subjects > 0 || existing._count.semesters > 0) {
      throw new BusinessRuleError('Cannot delete a Course with existing semesters, subjects, or students linked to it');
    }
    await prisma.course.delete({ where: { id } });
    return sendSuccess(res, null, 'Course deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Semesters
// ============================================================
const getSemesters = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const semesters = await prisma.semester.findMany({
      where: {
        ...(courseId && { courseId }),
        course: { institutionId: req.institutionId }, // Enforce tenant isolation via relation
      },
      include: { course: true, academicYear: true, _count: { select: { sections: true } } },
      orderBy: { semesterNumber: 'asc' },
    });
    return sendSuccess(res, semesters, 'Semesters retrieved');
  } catch (err) {
    next(err);
  }
};

const createSemester = async (req, res, next) => {
  try {
    const { courseId, academicYearId, name, semesterNumber } = req.body;

    // Verify course belongs to tenant
    const course = await prisma.course.findFirst({
      where: { id: courseId, institutionId: req.institutionId },
    });
    if (!course) throw new NotFoundError('Course not found or access denied');

    const academicYear = await prisma.academicYear.findFirst({
      where: { id: academicYearId, institutionId: req.institutionId },
    });
    if (!academicYear) throw new NotFoundError('Academic Year not found or access denied');

    const semester = await prisma.semester.create({
      data: {
        courseId,
        academicYearId,
        name,
        semesterNumber: Number(semesterNumber),
      },
    });
    return sendSuccess(res, semester, 'Semester created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateSemester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, semesterNumber, academicYearId } = req.body;

    const existing = await prisma.semester.findFirst({
      where: { id, course: { institutionId: req.institutionId } },
    });
    if (!existing) throw new NotFoundError('Semester not found');

    if (academicYearId) {
      const academicYear = await prisma.academicYear.findFirst({
        where: { id: academicYearId, institutionId: req.institutionId },
      });
      if (!academicYear) throw new NotFoundError('Academic Year not found or access denied');
    }

    const semester = await prisma.semester.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(semesterNumber !== undefined && { semesterNumber: Number(semesterNumber) }),
        ...(academicYearId !== undefined && { academicYearId }),
      },
    });
    return sendSuccess(res, semester, 'Semester updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteSemester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.semester.findFirst({
      where: { id, course: { institutionId: req.institutionId } },
      include: { _count: { select: { sections: true } } },
    });
    if (!existing) throw new NotFoundError('Semester not found');
    if (existing._count.sections > 0) {
      throw new BusinessRuleError('Cannot delete a Semester with existing sections linked to it');
    }
    await prisma.semester.delete({ where: { id } });
    return sendSuccess(res, null, 'Semester deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Sections
// ============================================================
const getSections = async (req, res, next) => {
  try {
    const { semesterId } = req.query;
    const sections = await prisma.section.findMany({
      where: {
        ...(semesterId && { semesterId }),
        semester: { course: { institutionId: req.institutionId } }, // Tenant isolation
      },
      include: {
        semester: { include: { course: true } },
        _count: { select: { students: true } },
        classTeacher: { select: { id: true, firstName: true, lastName: true, employeeCode: true, user: { select: { email: true } } } },
      },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, sections, 'Sections retrieved');
  } catch (err) {
    next(err);
  }
};

const createSection = async (req, res, next) => {
  try {
    const { semesterId, name, capacity } = req.body;

    // Verify semester belongs to tenant
    const semester = await prisma.semester.findFirst({
      where: { id: semesterId, course: { institutionId: req.institutionId } },
    });
    if (!semester) throw new NotFoundError('Semester not found or access denied');

    const section = await prisma.section.create({
      data: {
        semesterId,
        name,
        capacity: Number(capacity) || 60,
      },
    });
    return sendSuccess(res, section, 'Section created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, capacity, classTeacherId } = req.body;

    const existing = await prisma.section.findFirst({
      where: { id, semester: { course: { institutionId: req.institutionId } } },
    });
    if (!existing) throw new NotFoundError('Section not found');

    // classTeacherId is optional on this general update, but when it IS present (including
    // explicit null, to unassign) it must resolve to real teaching staff of this tenant —
    // never a raw id trusted from the request body.
    if (classTeacherId !== undefined && classTeacherId !== null) {
      const teacher = await prisma.staff.findFirst({ where: { id: classTeacherId, institutionId: req.institutionId } });
      if (!teacher) throw new NotFoundError('Selected class teacher not found or access denied');
    }

    const section = await prisma.section.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(classTeacherId !== undefined && { classTeacherId: classTeacherId || null }),
      },
      include: { classTeacher: { select: { id: true, firstName: true, lastName: true } } },
    });
    return sendSuccess(res, section, 'Section updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.section.findFirst({
      where: { id, semester: { course: { institutionId: req.institutionId } } },
      include: { _count: { select: { students: true } } },
    });
    if (!existing) throw new NotFoundError('Section not found');
    if (existing._count.students > 0) {
      throw new BusinessRuleError('Cannot delete a Section with students enrolled in it');
    }
    await prisma.section.delete({ where: { id } });
    return sendSuccess(res, null, 'Section deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Subjects
// ============================================================
const getSubjects = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const subjects = await prisma.subject.findMany({
      where: {
        ...(courseId && { courseId }),
        course: { institutionId: req.institutionId },
      },
      include: { course: true },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, subjects, 'Subjects retrieved');
  } catch (err) {
    next(err);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { courseId, code, name, type, credits } = req.body;

    const course = await prisma.course.findFirst({
      where: { id: courseId, institutionId: req.institutionId },
    });
    if (!course) throw new NotFoundError('Course not found or access denied');

    const subject = await prisma.subject.create({
      data: {
        courseId,
        code,
        name,
        type: type || 'THEORY',
        credits: Number(credits) || 3,
      },
    });
    return sendSuccess(res, subject, 'Subject created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, type, credits } = req.body;

    const existing = await prisma.subject.findFirst({
      where: { id, course: { institutionId: req.institutionId } },
    });
    if (!existing) throw new NotFoundError('Subject not found');

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(credits !== undefined && { credits: Number(credits) }),
      },
    });
    return sendSuccess(res, subject, 'Subject updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.subject.findFirst({
      where: { id, course: { institutionId: req.institutionId } },
    });
    if (!existing) throw new NotFoundError('Subject not found');
    await prisma.subject.delete({ where: { id } });
    return sendSuccess(res, null, 'Subject deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
};
