const jwt = require('jsonwebtoken');
const { config } = require('../config/environment');

const generateAccessToken = (payload) => {
  // Admin users get 2 hours, regular users get 15 minutes
  const expiresIn = payload.roles && payload.roles.includes('admin') ? '2h' : config.jwt.expiresIn;
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

const generateRefreshToken = (payload) => {
  // Admin users get 4 days, regular users get 7 days
  const expiresIn = payload.roles && payload.roles.includes('admin') ? '4d' : config.jwt.refreshExpiresIn;
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
