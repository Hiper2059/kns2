const Assignment = require('../models/Assignment');
const Category = require('../models/Category');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const ForumComment = require('../models/ForumComment');
const ForumPost = require('../models/ForumPost');
const Lesson = require('../models/Lesson');
const LessonComment = require('../models/LessonComment');
const ModerationReport = require('../models/ModerationReport');
const Submission = require('../models/Submission');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

const deleteManyAndCount = async (Model, filter) => {
  const result = await Model.deleteMany(filter);
  return result.deletedCount || 0;
};

const hardDeleteUserCascade = async user => {
  const userId = user._id;
  const userIdString = String(userId);
  const username = user.username;

  const ownedCourses = await Course.find({ teacher: userId }, { _id: 1 }).lean();
  const ownedCourseIds = ownedCourses.map(item => item._id);

  const relatedAssignments = await Assignment.find(
    {
      $or: [
        { createdBy: userId },
        { course: { $in: ownedCourseIds } }
      ]
    },
    { _id: 1 }
  ).lean();
  const relatedAssignmentIds = relatedAssignments.map(item => item._id);

  const relatedForumPosts = await ForumPost.find(
    {
      $or: [
        { author: username },
        { course: { $in: ownedCourseIds } }
      ]
    },
    { _id: 1 }
  ).lean();
  const relatedForumPostIds = relatedForumPosts.map(item => item._id);

  const authoredLessonComments = await LessonComment.find({ author: userId }, { _id: 1 }).lean();
  const authoredLessonCommentIds = authoredLessonComments.map(item => item._id);

  await Promise.all([
    ForumPost.updateMany({}, { $pull: { heartUserIds: userIdString } }),
    Lesson.updateMany({}, { $pull: { heartUserIds: userIdString } })
  ]);

  const counts = {};

  counts.forumComments = await deleteManyAndCount(ForumComment, {
    $or: [
      { author: username },
      { deletedBy: username },
      { postId: { $in: relatedForumPostIds } }
    ]
  });

  counts.forumPosts = await deleteManyAndCount(ForumPost, {
    _id: { $in: relatedForumPostIds }
  });

  counts.lessonComments = await deleteManyAndCount(LessonComment, {
    $or: [
      { author: userId },
      { parentComment: { $in: authoredLessonCommentIds } },
      { course: { $in: ownedCourseIds } }
    ]
  });

  counts.submissions = await deleteManyAndCount(Submission, {
    $or: [
      { student: userId },
      { course: { $in: ownedCourseIds } },
      { assignment: { $in: relatedAssignmentIds } }
    ]
  });

  counts.assignments = await deleteManyAndCount(Assignment, {
    _id: { $in: relatedAssignmentIds }
  });

  counts.enrollments = await deleteManyAndCount(Enrollment, {
    $or: [
      { student: userId },
      { teacher: userId },
      { course: { $in: ownedCourseIds } }
    ]
  });

  counts.lessons = await deleteManyAndCount(Lesson, {
    $or: [
      { createdBy: userId },
      { course: { $in: ownedCourseIds } }
    ]
  });

  counts.courses = await deleteManyAndCount(Course, {
    _id: { $in: ownedCourseIds }
  });

  counts.moderationReports = await deleteManyAndCount(ModerationReport, {
    $or: [
      { reporter: username },
      { targetAuthor: username }
    ]
  });

  counts.categories = await deleteManyAndCount(Category, { createdBy: username });
  counts.userProfiles = await deleteManyAndCount(UserProfile, { user: userId });
  counts.users = await deleteManyAndCount(User, { _id: userId });

  return counts;
};

module.exports = { hardDeleteUserCascade };
