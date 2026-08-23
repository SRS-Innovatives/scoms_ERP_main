/**
 * Super Admin SMS Controller
 */
const { sendSuccess } = require('../../../shared');

const getSmsStats = async (req, res, next) => {
  try {
    const smsStats = [
      { id: 1, provider: "Twilio", totalSent: 45000, delivered: 44500, failed: 500, status: "Active" },
      { id: 2, provider: "Msg91", totalSent: 120000, delivered: 118000, failed: 2000, status: "Active" }
    ];
    
    return sendSuccess(res, smsStats, 'SMS stats retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSmsStats
};
