/**
 * Actual push delivery (FCM). Follows the exact same real/simulated pattern as
 * shared/utils/notifications.js (email/SMS/WhatsApp): if real credentials aren't
 * configured, the send is simulated (logged, not dispatched) instead of failing —
 * so the whole notification flow keeps working in dev with nothing to set up.
 */
const { logger } = require('@scoms/shared');

let firebaseApp = null;

function isConfigured() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
}

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;
  // Lazy require — firebase-admin is only ever loaded if a real service account is set,
  // so nothing extra needs installing just to run in simulated mode.
  const admin = require('firebase-admin');
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  firebaseApp = admin.apps.length
    ? admin.app()
    : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return firebaseApp;
}

/** Sends the same title/body/data to every token in the list. Never throws — a push
 * failing to send must never break the caller's own flow (e.g. homework creation
 * should still succeed even if the push fan-out fails). Returns a per-token result
 * summary so the caller can drop dead tokens if it wants to. */
async function sendPushToTokens(tokens, { title, body, data = {} }) {
  if (!tokens.length) return { sent: 0, simulated: 0, failed: 0, invalidTokens: [] };

  if (!isConfigured()) {
    logger.info(`🔔 [SIMULATED PUSH SENT]
    Tokens:  ${tokens.length}
    Title:   ${title}
    Body:    ${body}
    ---------------------------------------------`);
    return { sent: 0, simulated: tokens.length, failed: 0, invalidTokens: [] };
  }

  try {
    const admin = require('firebase-admin');
    getFirebaseApp();

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });

    const invalidTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success && ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'].includes(r.error?.code)) {
        invalidTokens.push(tokens[i]);
      }
    });

    logger.info(`🔔 Push sent: ${response.successCount} succeeded, ${response.failureCount} failed`);
    return { sent: response.successCount, simulated: 0, failed: response.failureCount, invalidTokens };
  } catch (err) {
    logger.error('❌ Failed to send push notification batch:', err);
    return { sent: 0, simulated: 0, failed: tokens.length, invalidTokens: [] };
  }
}

module.exports = { sendPushToTokens, isConfigured };
