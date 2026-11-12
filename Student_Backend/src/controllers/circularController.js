/**
 * Student / Parent — read-only Official Circulars. A student sees ALL + STUDENTS, a parent
 * sees ALL + PARENTS.
 */
const { sendSuccess, circularReader, ROLES } = require('../../../shared');

const audienceOf = (req) => (req.user.role === ROLES.PARENT ? 'PARENTS' : 'STUDENTS');

const getCirculars = async (req, res, next) => {
  try {
    return sendSuccess(res, await circularReader.list(req.institutionId, audienceOf(req)), 'Circulars retrieved');
  } catch (err) {
    next(err);
  }
};

const getCircular = async (req, res, next) => {
  try {
    return sendSuccess(res, await circularReader.getOne(req.institutionId, audienceOf(req), req.params.id), 'Circular retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getCirculars, getCircular };
