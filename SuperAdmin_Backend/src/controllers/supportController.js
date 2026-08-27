/**
 * Super Admin Support Desk Controller
 */
const { prisma, sendSuccess, NotFoundError } = require('../../../shared');

const generateTicketNumber = () => `TKT-${Date.now().toString(36).toUpperCase()}`;

const getTickets = async (req, res, next) => {
  try {
    const { status, institutionId } = req.query;

    const tickets = await prisma.supportTicket.findMany({
      where: {
        ...(status && { status }),
        ...(institutionId && { institutionId }),
      },
      include: { institution: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, tickets, 'Tickets retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createTicket = async (req, res, next) => {
  try {
    const { institutionId, subject, description, category, priority, raisedByEmail } = req.body;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        institutionId: institutionId || null,
        subject,
        description,
        category,
        priority: priority || 'MEDIUM',
        raisedByEmail,
      },
    });

    return sendSuccess(res, ticket, 'Ticket created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo } = req.body;

    const existing = await prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Support ticket not found');

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(status !== undefined && { status, ...(status === 'RESOLVED' || status === 'CLOSED' ? { resolvedAt: new Date() } : {}) }),
        ...(priority !== undefined && { priority }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
    });

    return sendSuccess(res, ticket, 'Ticket updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTickets,
  createTicket,
  updateTicket,
};
