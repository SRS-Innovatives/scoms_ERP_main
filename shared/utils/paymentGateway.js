/**
 * Razorpay-shaped Payment Gateway Helper
 *
 * Real Razorpay checkout returns razorpay_order_id + razorpay_payment_id +
 * razorpay_signature, verified server-side via HMAC-SHA256(order_id + "|" + payment_id,
 * key_secret) === signature — that is exactly what verifySignature below does, and it's
 * the same code path whether real keys are configured or not.
 *
 * With only placeholder keys configured (this repo's default — no live Razorpay account),
 * there's no real gateway to hand back a payment_id/signature, so createSimulatedPayment
 * has the server compute a self-consistent one at order-creation time instead. The secret
 * never leaves the server, so a forged payment_id for an assignment the caller doesn't
 * own still fails verifySignature — the IDOR-adjacent "just POST any payment_id" gap is
 * closed in both modes, not just the real-gateway one.
 */
const crypto = require('crypto');

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

/** Creates a payment order. In simulated mode (no real gateway configured) also
 * pre-computes a valid payment id + signature pair so the mock checkout flow has
 * something authentic to verify against. */
const createOrder = (amount) => {
  const orderId = `order_${crypto.randomBytes(12).toString('hex')}`;
  const simulated = !isConfigured();

  if (!simulated) {
    return { orderId, amount, currency: 'INR', key: process.env.RAZORPAY_KEY_ID, simulated };
  }

  const paymentId = `pay_${crypto.randomBytes(12).toString('hex')}`;
  const signature = sign(orderId, paymentId);
  return { orderId, amount, currency: 'INR', key: process.env.RAZORPAY_KEY_ID, simulated, paymentId, signature };
};

module.exports = { isConfigured, sign, verifySignature, createOrder };
