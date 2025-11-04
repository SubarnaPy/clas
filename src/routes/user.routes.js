const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { runValidation } = require('../middleware/validation');

// Profile routes
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);

// Admin user management
const createUserValidators = [
	body('email').isEmail(),
	body('password').isString().isLength({ min: 6 }),
	body('fullName').isString().notEmpty(),
	runValidation
];

router.get('/', authenticate, requireRole('admin'), userController.listUsers);
router.post('/', authenticate, requireRole('admin'), createUserValidators, userController.createUser);
router.post('/:id/roles', authenticate, requireRole('admin'), userController.assignRole);

module.exports = router;
