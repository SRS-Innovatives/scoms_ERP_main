/**
 * Super Admin AI Usage Controller
 */
const { sendSuccess } = require('../../../shared');

const getAiUsage = async (req, res, next) => {
  try {
    const aiStats = {
      totalTokens: 14500000,
      totalCostUSD: 145.20,
      provider: "OpenAI GPT-4o / Google Gemini 1.5 Pro",
      activeModules: ["Question Generator", "AI Assistant", "Report Generator"]
    };
    
    return sendSuccess(res, aiStats, 'AI usage retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAiUsage
};
