const submissionService = require('../services/submission.service');
const { logger } = require('../utils/logger');

const createSubmission = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const data = req.body;
    logger.info('Create submission request', { userId, body: data });
    // minor safety: ensure github repo field visibility in logs (trimmed)
    if (data?.projectDetails?.githubRepo || data?.github_repo) {
      const reported = (data.projectDetails && data.projectDetails.githubRepo) || data.github_repo;
      logger.info('GitHub repo in submission', { repo: String(reported).slice(0, 200) });
    }
    const submission = await submissionService.createSubmission(userId, data);
    res.status(201).json({ success: true, data: { submission } });
  } catch (err) {
    logger.error('Create submission error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create submission' } });
  }
};

const getSubmission = async (req, res) => {
  try {
    const id = req.params.id;
    const submission = await submissionService.getSubmissionById(id);
    if (!submission) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } });
    // If not admin, ensure owner (guard when submission is anonymous)
    const user = req.user || {};
    if (!(user.roles || []).includes('admin')) {
      if (submission.userId) {
        if (submission.userId.toString() !== user.id) {
          return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
        }
      } else {
        // submission is anonymous and requester is not admin — deny access
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      }
    }
    res.json({ success: true, data: { submission } });
  } catch (err) {
    logger.error('Get submission error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch submission' } });
  }
};

const updateSubmission = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const actor = { id: req.user.id, roles: req.user.roles };
    const submission = await submissionService.updateSubmission(id, updates, actor);
    res.json({ success: true, data: { submission } });
  } catch (err) {
    logger.error('Update submission error', err);
    const status = err.status || 500;
    res.status(status).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message || 'Failed to update' } });
  }
};

const deleteSubmission = async (req, res) => {
  try {
    const id = req.params.id;
    const actor = { id: req.user.id, roles: req.user.roles };
    await submissionService.deleteSubmission(id, actor);
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete submission error', err);
    const status = err.status || 500;
    res.status(status).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message || 'Failed to delete' } });
  }
};

const listSubmissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.userId = req.query.userId;
    const actor = { id: req.user.id, roles: req.user.roles };
    const result = await submissionService.listSubmissions({ page, limit, filter, actor });
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('List submissions error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to list submissions' } });
  }
};

const setStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'status is required' } });
    const submission = await submissionService.setSubmissionStatus(id, status, req.user.id);
    res.json({ success: true, data: { submission } });
  } catch (err) {
    logger.error('Set status error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update status' } });
  }
};

const addReview = async (req, res) => {
  try {
    const id = req.params.id;
    const { rating, comments, status } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Rating must be between 1 and 5' } });
    }
    const submission = await submissionService.addReview(id, { rating, comments, status }, req.user.id);
    res.json({ success: true, data: { submission } });
  } catch (err) {
    logger.error('Add review error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to add review' } });
  }
};

const bulkUpdateStatus = async (req, res) => {
  try {
    const { submissionIds, status } = req.body;
    if (!submissionIds || !Array.isArray(submissionIds) || !status) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'submissionIds array and status are required' } });
    }
    const result = await submissionService.bulkUpdateStatus(submissionIds, status, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Bulk update status error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to bulk update status' } });
  }
};

const bulkDelete = async (req, res) => {
  try {
    const { submissionIds } = req.body;
    if (!submissionIds || !Array.isArray(submissionIds)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'submissionIds array is required' } });
    }
    const result = await submissionService.bulkDelete(submissionIds, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Bulk delete error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to bulk delete' } });
  }
};

const bulkExport = async (req, res) => {
  try {
    const { submissionIds, format = 'csv' } = req.body;
    if (!submissionIds || !Array.isArray(submissionIds)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'submissionIds array is required' } });
    }
    const data = await submissionService.bulkExport(submissionIds, format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=submissions_export.csv');
      res.send(data);
    } else {
      res.json({ success: true, data });
    }
  } catch (err) {
    logger.error('Bulk export error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to export' } });
  }
};

const updateMetadata = async (req, res) => {
  try {
    const id = req.params.id;
    const { tags, priority, notes, emailNotifications } = req.body;
    const submission = await submissionService.updateMetadata(id, { tags, priority, notes, emailNotifications }, req.user.id);
    res.json({ success: true, data: { submission } });
  } catch (err) {
    logger.error('Update metadata error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update metadata' } });
  }
};

const sendNotification = async (req, res) => {
  try {
    const id = req.params.id;
    const { type, message } = req.body;
    const result = await submissionService.sendNotification(id, type, message, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Send notification error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to send notification' } });
  }
};

module.exports = { 
  createSubmission, 
  getSubmission, 
  updateSubmission, 
  deleteSubmission, 
  listSubmissions, 
  setStatus,
  addReview,
  bulkUpdateStatus,
  bulkDelete,
  bulkExport,
  updateMetadata,
  sendNotification
};
