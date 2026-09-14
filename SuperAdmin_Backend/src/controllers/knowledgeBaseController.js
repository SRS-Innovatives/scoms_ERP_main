/**
 * Super Admin — Knowledge Base Controller
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const getArticles = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const articles = await prisma.knowledgeBaseArticle.findMany({
      where: {
        ...(category && category !== 'All' && { category }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { updatedAt: 'desc' },
    });
    return sendSuccess(res, articles, 'Articles retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createArticle = async (req, res, next) => {
  try {
    const { title, category, content } = req.body;
    if (!title || !content) throw new ValidationError('title and content are required');

    const article = await prisma.knowledgeBaseArticle.create({
      data: {
        title,
        category: category || 'General',
        content,
        author: req.user.email,
        authorId: req.user.id,
      },
    });
    return sendSuccess(res, article, 'Article published successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, content } = req.body;

    const existing = await prisma.knowledgeBaseArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Article not found');

    const article = await prisma.knowledgeBaseArticle.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(content !== undefined && { content }),
      },
    });
    return sendSuccess(res, article, 'Article updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.knowledgeBaseArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Article not found');
    await prisma.knowledgeBaseArticle.delete({ where: { id } });
    return sendSuccess(res, null, 'Article deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getArticles, createArticle, updateArticle, deleteArticle };
