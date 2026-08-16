/**
 * JWT Access Token & Refresh Token Signer and Verifier
 */

const jwt = require('jsonwebtoken');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'scoms_super_secret_access_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'scoms_super_secret_refresh_key_2026';
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '1d';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
