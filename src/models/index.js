// Central export for models
const User = require('./user.model');
const Submission = require('./submission.model');
const MCQQuestion = require('./mcqQuestion.model');
const File = require('./file.model');
const OTP = require('./otp.model');
const ExcelSheetEntry = require('./excelSheet.model');

module.exports = {
  User,
  Submission,
  MCQQuestion,
  File,
  OTP,
  ExcelSheetEntry
};
