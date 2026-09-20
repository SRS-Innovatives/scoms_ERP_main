/**
 * Blocks a small, deliberate set of actions that only make sense as the student acting
 * for themselves — submitting their own homework, their own anonymous course feedback,
 * their own job application. A parent can view all of this, and can act on their child's
 * behalf almost everywhere else (pay fees, apply leave, request a certificate), but these
 * few cross into impersonation or break an integrity promise (anonymity, authorship) the
 * feature depends on.
 */
const { AuthorizationError } = require('../errors/customErrors');
const { ROLES } = require('../constants/roles');

const blockParentWrite = (action) => (req, res, next) => {
  if (req.user?.role === ROLES.PARENT) {
    return next(new AuthorizationError(`${action} can only be done by the student themselves, not a parent account.`));
  }
  next();
};

module.exports = blockParentWrite;
