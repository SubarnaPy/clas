const userService = require('../services/user.service');
const { logger } = require('../utils/logger');

const getProfile = async (req, res) => {
  try {
    const id = req.user && req.user.id;
    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    res.json({ success: true, data: { user } });
  } catch (err) {
    logger.error('Get profile error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch profile' } });
  }
};

const updateProfile = async (req, res) => {
  try {
    const id = req.user && req.user.id;
    const updates = req.body;
    const user = await userService.updateUser(id, updates);
    res.json({ success: true, data: { user } });
  } catch (err) {
    logger.error('Update profile error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update profile' } });
  }
};

// Admin: list users
const listUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const filter = {};
    const result = await userService.listUsers({ page, limit, filter });
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('List users error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to list users' } });
  }
};

// Admin: create user
const createUser = async (req, res) => {
  try {
    const { email, password, fullName, phone, roles } = req.body;
    if (!email || !password || !fullName) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'email, password, fullName required' } });
    const user = await userService.createUser({ email, password, fullName, phone, roles });
    res.status(201).json({ success: true, data: { user: { id: user._id, email: user.email, fullName: user.fullName, roles: user.roles } } });
  } catch (err) {
    logger.error('Create user error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create user' } });
  }
};

// Admin: assign role
const assignRole = async (req, res) => {
  try {
    const id = req.params.id;
    const { roles } = req.body;
    if (!Array.isArray(roles)) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'roles array required' } });
    const user = await userService.assignRole(id, roles);
    res.json({ success: true, data: { user } });
  } catch (err) {
    logger.error('Assign role error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to assign role' } });
  }
};

module.exports = { getProfile, updateProfile, listUsers, createUser, assignRole };
