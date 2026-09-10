/**
 * Student AI Study Tutor Controller — real RAG: looks up the school's own uploaded
 * textbook content for the requested class/subject/language, hands it to the configured
 * AI model as grounding context, and logs real usage. Falls back to a clearly-labeled
 * simulated answer if Super Admin hasn't configured a real API key yet (shared/utils/
 * aiProvider.js handles that, same pattern as email/SMS elsewhere in this platform).
 */
const { prisma, sendSuccess, ValidationError, askAi } = require('../../../shared');

// Concatenating unlimited chapters into one prompt gets expensive and can exceed context
// limits fast — cap how much raw textbook text goes into a single question.
const MAX_CONTEXT_CHARS = 12000;

const askAiAssistant = async (req, res, next) => {
  try {
    const { prompt, classGrade, subject, language } = req.body;
    if (!prompt || !String(prompt).trim()) throw new ValidationError('prompt is required');

    let context = '';
    let matchedChapters = [];
    if (classGrade && subject && language) {
      const chapters = await prisma.textbookContent.findMany({
        where: {
          institutionId: req.institutionId,
          classGrade: Number(classGrade),
          subject: { contains: subject, mode: 'insensitive' },
          language,
        },
        select: { chapterTitle: true, content: true },
        orderBy: { createdAt: 'asc' },
      });
      matchedChapters = chapters.map((c) => c.chapterTitle);
      let budget = MAX_CONTEXT_CHARS;
      for (const ch of chapters) {
        if (budget <= 0) break;
        const piece = `\n\n### ${ch.chapterTitle}\n${ch.content}`.slice(0, budget);
        context += piece;
        budget -= piece.length;
      }
    }

    const languageName = language === 'TAMIL' ? 'Tamil' : 'English';
    const systemPrompt = context
      ? `You are a patient, encouraging school tutor for a Class ${classGrade} student. Answer ONLY using the textbook excerpts below — if the answer isn't in them, say so honestly rather than guessing. Reply in ${languageName}, in simple language appropriate for Class ${classGrade}.\n\nTEXTBOOK EXCERPTS:${context}`
      : `You are a patient, encouraging school tutor. No specific textbook chapter was matched for this question, so answer from general subject knowledge, in simple language, and mention that a more specific answer would be possible if the relevant chapter were uploaded.`;

    const result = await askAi({ systemPrompt, userPrompt: prompt });

    // Log real usage so the Super Admin AI Usage dashboard reflects actual calls —
    // whether that's a real OpenAI response or an honestly-labeled simulated one.
    prisma.aiUsageLog
      .create({
        data: {
          institutionId: req.institutionId || null,
          userId: req.user?.id || null,
          role: req.user?.role || null,
          module: 'AI_ASSISTANT',
          provider: result.provider,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalTokens: result.totalTokens,
          costUSD: result.costUSD,
        },
      })
      .catch((err) => console.error('Error logging AI usage:', err));

    return sendSuccess(res, {
      question: prompt,
      answer: result.answer,
      groundedInChapters: matchedChapters,
      simulated: result.simulated,
      timestamp: new Date(),
    }, 'AI response generated successfully');
  } catch (err) {
    next(err);
  }
};

/** The class/subject/language combinations this institution actually has textbook content
 * for — powers the AI Tutor page's selectors so a student never picks a combination with
 * nothing to ground an answer in. */
const getAvailableTopics = async (req, res, next) => {
  try {
    const topics = await prisma.textbookContent.findMany({
      where: { institutionId: req.institutionId },
      select: { classGrade: true, subject: true, language: true },
      distinct: ['classGrade', 'subject', 'language'],
      orderBy: [{ classGrade: 'asc' }, { subject: 'asc' }],
    });
    return sendSuccess(res, topics, 'Available topics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  askAiAssistant,
  getAvailableTopics,
};
