/**
 * Institute Admin — Custom Lists (Leave Types, Discipline Categories, Exam Types)
 *
 * Self-service, no SuperAdmin approval — see shared/utils/customLists.js for why.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, LIST_TYPES, DEFAULT_LISTS, getActiveList } = require('../../../shared');

const toCode = (label) => label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const resolveListType = (req) => {
  const listType = req.query.listType || req.body.listType;
  if (!LIST_TYPES.includes(listType)) throw new ValidationError(`listType must be one of ${LIST_TYPES.join(', ')}`);
  return listType;
};

/** Everything for this list type — active and retired — for the management screen.
 * Institutions that have never customized this list see the real default entries,
 * pre-populated as if they'd created them (editable/removable from here on). */
const getList = async (req, res, next) => {
  try {
    const listType = resolveListType(req);
    const rows = await prisma.institutionCustomList.findMany({
      where: { institutionId: req.institutionId, listType },
      orderBy: { sortOrder: 'asc' },
    });
    if (rows.length > 0) return sendSuccess(res, rows, 'Custom list retrieved successfully');

    // First time this institution has looked at this list — seed it from the default so
    // there's something real to edit, rather than an empty screen with no explanation.
    const seeded = await prisma.$transaction(
      DEFAULT_LISTS[listType].map((d, idx) =>
        prisma.institutionCustomList.create({ data: { institutionId: req.institutionId, listType, code: d.code, label: d.label, sortOrder: idx } })
      )
    );
    return sendSuccess(res, seeded, 'Custom list retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createEntry = async (req, res, next) => {
  try {
    const listType = resolveListType(req);
    const { label } = req.body;
    if (!label) throw new ValidationError('label is required');
    const code = toCode(label);
    if (!code) throw new ValidationError('label must contain at least one letter or number');

    const existing = await prisma.institutionCustomList.findUnique({ where: { institutionId_listType_code: { institutionId: req.institutionId, listType, code } } });
    if (existing) throw new ValidationError(`"${label}" (or a very similar entry) already exists in this list`);

    const count = await prisma.institutionCustomList.count({ where: { institutionId: req.institutionId, listType } });
    const entry = await prisma.institutionCustomList.create({
      data: { institutionId: req.institutionId, listType, code, label, sortOrder: count },
    });
    return sendSuccess(res, entry, 'Entry added successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, sortOrder, isActive } = req.body;
    const existing = await prisma.institutionCustomList.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Entry not found');

    const entry = await prisma.institutionCustomList.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive: !!isActive }),
      },
    });
    return sendSuccess(res, entry, 'Entry updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.institutionCustomList.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Entry not found');
    await prisma.institutionCustomList.delete({ where: { id } });
    return sendSuccess(res, null, 'Entry deleted successfully');
  } catch (err) {
    next(err);
  }
};

/** What a real form should actually offer right now — active entries only, defaults
 * if never customized. Used by every dropdown that consumes this list. */
const getActiveEntries = async (req, res, next) => {
  try {
    const listType = resolveListType(req);
    const entries = await getActiveList(req.institutionId, listType);
    return sendSuccess(res, entries, 'Active list retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getList, createEntry, updateEntry, deleteEntry, getActiveEntries };
