/**
 * Read side of Official Circulars (published from the Institute Admin portal), shared by the
 * Staff and Student/Parent backends. Each reader sees only circulars addressed to ALL or to
 * their own audience; the attachment (base64 data URI) is returned by getOne only.
 */
const prisma = require('../database/client');
const { NotFoundError } = require('../errors/customErrors');

const listSelect = {
  id: true, refNo: true, title: true, description: true, issuedBy: true, issueDate: true,
  audience: true, attachmentName: true, createdAt: true,
};

const list = async (institutionId, audience) => {
  const rows = await prisma.circular.findMany({
    where: { institutionId, audience: { in: ['ALL', audience] } },
    select: listSelect,
    orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
  });
  return rows.map((c) => ({ ...c, hasAttachment: !!c.attachmentName }));
};

const getOne = async (institutionId, audience, id) => {
  const circular = await prisma.circular.findFirst({
    where: { id, institutionId, audience: { in: ['ALL', audience] } },
    select: { ...listSelect, attachment: true },
  });
  if (!circular) throw new NotFoundError('Circular not found');
  return circular;
};

module.exports = { list, getOne };
