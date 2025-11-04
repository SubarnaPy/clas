const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * @openapi
 * /api/files/upload:
 *   post:
 *     summary: Upload a file
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               submissionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: File uploaded
 */

// Upload file (authenticated)
router.post('/upload', authenticate, fileController.uploadMiddleware, fileController.handleUpload);

// Download file
/**
 * @openapi
 * /api/files/download/{id}:
 *   get:
 *     summary: Download a file by id
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File download
 */
router.get('/download/:id', authenticate, fileController.download);

// Metadata
router.get('/:id', authenticate, fileController.getMetadata);

// Delete (owner or admin) - delete route currently allows authenticated users; service will enforce ownership
router.delete('/:id', authenticate, fileController.removeFile);

// List user's files
router.get('/', authenticate, fileController.listFiles);

module.exports = router;
