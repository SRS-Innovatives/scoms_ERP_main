/**
 * Real AI Tutor Provider — OpenAI Chat Completions, following the exact same real/
 * simulated pattern as utils/notifications.js: when Super Admin hasn't configured a real
 * API key yet, every call is clearly logged and returned as SIMULATED (zero cost, an
 * honest placeholder answer) rather than either crashing or silently pretending to work.
 */
const prisma = require('../database/client');
const logger = require('./logger');

// Approximate published OpenAI per-1M-token pricing (USD) for the models this platform
// offers. Used only to estimate cost for the Super Admin usage dashboard — not billed
// directly to anyone; update here if OpenAI's pricing changes.
const MODEL_PRICING_PER_MILLION = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
};

const estimateCost = (model, promptTokens, completionTokens) => {
  const pricing = MODEL_PRICING_PER_MILLION[model] || MODEL_PRICING_PER_MILLION['gpt-4o-mini'];
  return Number(((promptTokens / 1_000_000) * pricing.input + (completionTokens / 1_000_000) * pricing.output).toFixed(6));
};

const getAiSettings = () => prisma.platformAiSettings.findUnique({ where: { id: 'singleton' } });

/**
 * Ask the configured AI model a question, optionally grounded in `context` (real textbook
 * content, for the RAG tutor). Returns real token counts and cost from OpenAI's own
 * response when a real key is set; a clearly-labeled simulated reply otherwise.
 */
const askAi = async ({ systemPrompt, userPrompt }) => {
  const settings = await getAiSettings();
  const model = settings?.model || 'gpt-4o-mini';
  const temperature = settings?.temperature ?? 0.3;
  const apiKey = settings?.apiKey;

  const isMockMode = !apiKey || apiKey.trim().length < 10;

  if (isMockMode) {
    logger.info('🤖 [SIMULATED AI RESPONSE] No real OpenAI API key configured (Super Admin → AI Configuration).');
    const answer = "I'd love to help, but the school's AI Tutor isn't connected to a real AI provider yet — your Super Admin needs to add an OpenAI API key under AI Configuration. Once that's done, I'll answer using your actual textbook content.";
    return {
      answer,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUSD: 0,
      provider: 'Simulated (no API key configured)',
      simulated: true,
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error(`OpenAI API error (${response.status}): ${errBody}`);
      return {
        answer: "The AI Tutor couldn't reach OpenAI right now — please try again in a moment. If this keeps happening, ask your Super Admin to check the AI Configuration API key.",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUSD: 0,
        provider: 'OpenAI (error)',
        simulated: false,
        error: true,
      };
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || 'No response generated.';
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;
    const totalTokens = data.usage?.total_tokens || promptTokens + completionTokens;

    return {
      answer,
      promptTokens,
      completionTokens,
      totalTokens,
      costUSD: estimateCost(model, promptTokens, completionTokens),
      provider: `OpenAI (${model})`,
      simulated: false,
    };
  } catch (err) {
    logger.error('Failed to call OpenAI:', err);
    return {
      answer: "The AI Tutor is temporarily unavailable — please try again shortly.",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUSD: 0,
      provider: 'OpenAI (unreachable)',
      simulated: false,
      error: true,
    };
  }
};

module.exports = { askAi, getAiSettings, estimateCost };
