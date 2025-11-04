const { Submission, File: FileModel } = require('../models');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

const createSubmission = async (userId, data) => {
  const payload = { ...data };
  if (userId) {
    payload.userId = mongoose.Types.ObjectId(userId);
  }
  // Accept top-level github_repo (legacy) or nested projectDetails.githubRepo
  if (payload.github_repo && (!payload.projectDetails || !payload.projectDetails.githubRepo)) {
    payload.projectDetails = payload.projectDetails || {};
    payload.projectDetails.githubRepo = payload.github_repo;
  }
  // Normalize githubRepo: trim and ensure full URL when possible
  if (payload.projectDetails && payload.projectDetails.githubRepo) {
    let g = String(payload.projectDetails.githubRepo).trim();
    if (g.startsWith('github.com')) g = `https://${g}`;
    payload.projectDetails.githubRepo = g || undefined;
  }
  // Normalize role inside personalInfo if present to a canonical form
  if (payload.personalInfo && payload.personalInfo.role) {
    const s = String(payload.personalInfo.role).trim().toLowerCase();
    if (['ui/ux', 'ui ux', 'ux', 'ui', 'ui/ux designer', 'ui ux designer'].includes(s)) payload.personalInfo.role = 'UI/UX Designer';
    else if (['frontend developer', 'frontend', 'front-end'].includes(s)) payload.personalInfo.role = 'Frontend Developer';
    else if (['backend developer', 'backend'].includes(s)) payload.personalInfo.role = 'Backend Developer';
    else if (['python developer', 'python'].includes(s)) payload.personalInfo.role = 'Python Developer';
    else if (['full stack developer', 'full-stack developer', 'fullstack', 'fill developer', 'fill'].includes(s)) payload.personalInfo.role = 'Full Stack Developer';
    else payload.personalInfo.role = String(payload.personalInfo.role).trim();
  }
  const submission = new Submission(payload);
  await submission.save();
  return submission;
};

const getSubmissionById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Submission.findById(id).populate('fileIds').lean();
};

const updateSubmission = async (id, updates, actor) => {
  // actor can be { id, roles }
  const submission = await Submission.findById(id);
  if (!submission) return null;
  // Only owner or admin can update
  if (submission.userId.toString() !== actor.id && !(actor.roles || []).includes('admin')) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  // Allow updates to include github_repo or projectDetails.githubRepo; normalize
  if (updates.github_repo && (!updates.projectDetails || !updates.projectDetails.githubRepo)) {
    updates.projectDetails = updates.projectDetails || {};
    updates.projectDetails.githubRepo = updates.github_repo;
  }
  if (updates.projectDetails && updates.projectDetails.githubRepo) {
    let g = String(updates.projectDetails.githubRepo).trim();
    if (g.startsWith('github.com')) g = `https://${g}`;
    updates.projectDetails.githubRepo = g || undefined;
  }
  Object.assign(submission, updates);
  await submission.save();
  return submission;
};

const deleteSubmission = async (id, actor) => {
  const submission = await Submission.findById(id);
  if (!submission) return null;
  if (submission.userId.toString() !== actor.id && !(actor.roles || []).includes('admin')) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  // Optionally remove associated files metadata (not deleting file storage here)
  await FileModel.updateMany({ _id: { $in: submission.fileIds } }, { $unset: { submissionId: '' } });
  await submission.remove();
  return true;
};

const listSubmissions = async ({ page = 1, limit = 20, filter = {}, actor = {} }) => {
  const query = {};
  if (!(actor.roles || []).includes('admin')) {
    // non-admins only see their own
    query.userId = mongoose.Types.ObjectId(actor.id);
  }
  // apply filters (status, date range, userId)
  if (filter.status) query.status = filter.status;
  if (filter.userId && (actor.roles || []).includes('admin')) query.userId = mongoose.Types.ObjectId(filter.userId);

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Submission.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Submission.countDocuments(query)
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
};

const setSubmissionStatus = async (id, status, reviewerId) => {
  const submission = await Submission.findById(id);
  if (!submission) return null;
  submission.status = status;
  submission.reviewedAt = new Date();
  submission.reviewedBy = reviewerId ? mongoose.Types.ObjectId(reviewerId) : undefined;
  await submission.save();
  return submission;
};

const addReview = async (id, reviewData, reviewerId) => {
  const submission = await Submission.findById(id);
  if (!submission) return null;
  
  const reviewEntry = {
    reviewerId: mongoose.Types.ObjectId(reviewerId),
    rating: reviewData.rating,
    comments: reviewData.comments,
    reviewedAt: new Date(),
    status: reviewData.status || submission.status
  };
  
  submission.adminReviewHistory = submission.adminReviewHistory || [];
  submission.adminReviewHistory.push(reviewEntry);
  
  // Update current rating and comments
  submission.adminRating = reviewData.rating;
  submission.adminComments = reviewData.comments;
  
  // Update status if provided
  if (reviewData.status) {
    submission.status = reviewData.status;
    submission.reviewedAt = new Date();
    submission.reviewedBy = mongoose.Types.ObjectId(reviewerId);
  }
  
  await submission.save();
  return submission;
};

const bulkUpdateStatus = async (submissionIds, status, reviewerId) => {
  const result = await Submission.updateMany(
    { _id: { $in: submissionIds.map(id => mongoose.Types.ObjectId(id)) } },
    { 
      status, 
      reviewedAt: new Date(),
      reviewedBy: mongoose.Types.ObjectId(reviewerId)
    }
  );
  return { modifiedCount: result.modifiedCount };
};

const bulkDelete = async (submissionIds, actorId) => {
  // First, get the submissions to clean up file references
  const submissions = await Submission.find({ _id: { $in: submissionIds.map(id => mongoose.Types.ObjectId(id)) } });
  
  // Clean up file references
  const allFileIds = submissions.flatMap(sub => sub.fileIds || []);
  if (allFileIds.length > 0) {
    await FileModel.updateMany({ _id: { $in: allFileIds } }, { $unset: { submissionId: '' } });
  }
  
  const result = await Submission.deleteMany({ _id: { $in: submissionIds.map(id => mongoose.Types.ObjectId(id)) } });
  return { deletedCount: result.deletedCount };
};

const bulkExport = async (submissionIds, format = 'csv') => {
  const submissions = await Submission.find({ 
    _id: { $in: submissionIds.map(id => mongoose.Types.ObjectId(id)) } 
  }).populate('reviewedBy', 'name email').lean();
  
  if (format === 'csv') {
    const csvHeaders = [
      'ID', 'Full Name', 'Email', 'Phone', 'College', 'Department', 'Role', 'Year', 'Semester',
      'Project Title', 'Project Description', 'Website URL', 'GitHub Repo',
      'MCQ Score', 'Status', 'Submitted At', 'Reviewed At', 'Admin Rating', 'Admin Comments',
      'Tags', 'Priority', 'Notes'
    ];
    
    const csvRows = submissions.map(sub => [
      sub._id,
      sub.personalInfo?.fullName || '',
      sub.personalInfo?.email || '',
      sub.personalInfo?.phone || '',
      sub.personalInfo?.collegeName || '',
      sub.personalInfo?.department || '',
      sub.personalInfo?.role || '',
      sub.personalInfo?.year || '',
      sub.personalInfo?.semester || '',
      sub.projectDetails?.title || '',
      sub.projectDetails?.description || '',
      sub.projectDetails?.websiteUrl || '',
      sub.projectDetails?.githubRepo || '',
      `${sub.mcqScore?.correctAnswers || 0}/${sub.mcqScore?.totalQuestions || 0} (${sub.mcqScore?.percentage || 0}%)`,
      sub.status,
      sub.submittedAt ? new Date(sub.submittedAt).toISOString() : '',
      sub.reviewedAt ? new Date(sub.reviewedAt).toISOString() : '',
      sub.adminRating || '',
      sub.adminComments || '',
      (sub.tags || []).join('; '),
      sub.priority || '',
      sub.notes || ''
    ]);
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    return csvContent;
  }
  
  return submissions;
};

const updateMetadata = async (id, metadata, actorId) => {
  const submission = await Submission.findById(id);
  if (!submission) return null;
  
  if (metadata.tags !== undefined) submission.tags = metadata.tags;
  if (metadata.priority !== undefined) submission.priority = metadata.priority;
  if (metadata.notes !== undefined) submission.notes = metadata.notes;
  if (metadata.emailNotifications !== undefined) submission.emailNotifications = metadata.emailNotifications;
  
  await submission.save();
  return submission;
};

const sendNotification = async (id, type, message, senderId) => {
  // This is a placeholder for email notification functionality
  // In a real implementation, you would integrate with an email service like SendGrid, Mailgun, etc.
  const submission = await Submission.findById(id);
  if (!submission) return null;
  
  logger.info('Notification sent', { 
    submissionId: id, 
    type, 
    recipient: submission.personalInfo.email,
    senderId 
  });
  
  // TODO: Implement actual email sending
  // For now, just return success
  return { 
    success: true, 
    type, 
    recipient: submission.personalInfo.email,
    message: message || `Your submission status has been updated to: ${submission.status}`
  };
};

module.exports = {
  createSubmission,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  listSubmissions,
  setSubmissionStatus,
  addReview,
  bulkUpdateStatus,
  bulkDelete,
  bulkExport,
  updateMetadata,
  sendNotification
};
