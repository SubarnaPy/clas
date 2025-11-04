const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFile, getFileById, deleteFile, listUserFiles } = require('../services/file.service');
const { logger } = require('../utils/logger');

// Configure multer storage to ./uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname.replace(/\s+/g,'_')}`;
    cb(null, unique);
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

const handleUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    const fileRecord = await uploadFile({
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      destination: req.file.destination,
      userId: req.user && req.user.id,
      submissionId: req.body.submissionId
    });
    res.status(201).json({ success: true, data: { file: fileRecord } });
  } catch (err) {
    logger.error('File upload error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to upload file' } });
  }
};

const download = async (req, res) => {
  try {
    const f = await getFileById(req.params.id);
    if (!f) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'File not found' } });
    // Authorization checks (owner or admin)
    const user = req.user || {};
    if (!(user.roles || []).includes('admin') && f.userId && f.userId.toString() !== user.id) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }
    res.download(f.path, f.originalName);
  } catch (err) {
    logger.error('File download error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to download file' } });
  }
};

const getMetadata = async (req, res) => {
  try {
    const f = await getFileById(req.params.id);
    if (!f) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'File not found' } });
    res.json({ success: true, data: { file: f } });
  } catch (err) {
    logger.error('Get file metadata error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get file' } });
  }
};

const removeFile = async (req, res) => {
  try {
    const actor = { id: req.user && req.user.id, roles: req.user && req.user.roles };
    await deleteFile(req.params.id, actor);
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete file error', err);
    const status = err.status || 500;
    res.status(status).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message || 'Failed to delete file' } });
  }
};

const listFiles = async (req, res) => {
  try {
    const files = await listUserFiles(req.user.id);
    res.json({ success: true, data: { files } });
  } catch (err) {
    logger.error('List files error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to list files' } });
  }
};

module.exports = { uploadMiddleware: upload.single('file'), handleUpload, download, getMetadata, removeFile, listFiles };
