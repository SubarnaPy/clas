const { ExcelSheetEntry, Submission } = require('../models');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

const getAllEntries = async ({ page = 1, limit = 20, filter = {} }) => {
  const query = {};

  if (filter.status) query.status = filter.status;
  if (filter.priority) query.priority = filter.priority;
  if (filter.search) {
    query.$or = [
      { fullName: { $regex: filter.search, $options: 'i' } },
      { email: { $regex: filter.search, $options: 'i' } },
      { collegeName: { $regex: filter.search, $options: 'i' } },
      { projectTitle: { $regex: filter.search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    ExcelSheetEntry.find(query)
      .populate('submissionId', 'status adminRating adminComments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ExcelSheetEntry.countDocuments(query)
  ]);

  return { entries, total, page, limit, pages: Math.ceil(total / limit) };
};

const getEntryById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return ExcelSheetEntry.findById(id).populate('submissionId').lean();
};

const addToExcelSheet = async (submissionId, userId) => {
  // Check if submission exists
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    const err = new Error('Submission not found');
    err.status = 404;
    throw err;
  }

  // Check if already in Excel sheet
  const existingEntry = await ExcelSheetEntry.findOne({ submissionId });
  if (existingEntry) {
    const err = new Error('Submission already in Excel sheet');
    err.status = 409;
    throw err;
  }

  // Create Excel sheet entry from submission data
  const entryData = {
    submissionId,
    fullName: submission.personalInfo?.fullName || '',
    email: submission.personalInfo?.email || '',
    phone: submission.personalInfo?.phone || '',
    collegeName: submission.personalInfo?.collegeName || '',
    department: submission.personalInfo?.department || '',
    role: submission.personalInfo?.role || '',
    year: submission.personalInfo?.year || '',
    semester: submission.personalInfo?.semester || '',
    projectTitle: submission.projectDetails?.title || '',
    projectDescription: submission.projectDetails?.description || '',
    websiteUrl: submission.projectDetails?.websiteUrl || '',
    githubRepo: submission.projectDetails?.githubRepo || '',
    mcqScore: submission.mcqScore || {},
    adminRating: submission.adminRating,
    adminComments: submission.adminComments,
    addedBy: userId
  };

  const entry = new ExcelSheetEntry(entryData);
  await entry.save();
  return entry;
};

const updateEntry = async (id, updates, userId) => {
  // Use findOneAndUpdate to ensure the update works properly
  const updateData = {
    ...updates,
    lastModifiedBy: userId,
    lastModifiedAt: new Date()
  };

  const updatedEntry = await ExcelSheetEntry.findOneAndUpdate(
    { _id: id },
    updateData,
    { new: true, runValidators: true }
  );

  return updatedEntry;
};

const bulkUpdateEntries = async (entryIds, updates, userId) => {
  const result = await ExcelSheetEntry.updateMany(
    { _id: { $in: entryIds.map(id => mongoose.Types.ObjectId(id)) } },
    {
      ...updates,
      lastModifiedBy: userId,
      lastModifiedAt: new Date()
    }
  );
  return { modifiedCount: result.modifiedCount };
};

const removeEntry = async (id) => {
  const entry = await ExcelSheetEntry.findById(id);
  if (!entry) return null;

  await entry.remove();
  return true;
};

const bulkRemoveEntries = async (entryIds) => {
  const result = await ExcelSheetEntry.deleteMany({
    _id: { $in: entryIds.map(id => mongoose.Types.ObjectId(id)) }
  });
  return { deletedCount: result.deletedCount };
};

const exportToCSV = async () => {
  const entries = await ExcelSheetEntry.find({})
    .populate('submissionId', 'status submittedAt')
    .sort({ createdAt: -1 })
    .lean();

  const csvHeaders = [
    'Row #', 'ID', 'Full Name', 'Email', 'Phone', 'College', 'Department', 'Role', 'Year', 'Semester',
    'Project Title', 'Project Description', 'Website URL', 'GitHub Repo', 'Google Drive URL', 'Admin URL',
    'MCQ Score', 'Admin Rating', 'Admin Comments', 'Status', 'Priority', 'Tags', 'Notes',
    'Added At', 'Last Modified'
  ];

  const csvRows = entries.map((entry, index) => [
    index + 1,
    entry._id,
    entry.fullName,
    entry.email,
    entry.phone,
    entry.collegeName,
    entry.department,
    entry.role,
    entry.year,
    entry.semester,
    entry.projectTitle,
    entry.projectDescription,
    entry.websiteUrl,
    entry.githubRepo,
    entry.googleDriveUrl,
    entry.adminUrl,
    `${entry.mcqScore?.correctAnswers || 0}/${entry.mcqScore?.totalQuestions || 0} (${entry.mcqScore?.percentage || 0}%)`,
    entry.adminRating || '',
    entry.adminComments || '',
    entry.status,
    entry.priority,
    (entry.tags || []).join('; '),
    entry.notes || '',
    entry.createdAt ? new Date(entry.createdAt).toISOString() : '',
    entry.lastModifiedAt ? new Date(entry.lastModifiedAt).toISOString() : ''
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
};

const exportToExcel = async () => {
  // For now, return CSV data. In a real implementation, you'd use a library like exceljs
  // to create proper Excel files
  return await exportToCSV();
};

module.exports = {
  getAllEntries,
  getEntryById,
  addToExcelSheet,
  updateEntry,
  bulkUpdateEntries,
  removeEntry,
  bulkRemoveEntries,
  exportToCSV,
  exportToExcel
};