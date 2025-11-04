const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const mcqController = require('../controllers/mcq.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { runValidation } = require('../middleware/validation');
const { logger } = require('../utils/logger');

// Public: list and get questions
router.get('/categories', mcqController.listCategories);
router.get('/', mcqController.listQuestions);
// Public config (e.g. passing percentage)
router.get('/config', mcqController.getConfig);

// Note: keep the `/config` route BEFORE the `/:id` route otherwise Express
// will treat "config" as an `id` and route to getQuestion (causing a
// "Question not found" error).  Place authenticated parameterized routes
// after fixed path routes.
router.post('/validate', mcqController.validateAnswers);

router.get('/:id', authenticate, mcqController.getQuestion);

// Validate answers (public for assessment)

// Admin CRUD
const mcqValidators = [
	body('question').isString().notEmpty(),
	body('options').isArray({ min: 2 }),
	body('correctAnswer').isInt({ min: 0 }),
	runValidation
];

const bulkValidators = [
	body('questions').isArray({ min: 1 }),
	body('questions.*.question').isString().notEmpty(),
	body('questions.*.options').isArray({ min: 2 }),
	body('questions.*.correctAnswer').isInt({ min: 0 }),
	runValidation
];

router.post('/', authenticate, requireRole('admin'), mcqValidators, mcqController.createQuestion);
router.post('/bulk', authenticate, requireRole('admin'), bulkValidators, mcqController.bulkCreateQuestions);
router.put('/:id', authenticate, requireRole('admin'), mcqValidators, mcqController.updateQuestion);
router.delete('/:id', authenticate, requireRole('admin'), mcqController.deleteQuestion);

module.exports = router;

// Log the registered routes for debugging (helpful to ensure /config is mounted)
try {
	const routeList = router.stack
		.filter((r) => r.route && r.route.path)
		.map((r) => {
			const methods = Object.keys(r.route.methods).map((m) => m.toUpperCase()).join(',');
			return `${methods} ${r.route.path}`;
		});
	logger.info('MCQ routes registered:', { routes: routeList });
} catch (e) {
	// ignore logging errors
}
