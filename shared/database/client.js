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

prisma.$connect()
  .then(() => {
    logger.info('PostgreSQL Prisma database client connected successfully.');
  })
  .catch((err) => {
    logger.error('Failed to connect to PostgreSQL Prisma database:', err);
  });

module.exports = prisma;
