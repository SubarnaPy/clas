const mongoose = require('mongoose');

const excelSheetEntrySchema = new mongoose.Schema({
  // Reference to original submission
  submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },

  // Student personal information (editable)
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  collegeName: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String }, // Applied job role
  year: { type: String, required: true },
  semester: { type: String, required: true },

  // Project details (editable)
  projectTitle: { type: String, required: true },
  projectDescription: { type: String },
  websiteUrl: { type: String },
  githubRepo: { type: String },
  googleDriveUrl: { type: String },

  // MCQ Score
  mcqScore: {
    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },

  // Admin review data
  adminRating: { type: Number, min: 1, max: 5 },
  adminComments: { type: String },
  adminUrl: { type: String }, // Custom URL that admin can add for each student

  // Excel sheet specific fields
  status: { type: String, enum: ['pending', 'under-review', 'van', 'shortlisted', 'selected', 'rejected'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  tags: [{ type: String }],
  notes: { type: String },

  // Additional custom fields that admin can add
  customFields: { type: Map, of: String },

  // Metadata
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for efficient queries
excelSheetEntrySchema.index({ status: 1, priority: 1 });
excelSheetEntrySchema.index({ addedBy: 1 });
excelSheetEntrySchema.index({ submissionId: 1 }, { unique: true }); // One entry per submission

module.exports = mongoose.model('ExcelSheetEntry', excelSheetEntrySchema);