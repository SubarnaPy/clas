const { logger } = require('../utils/logger');

const requireRole = (role) => (req, res, next) => {
  const user = req.user;
  if (!user || !user.roles || !user.roles.includes(role)) {
    logger.warn('Unauthorized role access attempt', { user: user ? user.id : null, requiredRole: role });
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
  }
  next();
};

module.exports = { requireRole };
