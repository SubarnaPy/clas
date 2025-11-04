const { Submission, MCQQuestion, User, ExcelSheetEntry } = require('../models');
const { logger } = require('../utils/logger');

const getDashboardAnalytics = async () => {
  try {
    // Get basic counts
    const [totalSubmissions, totalQuestions, activeQuestions, totalUsers, excelSheetEntries] = await Promise.all([
      Submission.countDocuments(),
      MCQQuestion.countDocuments(),
      MCQQuestion.countDocuments({ isActive: true }),
      User.countDocuments(),
      ExcelSheetEntry.countDocuments()
    ]);

    // Get submissions for different time periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [submissionsToday, submissionsThisWeek, submissionsThisMonth] = await Promise.all([
      Submission.countDocuments({ createdAt: { $gte: today } }),
      Submission.countDocuments({ createdAt: { $gte: weekStart } }),
      Submission.countDocuments({ createdAt: { $gte: monthStart } })
    ]);

    // Calculate average MCQ score
    const submissionsWithScores = await Submission.find({
      'mcqScore.totalQuestions': { $gt: 0 }
    }).select('mcqScore');

    let totalAverageScore = 0;
    let submissionsWithValidScores = 0;

    submissionsWithScores.forEach(sub => {
      if (sub.mcqScore && sub.mcqScore.percentage !== undefined) {
        totalAverageScore += sub.mcqScore.percentage;
        submissionsWithValidScores++;
      }
    });

    const averageScore = submissionsWithValidScores > 0 ? totalAverageScore / submissionsWithValidScores : 0;

    // Calculate passing rate (assuming 60% is passing)
    const passingSubmissions = submissionsWithScores.filter(sub =>
      sub.mcqScore && sub.mcqScore.percentage >= 60
    ).length;
    const passingRate = submissionsWithValidScores > 0 ? (passingSubmissions / submissionsWithValidScores) * 100 : 0;

    // Get category stats (by role/department)
    const roleStats = await Submission.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$personalInfo.role', 'Not Specified'] },
          count: { $sum: 1 },
          totalScore: { $sum: { $ifNull: ['$mcqScore.percentage', 0] } },
          validScores: {
            $sum: {
              $cond: {
                if: { $and: ['$mcqScore.percentage', { $ne: ['$mcqScore.percentage', null] }] },
                then: 1,
                else: 0
              }
            }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          averageScore: {
            $cond: {
              if: { $gt: ['$validScores', 0] },
              then: { $divide: ['$totalScore', '$validScores'] },
              else: 0
            }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get recent activity (last 10 submissions)
    const recentSubmissions = await Submission.find()
      .select('personalInfo.fullName personalInfo.email status createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentActivity = recentSubmissions.map(sub => ({
      type: 'submission',
      description: `${sub.personalInfo?.fullName || 'Unknown'} submitted an application`,
      timestamp: sub.createdAt.toISOString()
    }));

    return {
      totalSubmissions,
      totalUsers,
      totalQuestions,
      activeQuestions,
      excelSheetEntries,
      submissionsToday,
      submissionsThisWeek,
      submissionsThisMonth,
      averageScore: Math.round(averageScore * 100) / 100,
      passingRate: Math.round(passingRate * 100) / 100,
      categoryStats: roleStats,
      recentActivity
    };
  } catch (error) {
    logger.error('Error fetching dashboard analytics:', error);
    throw error;
  }
};

const getDetailedAnalytics = async ({ startDate, endDate, category }) => {
  try {
    const matchConditions = {};

    if (startDate || endDate) {
      matchConditions.createdAt = {};
      if (startDate) matchConditions.createdAt.$gte = new Date(startDate);
      if (endDate) matchConditions.createdAt.$lte = new Date(endDate);
    }

    if (category) {
      matchConditions['personalInfo.role'] = category;
    }

    const detailedStats = await Submission.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          averageScore: { $avg: '$mcqScore.percentage' },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return detailedStats;
  } catch (error) {
    logger.error('Error fetching detailed analytics:', error);
    throw error;
  }
};

const getSubmissionTrends = async (period = '30d') => {
  try {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await Submission.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return trends;
  } catch (error) {
    logger.error('Error fetching submission trends:', error);
    throw error;
  }
};

module.exports = {
  getDashboardAnalytics,
  getDetailedAnalytics,
  getSubmissionTrends
};