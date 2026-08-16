/**
 * Academic Setup Controller (Departments, Courses, Semesters, Sections, Subjects)
 */

const {
  prisma,
  sendSuccess,
  sendPaginated,
} = require('../../../shared');

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

// Courses
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
  getDepartments,
  createDepartment,
  getCourses,
  createCourse,
};
