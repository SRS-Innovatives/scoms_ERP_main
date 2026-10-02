/**
 * scoms-app-backend's own Prisma Client — generated from this folder's own
 * prisma/schema.prisma (an exact copy of the platform schema, same models, same
 * Postgres database) into src/generated/prisma-client. Kept separate from the root
 * shared/database/client.js instance so this folder's own queries (e.g. device
 * token registration) never depend on regenerating the root client.
 */
const { PrismaClient } = require('../generated/prisma-client');

const prisma = new PrismaClient();

module.exports = prisma;
