const LessonView = require('../models/LessonView');
const catchAsync = require('../utils/catchAsync');

const getAdminLessonAnalytics = catchAsync(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [totalLessonViews, uniqueLessonViewers, topLessons, viewsLast30Days] = await Promise.all([
    LessonView.countDocuments(),
    LessonView.distinct('user', { user: { $ne: null } }),
    LessonView.aggregate([
      {
        $group: {
          _id: '$lesson',
          views: { $sum: 1 }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: '_id',
          as: 'lesson'
        }
      },
      { $unwind: { path: '$lesson', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'courses',
          localField: 'lesson.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          lessonId: '$_id',
          lessonTitle: '$lesson.title',
          courseTitle: '$course.title',
          views: 1
        }
      }
    ]),
    LessonView.aggregate([
      { $match: { viewedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$viewedAt',
            timezone: 'Asia/Ho_Chi_Minh'
          }
        },
        views: { $sum: 1 }
      }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const totalLast30Days = viewsLast30Days.reduce((sum, item) => sum + item.views, 0);

  res.json({
    totalLessonViews,
    uniqueLessonViewers: uniqueLessonViewers.length,
    topLessons,
    totalLast30Days,
    viewsLast30Days
  });
});

module.exports = {
  getAdminLessonAnalytics
};
