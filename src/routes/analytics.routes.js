const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole('admin'));

// Get analytics dashboard data
router.get('/dashboard', analyticsController.getDashboardAnalytics);

// Get detailed analytics by date range
router.get('/detailed', analyticsController.getDetailedAnalytics);

// Get submission trends
router.get('/trends', analyticsController.getSubmissionTrends);

module.exports = router;