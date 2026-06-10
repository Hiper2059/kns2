const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { isStudentRole } = require('../utils/userUtils');
const { getPaginationParams, buildPagination } = require('../utils/pagination');
const catchAsync = require('../utils/catchAsync');

const enrollCourse = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  if (!isStudentRole(req.currentUser.role)) {
    return res.status(403).json({ message: 'Chỉ học viên mới được tham gia lớp.' });
  }

  const course = await Course.findById(courseId).lean();
  if (!course) {
    return res.status(404).json({ message: 'Không tìm thấy lớp học.' });
  }

  const exists = await Enrollment.findOne({ course: courseId, student: req.currentUser._id }).lean();
  if (exists) {
    return res.status(400).json({ message: 'Cậu đã tham gia lớp này rồi.' });
  }

  const created = await Enrollment.create({
    student: req.currentUser._id,
    studentName: req.currentUser.username,
    course: course._id,
    courseTitle: course.title,
    teacher: course.teacher,
    teacherName: course.teacherName
  });

  res.status(201).json({ message: 'Đã tham gia lớp học.', enrollment: created });
});

const listMyEnrollments = catchAsync(async (req, res) => {
  const filter = { student: req.currentUser._id };
  const { page, limit, skip } = getPaginationParams(req.query);
  const [enrollments, totalItems] = await Promise.all([
    Enrollment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Enrollment.countDocuments(filter)
  ]);

  res.json({
    data: enrollments,
    enrollments,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const listCourseEnrollments = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId).lean();
  if (!course) {
    return res.status(404).json({ message: 'Không tìm thấy lớp học.' });
  }

  if (req.currentUser.role === 'teacher' && String(course.teacher) !== String(req.currentUser._id)) {
    return res.status(403).json({ message: 'Bạn không có quyền xem học viên của lớp này.' });
  }

  const filter = { course: courseId };
  const { page, limit, skip } = getPaginationParams(req.query);
  const [enrollments, totalItems] = await Promise.all([
    Enrollment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Enrollment.countDocuments(filter)
  ]);

  res.json({
    data: enrollments,
    enrollments,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const completeLesson = catchAsync(async (req, res) => {
  const { lessonId } = req.params;

  if (!isStudentRole(req.currentUser.role)) {
    return res.status(403).json({ message: 'Chỉ học viên mới có thể đánh dấu hoàn thành.' });
  }

  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) {
    return res.status(404).json({ message: 'Không tìm thấy bài học.' });
  }

  const enrollment = await Enrollment.findOne({
    course: lesson.course,
    student: req.currentUser._id
  });

  if (!enrollment) {
    return res.status(403).json({ message: 'Cậu cần tham gia lớp trước khi học.' });
  }

  let pointsEarned = 0;
  if (!enrollment.completedLessons.find(item => String(item) === String(lessonId))) {
    enrollment.completedLessons.push(lesson._id);
    enrollment.points = (enrollment.points || 0) + 30;
    pointsEarned = 30;
    
    await User.findByIdAndUpdate(req.currentUser._id, {
      $inc: { points: 30 }
    });
  }

  const totalLessons = await Lesson.countDocuments({ course: lesson.course });
  const completedCount = enrollment.completedLessons.length;
  enrollment.progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
  if (totalLessons > 0 && completedCount === totalLessons) {
    enrollment.status = 'completed';
  }

  await enrollment.save();

  res.json({
    message: 'Đã cập nhật tiến độ.',
    progressPercent: enrollment.progressPercent,
    status: enrollment.status
  });
});

const evaluateEnrollment = catchAsync(async (req, res) => {
  const { enrollmentId } = req.params;
  const { score, note, progressPercent } = req.body;

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    return res.status(404).json({ message: 'Không tìm thấy học viên.' });
  }

  if (req.currentUser.role === 'teacher' && String(enrollment.teacher) !== String(req.currentUser._id)) {
    return res.status(403).json({ message: 'Bạn không có quyền đánh giá học viên này.' });
  }

  if (score !== undefined && score !== null && !Number.isNaN(Number(score))) {
    enrollment.evaluation.score = Number(score);
  }
  if (note !== undefined) {
    enrollment.evaluation.note = String(note).trim();
  }
  if (progressPercent !== undefined && !Number.isNaN(Number(progressPercent))) {
    enrollment.progressPercent = Math.min(100, Math.max(0, Number(progressPercent)));
  }
  enrollment.evaluation.updatedAt = new Date();

  await enrollment.save();

  res.json({ message: 'Đã cập nhật đánh giá.', enrollment });
});

const getCourseLeaderboard = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const enrollments = await Enrollment.find({ course: courseId })
    .sort({ points: -1, createdAt: 1 })
    .limit(10)
    .populate('student', 'username profile.displayName profile.avatarUrl points')
    .lean();

  const leaderboard = enrollments.map((en, index) => ({
    rank: index + 1,
    studentId: en.student?._id,
    username: en.studentName,
    displayName: en.student?.profile?.displayName || en.studentName,
    avatarUrl: en.student?.profile?.avatarUrl || null,
    coursePoints: en.points || 0,
    globalPoints: en.student?.points || 0
  }));

  res.json({ leaderboard });
});

module.exports = {
  enrollCourse,
  listMyEnrollments,
  listCourseEnrollments,
  completeLesson,
  evaluateEnrollment,
  getCourseLeaderboard
};
