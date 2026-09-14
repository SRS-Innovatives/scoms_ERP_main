/**
 * Public API key generation — used for the per-institution key that authenticates an
 * external website's form submissions (e.g. Pre-Admission), where there's no user
 * session/JWT to check. crypto.randomBytes, not Math.random — this key is a real bearer
 * credential, so it needs to be genuinely unguessable, not just "look random".
 */
const { randomBytes } = require('crypto');

/** e.g. "scoms_live_9f2a1c...64 hex chars" — prefixed so it's recognizable at a glance
 * (in logs, in a .env file, in support screenshots) as this specific kind of key. */
const generateApiKey = (prefix = 'scoms_live') => `${prefix}_${randomBytes(32).toString('hex')}`;

module.exports = { generateApiKey };
