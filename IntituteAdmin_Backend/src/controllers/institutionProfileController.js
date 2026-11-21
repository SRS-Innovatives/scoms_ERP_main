/**
 * Institute Admin — Own Institution Profile Controller
 *
 * An institute admin may edit their own contact/address details, but never their
 * identity fields (name, code, type) — those stay Super-Admin-controlled.
 */
const { prisma, sendSuccess } = require('../../../shared');
const { isMediaUrl } = require('../../../shared/media/mediaUrl');

const EDITABLE_FIELDS = ['email', 'phone', 'website', 'address', 'city', 'district', 'state', 'pincode', 'affiliation', 'board', 'university', 'principalName', 'establishedYear', 'logo'];

const updateProfile = async (req, res, next) => {
  try {
    const data = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    // The form sends back the logo URL this API handed out when the logo wasn't changed —
    // that means "keep the current logo", never "store this URL as the logo"
    if (isMediaUrl(data.logo)) delete data.logo;

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
