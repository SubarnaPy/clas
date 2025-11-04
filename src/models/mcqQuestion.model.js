const mongoose = require('mongoose');

const mcqQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true, validate: v => Array.isArray(v) && v.length >= 2 },
  correctAnswer: { type: Number, required: true },
  category: {
    type: String,
    enum: [
      'Full Stack Developer',
      'Python Developer',
      'Backend Developer',
      'Frontend Developer',
      'UI/UX Designer'
    ],
  },
  difficulty: { type: String, enum: ['easy','medium','hard'], default: 'medium' },
  points: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes for efficient querying
mcqQuestionSchema.index({ category: 1 });
mcqQuestionSchema.index({ difficulty: 1 });

module.exports = mongoose.model('MCQQuestion', mcqQuestionSchema);
