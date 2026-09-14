/**
 * Institute Admin — Message Template Library (SMS / Email / WhatsApp)
 *
 * Every institution automatically sees the 60 platform-default templates
 * (isSystem: true, institutionId: null) alongside their own custom ones.
 * System templates are read-only here — only an institution's own custom
 * templates can be edited or deleted.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const VALID_CHANNELS = ['SMS', 'EMAIL', 'WHATSAPP'];

const getTemplates = async (req, res, next) => {
  try {
    const { channel } = req.query;
    if (channel && !VALID_CHANNELS.includes(channel)) throw new ValidationError(`channel must be one of ${VALID_CHANNELS.join(', ')}`);

    const templates = await prisma.messageTemplate.findMany({
      where: {
        ...(channel && { channel }),
        OR: [{ isSystem: true }, { institutionId: req.institutionId }],
      },
      orderBy: [{ isSystem: 'desc' }, { category: 'asc' }],
    });
    return sendSuccess(res, templates, 'Templates retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const { channel, category, title, subject, body } = req.body;
    if (!channel || !VALID_CHANNELS.includes(channel)) throw new ValidationError(`channel must be one of ${VALID_CHANNELS.join(', ')}`);
    if (!category || !title || !body) throw new ValidationError('category, title and body are required');
    if (channel === 'EMAIL' && !subject) throw new ValidationError('subject is required for EMAIL templates');

    const template = await prisma.messageTemplate.create({
      data: { institutionId: req.institutionId, channel, category, title, subject: subject || null, body, isSystem: false },
    });
    return sendSuccess(res, template, 'Template created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subject, body } = req.body;

    const existing = await prisma.messageTemplate.findFirst({ where: { id, institutionId: req.institutionId, isSystem: false } });
    if (!existing) throw new NotFoundError('Custom template not found (system templates cannot be edited)');

    const updated = await prisma.messageTemplate.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subject !== undefined && { subject }),
        ...(body !== undefined && { body }),
      },
    });
    return sendSuccess(res, updated, 'Template updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.messageTemplate.findFirst({ where: { id, institutionId: req.institutionId, isSystem: false } });
    if (!existing) throw new NotFoundError('Custom template not found (system templates cannot be deleted)');
    await prisma.messageTemplate.delete({ where: { id } });
    return sendSuccess(res, null, 'Template deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getTemplates, createTemplate, updateTemplate, deleteTemplate };
