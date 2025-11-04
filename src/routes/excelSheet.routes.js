const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const excelSheetController = require('../controllers/excelSheet.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { runValidation } = require('../middleware/validation');

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole('admin'));

// Get all Excel sheet entries
router.get('/', excelSheetController.getAllEntries);

// Get single entry
router.get('/:id', excelSheetController.getEntry);

// Add submission to Excel sheet
router.post('/add/:submissionId', excelSheetController.addToExcelSheet);

// Update Excel sheet entry
router.put('/:id', excelSheetController.updateEntry);

// Bulk update entries
router.put('/bulk/update', excelSheetController.bulkUpdateEntries);

// Remove entry from Excel sheet
router.delete('/:id', excelSheetController.removeEntry);

// Bulk remove entries
router.delete('/bulk/remove', excelSheetController.bulkRemoveEntries);

// Export Excel sheet data
router.get('/export/csv', excelSheetController.exportToCSV);
router.get('/export/excel', excelSheetController.exportToExcel);

module.exports = router;