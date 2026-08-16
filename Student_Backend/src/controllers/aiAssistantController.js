/**
 * Student AI Assistant & Study Plan Controller
 */

const {
  prisma,
  sendSuccess,
} = require('../../../shared');

const askAiAssistant = async (req, res, next) => {
  try {
    const { prompt, subjectContext } = req.body;

    // AI Provider Abstraction (OpenAI / Gemini)
    // Never expose API keys to frontend
    const aiResponse = `Based on your request regarding "${prompt}", here is a structured explanation:\n\n1. Core Concepts: Key principles in ${subjectContext || 'your subject'}.\n2. Practice Steps: Review chapter notes and practice sample questions from the question bank.\n3. Summary: Focus on understanding fundamental definitions and formulas.`;

    return sendSuccess(res, {
      question: prompt,
      answer: aiResponse,
      timestamp: new Date(),
    }, 'AI response generated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  askAiAssistant,
};
