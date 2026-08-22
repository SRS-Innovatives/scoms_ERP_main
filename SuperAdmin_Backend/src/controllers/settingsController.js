/**
 * Super Admin Settings Controller
 */
const { sendSuccess } = require('../../../shared');

const getSettings = async (req, res, next) => {
  try {
    const settings = {
      appName: "SCOMS Platform",
      timezone: "Asia/Kolkata",
      currency: "INR (₹)",
      localization: "English",
      maintenanceMode: false
    };
    
    return sendSuccess(res, settings, 'Settings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings
};
