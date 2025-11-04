const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { runValidation } = require('../middleware/validation');

// Create a submission (authenticated)
const submissionCreateValidators = [
	body('personalInfo.fullName').isString().notEmpty(),
	body('personalInfo.email').isEmail(),
	body('personalInfo.role').optional().isString(),
	body('projectDetails.title').isString().notEmpty(),
	runValidation
];
// Allow anonymous submissions (students may not be logged in) — do not require authenticate here
router.post('/', submissionCreateValidators, submissionController.createSubmission);

// Get a submission
router.get('/:id',  submissionController.getSubmission);

// Update a submission (owner or admin)
router.put('/:id', authenticate, submissionController.updateSubmission);

// Delete a submission (owner or admin)
router.delete('/:id', authenticate, submissionController.deleteSubmission);

// List submissions (admin sees all, user sees own)
router.get('/', authenticate, submissionController.listSubmissions);

// Admin: set status
router.put('/:id/status', authenticate, requireRole('admin'), submissionController.setStatus);

// Admin: add review and rating
router.post('/:id/review', authenticate, requireRole('admin'), submissionController.addReview);

// Admin: bulk operations
router.post('/bulk/status', authenticate, requireRole('admin'), submissionController.bulkUpdateStatus);
router.post('/bulk/delete', authenticate, requireRole('admin'), submissionController.bulkDelete);
router.post('/bulk/export', authenticate, requireRole('admin'), submissionController.bulkExport);

// Admin: update metadata (tags, priority, notes)
router.put('/:id/metadata', authenticate, requireRole('admin'), submissionController.updateMetadata);

// Admin: send notification emails
router.post('/:id/notify', authenticate, requireRole('admin'), submissionController.sendNotification);

module.exports = router;
