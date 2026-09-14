/**
 * JWT Access Token & Refresh Token Signer and Verifier
 *
 * Security note: this used to fall back to hardcoded secrets
 * ("scoms_super_secret_access_key_2026" / "...refresh_key_2026") whenever the real env
 * vars were unset — meaning anyone who had ever seen this source (it's in git history)
 * could forge a valid token for any user, including Super Admin, on any deployment that
 * forgot to set JWT_ACCESS_SECRET/JWT_REFRESH_SECRET. This now fails loudly at startup
 * instead of silently degrading to a known, public secret. Every real deployment
 * (including this one, via .env) already sets both, so this changes nothing about
 * normal operation — it only removes the silent unsafe fallback.
 */

const jwt = require('jsonwebtoken');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '1d';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error(
    'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in the environment — refusing to start with an insecure default secret.'
  );
}

const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES, algorithm: 'HS256' });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES, algorithm: 'HS256' });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
