const { MCQQuestion } = require('../models');
const mongoose = require('mongoose');

const normalizeCategory = (cat) => {
  if (!cat) return cat;
  const s = String(cat).trim().toLowerCase();
  if (['full stack developer', 'full-stack developer', 'fullstack developer', 'fullstack'].includes(s)) return 'Full Stack Developer';
  if (['python developer', 'python'].includes(s)) return 'Python Developer';
  if (['backend developer', 'backend'].includes(s)) return 'Backend Developer';
  if (['frontend developer', 'frontend'].includes(s)) return 'Frontend Developer';
  if (['ui/ux designer', 'ui ux designer', 'ux designer', 'ui designer', 'uiux designer'].includes(s)) return 'UI/UX Designer';
  // fallback: title-case words
  return String(cat).trim();
};

const sanitizeQuestionPayload = (data) => {
  const payload = {};
  payload.question = data.question || data.questionText || data.q || '';
  // Ensure options is an array
  if (Array.isArray(data.options)) payload.options = data.options.map(String);
  else if (typeof data.options === 'string') payload.options = data.options.split('|').map(s => s.trim());
  else {
    // try to pick option1..4 fields
    const opts = [];
    for (let i = 1; i <= 4; i++) {
      const k = `option${i}`;
      if (data[k]) opts.push(String(data[k]));
    }
    payload.options = opts;
  }

  // correct answer may come as 'correctAnswer' or 'correct_answer' and may be numeric index or text
  let ca = undefined;
  if (data.correctAnswer !== undefined) ca = data.correctAnswer;
  else if (data.correct_answer !== undefined) ca = data.correct_answer;

  if (typeof ca === 'string' && ca.trim() !== '' && /^[0-9]+$/.test(ca.trim())) {
    payload.correctAnswer = parseInt(ca.trim(), 10);
  } else if (typeof ca === 'number') {
    payload.correctAnswer = ca;
  } else if (typeof ca === 'string') {
    // try match by option text
    const idx = payload.options.findIndex(o => o && String(o).trim().toLowerCase() === ca.trim().toLowerCase());
    payload.correctAnswer = idx >= 0 ? idx : 0;
  } else {
    payload.correctAnswer = 0;
  }

  payload.category = normalizeCategory(data.category || data.subject || data.subject);
  payload.difficulty = data.difficulty || 'medium';
  payload.points = Number(data.points || data.points === 0 ? data.points : 1) || 1;
  if (data.isActive !== undefined) {
    const v = data.isActive;
    if (typeof v === 'boolean') payload.isActive = v;
    else if (typeof v === 'string') payload.isActive = /^(true|1|yes)$/i.test(v.trim());
    else payload.isActive = Boolean(v);
  } else payload.isActive = true;

  return payload;
};

const createQuestion = async (data) => {
  const payload = sanitizeQuestionPayload(data);
  const q = new MCQQuestion(payload);
  await q.save();
  return q;
};

const updateQuestion = async (id, updates) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return MCQQuestion.findByIdAndUpdate(id, updates, { new: true }).lean();
};

const deleteQuestion = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return MCQQuestion.findByIdAndDelete(id);
};

const getQuestionById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return MCQQuestion.findById(id).lean();
};

const listQuestions = async ({ page = 1, limit = 50, filter = {} } = {}) => {
  const skip = (page - 1) * limit;
  const query = { isActive: true };
  if (filter.category) {
    // match category case-insensitively to be resilient to client-side casing/spacing
    const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const raw = String(filter.category).trim();
    query.category = new RegExp(`^${escapeRegExp(raw)}$`, 'i');
  }
  if (filter.difficulty) query.difficulty = filter.difficulty;
  const [items, total] = await Promise.all([
    MCQQuestion.find(query).skip(skip).limit(limit).lean(),
    MCQQuestion.countDocuments(query)
  ]);
  // Transform to match frontend expectations
  const transformed = items.map(item => ({
    id: item._id.toString(),
    question: item.question,
    options: item.options,
    // Keep correct_answer as the index (number) so frontend can compare easily
    correct_answer: typeof item.correctAnswer === 'number' ? item.correctAnswer : (parseInt(item.correctAnswer, 10) || 0),
    // Also provide text form for convenience (guard out-of-range)
    correct_answer_text: (Array.isArray(item.options) && item.options[item.correctAnswer]) ? item.options[item.correctAnswer] : (Array.isArray(item.options) ? item.options[0] : undefined),
    subject: item.category || 'General',
    category: item.category,
    difficulty: item.difficulty,
    points: item.points
  }));
  return { items: transformed, total, page, limit, pages: Math.ceil(total / limit) };
};

const settingService = require('./setting.service');

const validateAnswers = async (answers = []) => {
  // answers: [{ questionId, selectedAnswer }]
  const ids = answers.map(a => a.questionId).filter(id => mongoose.Types.ObjectId.isValid(id));
  const questions = await MCQQuestion.find({ _id: { $in: ids } }).lean();
  const map = new Map(questions.map(q => [q._id.toString(), q]));
  let correct = 0;
  let totalPoints = 0;
  let scoredPoints = 0;
  const details = [];
  for (const ans of answers) {
    const q = map.get(ans.questionId);
    if (!q) {
      details.push({ questionId: ans.questionId, correct: false, reason: 'not_found' });
      continue;
    }
    totalPoints += (q.points || 1);
    const correctAnswerText = q.options[q.correctAnswer];
    // Treat null or explicit skipped marker as skipped (not answered)
    const skipped = ans.selectedAnswer === null || ans.selectedAnswer === '__SKIPPED__';
    let isCorrect = false;
    if (!skipped) {
      isCorrect = ans.selectedAnswer === correctAnswerText;
    }
    if (isCorrect) {
      correct += 1;
      scoredPoints += (q.points || 1);
    }
    details.push({
      questionId: q._id.toString(),
      isCorrect,
      skipped: !!skipped,
      selected: ans.selectedAnswer,
      correctAnswer: correctAnswerText,
      points: q.points || 1
    });
  }
  const percentage = totalPoints === 0 ? 0 : Math.round((scoredPoints / totalPoints) * 100);
  // Read passing threshold from settings (default 90)
  let threshold = 90;
  try {
    const v = await settingService.getSetting('mcq_passing_percentage');
    if (typeof v === 'number') threshold = v;
    else if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) threshold = Number(v);
  } catch (e) {
    // ignore and use default
  }

  const passed = percentage >= threshold;
  const feedback = passed 
    ? "Excellent performance! You have successfully passed the assessment."
    : `Assessment not passed. The passing score is ${threshold}%. Please review your answers and try again.`;
  return { 
    totalQuestions: answers.length, 
    correctCount: correct, 
    percentage, 
    passed,
    feedback,
    details 
  };
};

const bulkCreateQuestions = async (questions = []) => {
  const docs = questions.map(data => new MCQQuestion(sanitizeQuestionPayload(data)));
  const created = await MCQQuestion.insertMany(docs);
  return created;
};

module.exports = { createQuestion, bulkCreateQuestions, updateQuestion, deleteQuestion, getQuestionById, listQuestions, validateAnswers };
