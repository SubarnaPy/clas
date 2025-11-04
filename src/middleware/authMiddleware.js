const { verifyAccessToken } = require('../services/auth.service');
const { logger } = require('../utils/logger');

const authenticate = (req, res, next) => {
  // Skip auth for public config endpoint
  if (req.originalUrl === '/api/mcq/config') return next();

  const authHeader = req.get('Authorization') || req.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing Authorization header for request', { ip: req.ip, path: req.originalUrl });
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    logger.warn('Invalid access token', { err: err.message, token: token ? token.slice(0,8) + '...' : null, path: req.originalUrl });
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
  }
};

module.exports = { authenticate };
