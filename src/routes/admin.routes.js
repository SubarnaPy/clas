const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * @openapi
 * /api/admin/demo-data:
 *   post:
 *     summary: Load demo data (non-production only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Demo data loaded
 */
router.post('/demo-data', authenticate, requireRole('admin'), adminController.loadDemoData);

/**
 * @openapi
 * /api/admin/statistics:
 *   get:
 *     summary: Get basic statistics for dashboard
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics
 */
router.get('/statistics', authenticate, requireRole('admin'), adminController.getStats);

// Check if any admin exists (used by front-end bootstrap)
router.get('/exists', adminController.adminExists);

// Get or update settings (admin only for updates)
router.get('/settings/:key', authenticate, requireRole('admin'), adminController.getSetting);
router.put('/settings/:key', authenticate, requireRole('admin'), adminController.updateSetting);

module.exports = router;
