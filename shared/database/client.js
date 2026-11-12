/**
 * Prisma Client Singleton Connection Manager
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      // Query logging floods stdout (every findMany + Prisma's SELECT 1 ping). Opt in with PRISMA_QUERY_LOG=1.
      log: process.env.PRISMA_QUERY_LOG === '1'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

/**
 * Blank → null for OPTIONAL UNIQUE text columns (User.mobile/email/userCode, Student
 * rollNumber/sectionId, FeePayment.idempotencyKey...). Forms send an empty field as '',
 * and '' is a real value to a unique index: the first record saved with no phone takes
 * '' and every later one fails with "already exists". NULLs never collide. The column
 * list is read from the schema itself, so a new optional unique field is covered too.
 */
const { Prisma } = require('@prisma/client');

const BLANKABLE_UNIQUE = Object.fromEntries(
  Prisma.dmmf.datamodel.models
    .map((m) => {
      const optionalText = (name) => {
        const f = m.fields.find((x) => x.name === name);
        return f && f.kind === 'scalar' && f.type === 'String' && !f.isRequired;
      };
      const names = new Set([
        ...m.fields.filter((f) => f.isUnique).map((f) => f.name),
        ...(m.uniqueFields || []).flat(),
      ]);
      return [m.name, [...names].filter(optionalText)];
    })
    .filter(([, fields]) => fields.length > 0)
);

const blankToNull = (data, fields) => {
  if (!data || typeof data !== 'object') return;
  for (const f of fields) if (data[f] === '') data[f] = null;
};

if (!prisma.__blankUniqueGuard) {
  prisma.$use(async (params, next) => {
    const fields = BLANKABLE_UNIQUE[params.model];
    if (fields && params.args) {
      const { action, args } = params;
      if (['create', 'update', 'updateMany'].includes(action)) {
        [].concat(args.data || []).forEach((d) => blankToNull(d, fields));
      } else if (action === 'createMany') {
        [].concat(args.data || []).forEach((d) => blankToNull(d, fields));
      } else if (action === 'upsert') {
        blankToNull(args.create, fields);
        blankToNull(args.update, fields);
      }
    }
    return next(params);
  });
  prisma.__blankUniqueGuard = true;
}

prisma.$connect()
  .then(() => {
    logger.info('PostgreSQL Prisma database client connected successfully.');
  })
  .catch((err) => {
    logger.error('Failed to connect to PostgreSQL Prisma database:', err);
  });

module.exports = prisma;
