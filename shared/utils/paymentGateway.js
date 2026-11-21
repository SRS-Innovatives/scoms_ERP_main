/**
 * Razorpay Payment Gateway Helper
 *
 * Real Razorpay checkout returns razorpay_order_id + razorpay_payment_id +
 * razorpay_signature, verified server-side via HMAC-SHA256(order_id + "|" + payment_id,
 * key_secret) === signature — that is exactly what verifySignature below does, and it's
 * the same code path whether real keys are configured or not.
 *
 * When real keys are configured, createOrder calls Razorpay's actual Orders API
 * (POST /v1/orders) so the id handed back is a real order Razorpay's Checkout widget
 * will accept — pasting real RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET into .env is enough to
 * flip this from simulated to live, no code change needed.
 *
 * With only placeholder keys configured (this repo's default — no live Razorpay account),
 * there's no real gateway to hand back a payment_id/signature, so createOrder has the
 * server compute a self-consistent one at order-creation time instead. The secret never
 * leaves the server, so a forged payment_id for an assignment the caller doesn't own
 * still fails verifySignature — the IDOR-adjacent "just POST any payment_id" gap is
 * closed in both modes, not just the real-gateway one.
 */
const crypto = require('crypto');
const logger = require('./logger');
const { PaymentError } = require('../errors/customErrors');

/**
 * Signed order token — binds a payment order to WHO pays, WHICH fee and HOW MUCH, at the
 * moment the server creates the order. The confirm step credits the token's amount, never
 * an amount the browser sends (the Razorpay signature only proves the order/payment ids
 * are genuine, not the amount). Only the server can mint one; expires after 24 hours.
 */
const TOKEN_SECRET = () => process.env.PAYMENT_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET || process.env.RAZORPAY_KEY_SECRET || 'scoms_mock_secret';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// `kind` (optional) says what the order pays for — e.g. 'PRE_ADMISSION' with assignmentId = the
// application id — so a token minted for one kind of payment is never accepted by another.
// Left out for student fees (their tokens are unchanged).
const createOrderToken = ({ orderId, studentId, assignmentId, amount, kind }) => {
  const body = Buffer.from(JSON.stringify({ orderId, studentId, assignmentId, amount: Number(amount), kind, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET()).update(body).digest('base64url');
  return `${body}.${sig}`;
};

/** Returns the token's payload, or null if it is missing, tampered with or expired. */
const readOrderToken = (token) => {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', TOKEN_SECRET()).update(body).digest('base64url');
  const a = Buffer.from(expected);
  const b = Buffer.from(sig || '');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
};

const isConfigured = () => {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(key && secret && !key.includes('test_key') && !secret.includes('test_secret'));
};

const sign = (orderId, paymentId) => {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'scoms_mock_secret';
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
};

const verifySignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) return false;
  const expected = sign(orderId, paymentId);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/** Creates a payment order.
 * Live mode (real keys configured): calls Razorpay's real Orders API and returns the
 * real order id Razorpay's Checkout widget expects.
 * Simulated mode (no real gateway configured): also pre-computes a valid payment id +
 * signature pair so the mock checkout flow has something authentic to verify against. */
const createOrder = async (amount) => {
  const simulated = !isConfigured();

  if (!simulated) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    try {
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Razorpay expects paise
          currency: 'INR',
          receipt: `scoms_${Date.now()}`,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.id) {
        throw new Error(data.error?.description || 'Razorpay order creation failed');
      }

      return { orderId: data.id, amount, currency: 'INR', key: keyId, simulated: false };
    } catch (err) {
      // NEVER fall back to a simulated order when real keys are configured: the simulated
      // branch hands the browser a payment id + a signature made with the REAL secret, which
      // verify would accept — the fee would be marked paid with no money received.
      logger.error('❌ Failed to create real Razorpay order:', err);
      throw new PaymentError('The payment gateway is not responding right now. Please try again in a few minutes.');
    }
  }

  // Simulated payments are fake money — never on a production server unless explicitly
  // allowed (e.g. a demo site): PAYMENT_SIMULATION_ALLOWED=true
  if (process.env.NODE_ENV === 'production' && process.env.PAYMENT_SIMULATION_ALLOWED !== 'true') {
    throw new PaymentError('Online payment is not set up for this institution yet. Please pay at the fee office.');
  }

  const orderId = `order_${crypto.randomBytes(12).toString('hex')}`;
  const paymentId = `pay_${crypto.randomBytes(12).toString('hex')}`;
  const signature = sign(orderId, paymentId);
  return { orderId, amount, currency: 'INR', key: process.env.RAZORPAY_KEY_ID, simulated: true, paymentId, signature };
};

module.exports = { isConfigured, sign, verifySignature, createOrder, createOrderToken, readOrderToken };
