const mcqService = require('../services/mcq.service');
const submissionService = require('../services/submission.service');
const { User, Submission, MCQQuestion } = require('../models');
const { logger } = require('../utils/logger');

const loadDemoData = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not allowed in production' } });
    }
    // Minimal demo data: create a sample MCQ question
    const sample = await mcqService.createQuestion({
      question: 'Demo: What is 2+2?',
      options: ['1', '2', '3', '4'],
      correctAnswer: 3,
      difficulty: 'easy',
      points: 1
    });
    return res.json({ success: true, data: { sample } });
  } catch (err) {
    logger.error('Load demo data error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to load demo data' } });
  }
};

const getStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const submissions = await Submission.countDocuments();
    const mcqs = await MCQQuestion.countDocuments();
    res.json({ success: true, data: { users, submissions, mcqs } });
  } catch (err) {
    logger.error('Get stats error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch stats' } });
  }
};

const adminExists = async (req, res) => {
  try {
    const admin = await User.findOne({ roles: { $in: ['admin'] } });
    res.json({ success: true, data: !!admin });
  } catch (err) {
    logger.error('Admin exists check failed', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to check admin' } });
  }
};

const settingService = require('../services/setting.service');

const getSetting = async (req, res) => {
  try {
    const key = req.params.key;
    const value = await settingService.getSetting(key, null);
    res.json({ success: true, data: { key, value } });
  } catch (err) {
    logger.error('Get setting error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get setting' } });
  }
};

const updateSetting = async (req, res) => {
  try {
    const key = req.params.key;
    const value = req.body.value;
    const updated = await settingService.setSetting(key, value);
    res.json({ success: true, data: { setting: updated } });
  } catch (err) {
    logger.error('Update setting error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update setting' } });
  }
};

module.exports = { loadDemoData, getStats, adminExists, getSetting, updateSetting };
