const excelSheetService = require('../services/excelSheet.service');
const { logger } = require('../utils/logger');

const getAllEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.search) filter.search = req.query.search;

    const result = await excelSheetService.getAllEntries({ page, limit, filter });
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Get Excel sheet entries error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch Excel sheet entries' } });
  }
};

const getEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await excelSheetService.getEntryById(id);
    if (!entry) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Excel sheet entry not found' } });
    }
    res.json({ success: true, data: { entry } });
  } catch (err) {
    logger.error('Get Excel sheet entry error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch Excel sheet entry' } });
  }
};

const addToExcelSheet = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const entry = await excelSheetService.addToExcelSheet(submissionId, req.user.id);
    res.status(201).json({ success: true, data: { entry } });
  } catch (err) {
    logger.error('Add to Excel sheet error', err);
    const status = err.status || 500;
    res.status(status).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message || 'Failed to add to Excel sheet' } });
  }
};

const updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const entry = await excelSheetService.updateEntry(id, updates, req.user.id);
    res.json({ success: true, data: { entry } });
  } catch (err) {
    logger.error('Update Excel sheet entry error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update Excel sheet entry' } });
  }
};

const bulkUpdateEntries = async (req, res) => {
  try {
    const { entryIds, updates } = req.body;
    if (!entryIds || !Array.isArray(entryIds) || !updates) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'entryIds array and updates are required' } });
    }
    const result = await excelSheetService.bulkUpdateEntries(entryIds, updates, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Bulk update Excel sheet entries error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to bulk update entries' } });
  }
};

const removeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    await excelSheetService.removeEntry(id);
    res.json({ success: true });
  } catch (err) {
    logger.error('Remove Excel sheet entry error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to remove Excel sheet entry' } });
  }
};

const bulkRemoveEntries = async (req, res) => {
  try {
    const { entryIds } = req.body;
    if (!entryIds || !Array.isArray(entryIds)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'entryIds array is required' } });
    }
    const result = await excelSheetService.bulkRemoveEntries(entryIds);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Bulk remove Excel sheet entries error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to bulk remove entries' } });
  }
};

const exportToCSV = async (req, res) => {
  try {
    const csvData = await excelSheetService.exportToCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=excel_sheet_export.csv');
    res.send(csvData);
  } catch (err) {
    logger.error('Export Excel sheet to CSV error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to export to CSV' } });
  }
};

const exportToExcel = async (req, res) => {
  try {
    const excelData = await excelSheetService.exportToExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=excel_sheet_export.xlsx');
    res.send(excelData);
  } catch (err) {
    logger.error('Export Excel sheet to Excel error', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to export to Excel' } });
  }
};

module.exports = {
  getAllEntries,
  getEntry,
  addToExcelSheet,
  updateEntry,
  bulkUpdateEntries,
  removeEntry,
  bulkRemoveEntries,
  exportToCSV,
  exportToExcel
};