const analyticsService = require('../services/analytics.service');
const { logger } = require('../utils/logger');

const getDashboardAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getDashboardAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) {
    logger.error('Get dashboard analytics error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch analytics' } });
  }
};

const getDetailedAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const analytics = await analyticsService.getDetailedAnalytics({ startDate, endDate, category });
    res.json({ success: true, data: analytics });
  } catch (err) {
    logger.error('Get detailed analytics error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch detailed analytics' } });
  }
};

const getSubmissionTrends = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const trends = await analyticsService.getSubmissionTrends(period);
    res.json({ success: true, data: trends });
  } catch (err) {
    logger.error('Get submission trends error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch submission trends' } });
  }
};

module.exports = {
  getDashboardAnalytics,
  getDetailedAnalytics,
  getSubmissionTrends
};