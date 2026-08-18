/**
 * Academic Setup Controller (Departments, Courses, Semesters, Sections, Subjects)
 */

const {
  prisma,
  sendSuccess,
  sendPaginated,
} = require('../../../shared');

// Academic Years
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
    const academicYear = await prisma.academicYear.create({
      data: {
        institutionId: req.institutionId,
        yearName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: isCurrent || false,
      },
    });
    return sendSuccess(res, academicYear, 'Academic Year created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// Departments
const getDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { institutionId: req.institutionId },
      include: { _count: { select: { courses: true, staff: true, students: true } } },
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

// Semesters
const getSemesters = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const where = courseId ? { courseId } : {};
    
    const semesters = await prisma.semester.findMany({
      where: {
        ...where,
        course: { institutionId: req.institutionId } // Enforce tenant isolation via relation
      },
      include: { course: true, _count: { select: { sections: true } } },
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
      where: { id: courseId, institutionId: req.institutionId }
    });
    if (!course) throw new Error('Course not found or access denied');
    
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

// Sections
const getSections = async (req, res, next) => {
  try {
    const { semesterId } = req.query;
    const where = semesterId ? { semesterId } : {};
    
    const sections = await prisma.section.findMany({
      where: {
        ...where,
        semester: { course: { institutionId: req.institutionId } } // Tenant isolation
      },
      include: { semester: true, _count: { select: { students: true } } },
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
      where: { id: semesterId, course: { institutionId: req.institutionId } }
    });
    if (!semester) throw new Error('Semester not found or access denied');
    
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

// Subjects
const getSubjects = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const where = courseId ? { courseId } : {};
    
    const subjects = await prisma.subject.findMany({
      where: {
        ...where,
        course: { institutionId: req.institutionId }
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
      where: { id: courseId, institutionId: req.institutionId }
    });
    if (!course) throw new Error('Course not found or access denied');
    
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
const getCourses = async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: { institutionId: req.institutionId },
      include: { department: true, _count: { select: { students: true, subjects: true } } },
    });
    return sendSuccess(res, courses, 'Courses retrieved');
  } catch (err) {
    next(err);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { departmentId, code, name, durationYears } = req.body;
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

module.exports = {
  getAcademicYears,
  createAcademicYear,
  getDepartments,
  createDepartment,
  getCourses,
  createCourse,
  getSemesters,
  createSemester,
  getSections,
  createSection,
  getSubjects,
  createSubject,
};
