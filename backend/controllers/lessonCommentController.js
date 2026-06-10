const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const LessonComment = require('../models/LessonComment');
const { isStudentRole } = require('../utils/userUtils');
const { getPaginationParams, buildPagination } = require('../utils/pagination');
const catchAsync = require('../utils/catchAsync');

const listComments = catchAsync(async (req, res) => {
  const { lessonId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    return res.status(400).json({ message: 'lessonId không hợp lệ.' });
  }

  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) {
    return res.status(404).json({ message: 'Không tìm thấy bài học.' });
  }

  const filter = { lesson: lesson._id, isDeleted: false };
  const { page, limit, skip } = getPaginationParams(req.query);
  const [comments, totalItems] = await Promise.all([
    LessonComment.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LessonComment.countDocuments(filter)
  ]);

  res.json({
    data: comments,
    comments,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const createComment = catchAsync(async (req, res) => {
  const { lessonId } = req.params;
  const { content, parentCommentId } = req.body;

  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'Nội dung bình luận không được rỗng.' });
  }

  if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    return res.status(400).json({ message: 'lessonId không hợp lệ.' });
  }

  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) {
    return res.status(404).json({ message: 'Không tìm thấy bài học.' });
  }

  // If student role, ensure enrolled
  if (isStudentRole(req.currentUser.role)) {
    const enrolled = await Enrollment.findOne({ course: lesson.course, student: req.currentUser._id }).lean();
    if (!enrolled) {
      return res.status(403).json({ message: 'Cần tham gia lớp để bình luận bài học.' });
    }
  }

  const course = await Course.findById(lesson.course).lean();
  let parentComment = null;

  if (parentCommentId) {
    if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
      return res.status(400).json({ message: 'parentCommentId không hợp lệ.' });
    }

    parentComment = await LessonComment.findOne({
      _id: parentCommentId,
      lesson: lesson._id,
      isDeleted: false
    }).lean();

    if (!parentComment) {
      return res.status(404).json({ message: 'Không tìm thấy bình luận gốc để trả lời.' });
    }
  }

  const created = await LessonComment.create({
    lesson: lesson._id,
    course: course ? course._id : null,
    parentComment: parentComment ? parentComment._id : null,
    author: req.currentUser?._id || null,
    authorName: req.currentUser?.username || req.currentUser?.profile?.displayName || 'Khách',
    content: String(content).trim()
  });

  res.status(201).json({ message: 'Đã thêm bình luận.', comment: created });
});

const deleteComment = catchAsync(async (req, res) => {
  const { commentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ message: 'commentId không hợp lệ.' });
  }

  const comment = await LessonComment.findById(commentId);
  if (!comment || comment.isDeleted) {
    return res.status(404).json({ message: 'Không tìm thấy bình luận.' });
  }

  const requester = req.currentUser;
  // allow if admin or teacher
  if (requester.role === 'admin' || requester.role === 'teacher') {
    await LessonComment.updateMany(
      { $or: [{ _id: comment._id }, { parentComment: comment._id }], isDeleted: false },
      {
        $set: {
          isDeleted: true
        }
      }
    );
    return res.json({ message: 'Đã xóa bình luận.' });
  }

  // allow if owner
  if (String(comment.author) === String(requester._id) || comment.authorName === requester.username) {
    await LessonComment.updateMany(
      { $or: [{ _id: comment._id }, { parentComment: comment._id }], isDeleted: false },
      {
        $set: {
          isDeleted: true
        }
      }
    );
    return res.json({ message: 'Đã xóa bình luận.' });
  }

  return res.status(403).json({ message: 'Bạn không có quyền xóa bình luận này.' });
});

module.exports = { listComments, createComment, deleteComment };
