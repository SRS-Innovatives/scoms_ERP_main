/**
 * Super Admin AI Usage & Configuration Controller
 */
const { prisma, sendSuccess, ValidationError } = require('../../../shared');

const getAiUsage = async (req, res, next) => {
  try {
    const [aggregate, moduleGroups, providerGroup] = await Promise.all([
      prisma.aiUsageLog.aggregate({
        _sum: { totalTokens: true, promptTokens: true, completionTokens: true, costUSD: true },
        _count: { id: true },
      }),
      prisma.aiUsageLog.groupBy({ by: ['module'], _count: { id: true } }),
      prisma.aiUsageLog.groupBy({ by: ['provider'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 1 }),
    ]);

    const aiStats = {
      totalTokens: aggregate._sum.totalTokens || 0,
      totalCostUSD: Number((aggregate._sum.costUSD || 0).toFixed(4)),
      totalRequests: aggregate._count.id || 0,
      provider: providerGroup[0]?.provider || 'No usage recorded yet',
      activeModules: moduleGroups.map((g) => g.module),
    };

    return sendSuccess(res, aiStats, 'AI usage retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const VALID_PROVIDERS = ['openai']; // gemini/anthropic are offered in the DB enum-ish field but not wired up to a real call yet
const VALID_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

/** Never echoes the real API key back — only whether one is set, so the frontend can show
 * a genuine "Configured" / "Not Configured" status instead of a hardcoded fake one. */
const getAiConfig = async (req, res, next) => {
  try {
    const settings = await prisma.platformAiSettings.findUnique({ where: { id: 'singleton' } });
    return sendSuccess(res, {
      provider: settings?.provider || 'openai',
      model: settings?.model || 'gpt-4o-mini',
      temperature: settings?.temperature ?? 0.3,
      apiKeyConfigured: !!(settings?.apiKey && settings.apiKey.trim().length >= 10),
      updatedAt: settings?.updatedAt || null,
    }, 'AI configuration retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateAiConfig = async (req, res, next) => {
  try {
    const { provider, model, temperature, apiKey } = req.body;
    if (provider && !VALID_PROVIDERS.includes(provider)) {
      throw new ValidationError(`Only these providers are actually wired up right now: ${VALID_PROVIDERS.join(', ')}`);
    }
    if (model && !VALID_MODELS.includes(model)) {
      throw new ValidationError(`model must be one of: ${VALID_MODELS.join(', ')}`);
    }
    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
      throw new ValidationError('temperature must be between 0 and 2');
    }

    // A blank apiKey in the request means "leave the existing key alone" — never clear a
    // real, working key just because the settings form re-saved with the field masked out.
    const trimmedKey = typeof apiKey === 'string' ? apiKey.trim() : undefined;

    const settings = await prisma.platformAiSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        provider: provider || 'openai',
        model: model || 'gpt-4o-mini',
        temperature: temperature ?? 0.3,
        apiKey: trimmedKey || null,
        updatedBy: req.user?.email || null,
      },
      update: {
        ...(provider !== undefined && { provider }),
        ...(model !== undefined && { model }),
        ...(temperature !== undefined && { temperature }),
        ...(trimmedKey && { apiKey: trimmedKey }),
        updatedBy: req.user?.email || null,
      },
    });

    return sendSuccess(res, {
      provider: settings.provider,
      model: settings.model,
      temperature: settings.temperature,
      apiKeyConfigured: !!(settings.apiKey && settings.apiKey.trim().length >= 10),
      updatedAt: settings.updatedAt,
    }, 'AI configuration saved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAiUsage,
  getAiConfig,
  updateAiConfig,
};
