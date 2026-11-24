/**
 * The gateway uses the ONE shared Prisma client (shared/database/client.js, generated from
 * the root prisma/schema.prisma). It used to generate its own client from a copy of the
 * schema that had drifted ~1,100 lines behind, opened a second connection pool, and — its
 * generated folder being git-ignored — would not even exist on a fresh production install.
 */
module.exports = require('../../../shared/database/client');
