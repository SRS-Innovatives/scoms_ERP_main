/**
 * Bounded list queries for institution-wide history lists (enquiries, visitor logs, fee
 * challans, certificates, ...) — tables that only ever grow. Before this every such
 * endpoint returned the whole table, so its response time, memory and bandwidth grew
 * forever with the institution's data.
 *
 *   ?page=2&limit=50  → that page only, plus meta { page, limit, total, totalPages }
 *                       (limit capped at 200). For paged frontend tables.
 *   no ?page          → backward compatible: the same array as before, but at most
 *                       LIST_MAX_ROWS rows (default 2000), newest first via the caller's
 *                       orderBy; meta { truncated: true, limit } tells the client when
 *                       the ceiling was hit. Today's portals keep working unchanged.
 *
 * Usage:
 *   const { rows, meta } = await findList(prisma.enquiry, { where, orderBy, include }, req);
 *   return sendSuccess(res, rows, 'Enquiries retrieved', 200, meta);
 */
const MAX_ROWS = Number(process.env.LIST_MAX_ROWS || 2000);
const MAX_PAGE_SIZE = 200;

const findList = async (delegate, args, req, { max = MAX_ROWS } = {}) => {
  const page = parseInt(req.query?.page, 10);

  if (page > 0) {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), MAX_PAGE_SIZE);
    const [rows, total] = await Promise.all([
      delegate.findMany({ ...args, skip: (page - 1) * limit, take: limit }),
      delegate.count({ where: args.where }),
    ]);
    return { rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  // One extra row tells us whether anything was cut off, without a separate COUNT
  const rows = await delegate.findMany({ ...args, take: max + 1 });
  if (rows.length > max) {
    rows.length = max;
    return { rows, meta: { truncated: true, limit: max } };
  }
  return { rows, meta: null };
};

/**
 * A two-person message thread, newest CONVERSATION_PAGE messages only (default 200),
 * returned oldest-first exactly like before so chat views render unchanged.
 * ?before=<ISO date of the oldest message shown> loads the previous page.
 * meta.hasMore tells the client whether older messages exist.
 */
const CONVERSATION_PAGE = 200;
const findConversation = async (prisma, userA, userB, req) => {
  // ?after=<ISO date of the newest message shown> → only what arrived since (oldest-first),
  // so an app polling an open chat fetches a few rows instead of the last 200 every time
  const after = req.query?.after ? new Date(req.query.after) : null;
  if (after && !Number.isNaN(after.getTime())) {
    const fresh = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA },
        ],
        createdAt: { gt: after },
      },
      orderBy: { createdAt: 'asc' },
      take: CONVERSATION_PAGE,
    });
    return { rows: fresh, meta: { hasMore: false } };
  }
  const before = req.query?.before ? new Date(req.query.before) : null;
  const rows = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
      ...(before && !Number.isNaN(before.getTime()) && { createdAt: { lt: before } }),
    },
    orderBy: { createdAt: 'desc' },
    take: CONVERSATION_PAGE + 1,
  });
  const hasMore = rows.length > CONVERSATION_PAGE;
  if (hasMore) rows.length = CONVERSATION_PAGE;
  return { rows: rows.reverse(), meta: { hasMore } };
};

module.exports = { findList, findConversation };
