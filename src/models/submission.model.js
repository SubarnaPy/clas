const mongoose = require('mongoose');

const personalInfoSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  collegeName: { type: String, required: true },
  department: { type: String, required: true },
  // role: the applied job role (e.g., 'Frontend Developer')
  role: { type: String },
  year: { type: String, required: true },
  semester: { type: String, required: true }
}, { _id: false });

const projectDetailsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  websiteUrl: { type: String },
  githubRepo: { type: String }
}, { _id: false });

const mcqAnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'MCQQuestion' },
  selectedAnswer: { type: Number },
  isCorrect: { type: Boolean }
}, { _id: false });

const mcqScoreSchema = new mongoose.Schema({
  totalQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  // userId is optional to allow anonymous submissions (students may not need to log in)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  personalInfo: { type: personalInfoSchema, required: true },
  projectDetails: { type: projectDetailsSchema, required: true },
  mcqAnswers: { type: [mcqAnswerSchema], default: [] },
  mcqScore: { type: mcqScoreSchema, default: () => ({}) },
  fileIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
  status: { type: String, enum: ['draft','submitted','under_review','approved','rejected'], default: 'draft' },
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Admin review fields
  adminRating: { type: Number, min: 1, max: 5 }, // 1-5 star rating
  adminComments: { type: String },
  adminReviewHistory: [{
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comments: { type: String },
    reviewedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['under_review','approved','rejected'] }
  }],
  // Additional metadata
  tags: [{ type: String }], // Admin can add tags like 'featured', 'needs_improvement', etc.
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  notes: { type: String }, // Internal admin notes
  emailNotifications: {
    statusUpdates: { type: Boolean, default: true },
    reviewComplete: { type: Boolean, default: true },
    reminders: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Index to help find submissions by user and status
submissionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
