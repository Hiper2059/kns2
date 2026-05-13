const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const { isStudentRole } = require('../utils/userUtils');

const enrollCourse = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Loi tham gia lop hoc:', error);
    res.status(500).json({ message: 'Không tham gia được lớp học.' });
  }
};

const listMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.currentUser._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ enrollments });
  } catch (error) {
    console.error('Loi lay lop da tham gia:', error);
    res.status(500).json({ message: 'Không tải được danh sách lớp đã tham gia.' });
  }
};

const listCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học.' });
    }

    if (req.currentUser.role === 'teacher' && String(course.teacher) !== String(req.currentUser._id)) {
      return res.status(403).json({ message: 'Bạn không có quyền xem học viên của lớp này.' });
    }

    const enrollments = await Enrollment.find({ course: courseId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ enrollments });
  } catch (error) {
    console.error('Loi lay danh sach hoc vien:', error);
    res.status(500).json({ message: 'Không tải được danh sách học viên.' });
  }
};

const completeLesson = async (req, res) => {
  try {
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

    if (!enrollment.completedLessons.find(item => String(item) === String(lessonId))) {
      enrollment.completedLessons.push(lesson._id);
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
  } catch (error) {
    console.error('Loi cap nhat tien do:', error);
    res.status(500).json({ message: 'Không cập nhật được tiến độ học.' });
  }
};

const evaluateEnrollment = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Loi danh gia hoc vien:', error);
    res.status(500).json({ message: 'Không cập nhật được đánh giá.' });
  }
};

module.exports = {
  enrollCourse,
  listMyEnrollments,
  listCourseEnrollments,
  completeLesson,
  evaluateEnrollment
};
