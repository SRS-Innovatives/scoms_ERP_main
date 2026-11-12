/**
 * Staff — read-only Official Circulars (audience ALL or STAFF), published by the Institute Admin.
 */
const { sendSuccess, circularReader } = require('../../../shared');

const getCirculars = async (req, res, next) => {
  try {
    return sendSuccess(res, await circularReader.list(req.institutionId, 'STAFF'), 'Circulars retrieved');
  } catch (err) {
    next(err);
  }
};

const getCircular = async (req, res, next) => {
  try {
    return sendSuccess(res, await circularReader.getOne(req.institutionId, 'STAFF', req.params.id), 'Circular retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getCirculars, getCircular };
