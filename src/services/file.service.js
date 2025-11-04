const { File, Submission } = require('../models');
const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');

const uploadFile = async ({ originalname, filename, mimetype, size, destination, userId, submissionId }) => {
  const file = new File({
    originalName: originalname,
    filename,
    mimetype,
    size,
    path: path.join(destination, filename),
    userId: userId ? mongoose.Types.ObjectId(userId) : undefined,
    submissionId: submissionId ? mongoose.Types.ObjectId(submissionId) : undefined,
    uploadedAt: new Date()
  });
  await file.save();
  // If attached to a submission, push file id into submission.fileIds
  if (submissionId && mongoose.Types.ObjectId.isValid(submissionId)) {
    try {
      await Submission.findByIdAndUpdate(submissionId, { $addToSet: { fileIds: file._id } });
    } catch (err) {
      // Don't fail upload if linking fails; just log
      // eslint-disable-next-line no-console
      console.warn('Failed to link file to submission', err);
    }
  }
  return file;
};

const getFileById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return File.findById(id).lean();
};

const deleteFile = async (id, actor) => {
  const f = await File.findById(id);
  if (!f) return null;
  // Authorization: owner or admin
  if (actor && actor.id && actor.roles && !actor.roles.includes('admin')) {
    if (f.userId && f.userId.toString() !== actor.id) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
  }
  try {
    // delete physical file if exists
    await fs.unlink(f.path).catch(() => {});
  } catch (e) {
    // ignore file deletion errors
  }
  // remove reference from submission if present
  if (f.submissionId) {
    try {
      await Submission.findByIdAndUpdate(f.submissionId, { $pull: { fileIds: f._id } });
    } catch (e) {
      // ignore
    }
  }
  await f.remove();
  return true;
};

const listUserFiles = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) return [];
  return File.find({ userId: mongoose.Types.ObjectId(userId) }).lean();
};

module.exports = { uploadFile, getFileById, deleteFile, listUserFiles };
