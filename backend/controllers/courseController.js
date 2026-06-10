const mongoose = require('mongoose');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const ForumPost = require('../models/ForumPost');
const ForumComment = require('../models/ForumComment');
const LessonComment = require('../models/LessonComment');
const LessonView = require('../models/LessonView');
const { getPaginationParams, buildPagination } = require('../utils/pagination');
const catchAsync = require('../utils/catchAsync');

const getCourseCounts = async (courses) => {
  return Promise.all(courses.map(async (course) => {
    const [lessonCount, enrollmentCount] = await Promise.all([
      Lesson.countDocuments({ course: course._id }),
      Enrollment.countDocuments({ course: course._id })
    ]);
    return {
      ...course,
      lessonCount,
      studentCount: enrollmentCount,
      enrollmentCount
    };
  }));
};

const listCourses = catchAsync(async (req, res) => {
  const { category } = req.query;
  const filter = {};
  if (category) {
    filter.category = category.trim();
  }

  const { page, limit, skip } = getPaginationParams(req.query);
  const [courses, totalItems] = await Promise.all([
    Course.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(filter)
  ]);

  const coursesWithCounts = await getCourseCounts(courses);

  res.json({
    data: coursesWithCounts,
    courses: coursesWithCounts,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const listMyCourses = catchAsync(async (req, res) => {
  const teacherId = req.currentUser?._id;
  const filter = { teacher: teacherId };
  const { page, limit, skip } = getPaginationParams(req.query);
  const [courses, totalItems] = await Promise.all([
    Course.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(filter)
  ]);

  const coursesWithCounts = await getCourseCounts(courses);

  res.json({
    data: coursesWithCounts,
    courses: coursesWithCounts,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const getCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.courseId).lean();
  if (!course) {
    return res.status(404).json({ message: 'Không tìm thấy lớp học.' });
  }

  res.json({ course });
});

const createCourse = catchAsync(async (req, res) => {
  const { title, category, description, imageUrl, status } = req.body;

  if (!title || !category) {
    return res.status(400).json({ message: 'Thiếu tiêu đề hoặc danh mục.' });
  }

  const teacher = req.currentUser;
  const created = await Course.create({
    title: title.trim(),
    category: category.trim(),
    description: description?.trim() || '',
    imageUrl: imageUrl?.trim() || '',
    status: status === 'draft' ? 'draft' : 'published',
    teacher: teacher._id,
    teacherName: teacher.username
  });

  res.status(201).json({
    message: 'Đã tạo lớp học.',
    course: created
  });
});

const updateCourse = catchAsync(async (req, res) => {
  const { title, category, description, imageUrl, status } = req.body;
  const course = await Course.findById(req.params.courseId);

  if (!course) {
    return res.status(404).json({ message: 'Không tìm thấy lớp học.' });
  }

  if (req.currentUser.role === 'teacher' && String(course.teacher) !== String(req.currentUser._id)) {
    return res.status(403).json({ message: 'Bạn không có quyền sửa lớp học này.' });
  }

  if (title) course.title = title.trim();
  if (category) course.category = category.trim();
  if (description !== undefined) course.description = description.trim();
  if (imageUrl !== undefined) course.imageUrl = imageUrl.trim();
  if (status) course.status = status === 'draft' ? 'draft' : 'published';

  await course.save();

  res.json({ message: 'Đã cập nhật lớp học.', course });
});

const deleteCourse = catchAsync(async (req, res) => {
  const session = await mongoose.startSession();
  let transactionEnded = false;

  try {
    session.startTransaction();

    const course = await Course.findById(req.params.courseId).session(session);

    if (!course) {
      await session.abortTransaction();
      transactionEnded = true;
      return res.status(404).json({ message: 'Khong tim thay lop hoc.' });
    }

    if (req.currentUser.role === 'teacher' && String(course.teacher) !== String(req.currentUser._id)) {
      await session.abortTransaction();
      transactionEnded = true;
      return res.status(403).json({ message: 'Ban khong co quyen xoa lop hoc nay.' });
    }

    const [assignmentIds, forumPostIds] = await Promise.all([
      Assignment.find({ course: course._id }, { _id: 1 }).session(session).lean(),
      ForumPost.find({ scope: 'course', course: course._id }, { _id: 1 }).session(session).lean()
    ]);

    const assignmentObjectIds = assignmentIds.map(item => item._id);
    const forumPostObjectIds = forumPostIds.map(item => item._id);

    await Promise.all([
      Lesson.deleteMany({ course: course._id }).session(session),
      LessonComment.deleteMany({ course: course._id }).session(session),
      LessonView.deleteMany({ course: course._id }).session(session),
      Enrollment.deleteMany({ course: course._id }).session(session),
      Submission.deleteMany({
        $or: [
          { course: course._id },
          { assignment: { $in: assignmentObjectIds } }
        ]
      }).session(session),
      Assignment.deleteMany({ course: course._id }).session(session),
      ForumComment.deleteMany({ postId: { $in: forumPostObjectIds } }).session(session),
      ForumPost.deleteMany({ scope: 'course', course: course._id }).session(session)
    ]);

    await course.deleteOne({ session });
    await session.commitTransaction();
    transactionEnded = true;

    res.json({ message: 'Da xoa lop hoc.' });
  } finally {
    if (!transactionEnded) {
      await session.abortTransaction();
    }
    session.endSession();
  }
});

module.exports = {
  listCourses,
  listMyCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
};
