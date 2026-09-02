/**
 * Institute Admin — Own Institution Profile Controller
 *
 * An institute admin may edit their own contact/address details, but never their
 * identity fields (name, code, type) — those stay Super-Admin-controlled.
 */
const { prisma, sendSuccess } = require('../../../shared');

const EDITABLE_FIELDS = ['email', 'phone', 'website', 'address', 'city', 'district', 'state', 'pincode', 'affiliation', 'board', 'university', 'principalName', 'establishedYear', 'logo'];

const updateProfile = async (req, res, next) => {
  try {
    const data = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }

    const institution = await prisma.institution.update({
      where: { id: req.institutionId },
      data,
    });

    return sendSuccess(res, institution, 'Institution profile updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { updateProfile };
