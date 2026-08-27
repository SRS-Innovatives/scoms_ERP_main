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

    // Log real usage so the Super Admin AI Usage dashboard reflects actual calls
    // instead of a hardcoded number. Token/cost figures are estimated from text
    // length since no real LLM provider is wired up yet (see docs/dynamic-workflow-audit.md).
    const promptTokens = Math.ceil((prompt || '').length / 4);
    const completionTokens = Math.ceil(aiResponse.length / 4);
    const totalTokens = promptTokens + completionTokens;
    const costUSD = Number(((totalTokens / 1000) * 0.002).toFixed(6));

    prisma.aiUsageLog
      .create({
        data: {
          institutionId: req.institutionId || null,
          userId: req.user?.id || null,
          role: req.user?.role || null,
          module: 'AI_ASSISTANT',
          promptTokens,
          completionTokens,
          totalTokens,
          costUSD,
        },
      })
      .catch((err) => console.error('Error logging AI usage:', err));

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
