const mongoose = require('mongoose');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const LessonView = require('../models/LessonView');
const { isStudentRole } = require('../utils/userUtils');

const slugify = value =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

const ensureUniqueSlug = async (baseSlug, excludeId) => {
  let slug = baseSlug || 'bai-hoc'
  let suffix = 1
  while (true) {
    const query = excludeId ? { slug, _id: { $ne: excludeId } } : { slug }
    const exists = await Lesson.findOne(query).lean()
    if (!exists) {
      return slug
    }
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

const listLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).lean();

    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học.' });
    }

    if (isStudentRole(req.currentUser.role)) {
      const enrolled = await Enrollment.findOne({
        course: courseId,
        student: req.currentUser._id
      }).lean();

      if (!enrolled) {
        return res.status(403).json({ message: 'Cậu cần tham gia lớp trước khi xem bài học.' });
      }
    }

    const lessons = await Lesson.find({ course: courseId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json({ lessons });
  } catch (error) {
    console.error('Loi lay bai hoc:', error);
    res.status(500).json({ message: 'Không tải được danh sách bài học.' });
  }
};

const createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, videoUrl, imageUrl, order } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Thiếu tiêu đề bài học.' });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học.' });
    }

    if (req.currentUser.role === 'teacher' && String(course.teacher) !== String(req.currentUser._id)) {
      return res.status(403).json({ message: 'Bạn không có quyền thêm bài học cho lớp này.' });
    }

    let normalizedOrder = Number(order);
    if (!normalizedOrder || Number.isNaN(normalizedOrder)) {
      const lastLesson = await Lesson.findOne({ course: courseId })
        .sort({ order: -1 })
        .lean();
      normalizedOrder = lastLesson ? lastLesson.order + 1 : 1;
    }

    const baseSlug = slugify(`${course.title} ${title}`)
    const uniqueSlug = await ensureUniqueSlug(baseSlug)

    const created = await Lesson.create({
      course: courseId,
      title: title.trim(),
      content: content?.trim() || '',
      videoUrl: videoUrl?.trim() || '',
      imageUrl: imageUrl?.trim() || '',
      slug: uniqueSlug,
      order: normalizedOrder,
      createdBy: req.currentUser._id,
      createdByName: req.currentUser.username
    });

    res.status(201).json({ message: 'Đã thêm bài học.', lesson: created });
  } catch (error) {
    console.error('Loi tao bai hoc:', error);
    res.status(500).json({ message: 'Không tạo được bài học.' });
  }
};

const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, content, videoUrl, imageUrl, order } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học.' });
    }

    const course = await Course.findById(lesson.course).lean();
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học.' });
    }

    if (req.currentUser.role === 'teacher' && String(course.teacher) !== String(req.currentUser._id)) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa bài học này.' });
    }

    if (title) {
      lesson.title = title.trim();
      const baseSlug = slugify(`${course.title} ${lesson.title}`)
      lesson.slug = await ensureUniqueSlug(baseSlug, lesson._id);
    }
    if (content !== undefined) lesson.content = content.trim();
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl.trim();
    if (imageUrl !== undefined) lesson.imageUrl = imageUrl.trim();
    if (order !== undefined && !Number.isNaN(Number(order))) lesson.order = Number(order);

    await lesson.save();
    res.json({ message: 'Đã cập nhật bài học.', lesson });
  } catch (error) {
    console.error('Loi cap nhat bai hoc:', error);
    res.status(500).json({ message: 'Không cập nhật được bài học.' });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học.' });
    }

    const course = await Course.findById(lesson.course).lean();
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học.' });
    }

    if (req.currentUser.role === 'teacher' && String(course.teacher) !== String(req.currentUser._id)) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bài học này.' });
    }

    await lesson.deleteOne();

    const totalLessons = await Lesson.countDocuments({ course: course._id });
    const enrollments = await Enrollment.find({ course: course._id });

    for (const enrollment of enrollments) {
      const beforeCount = enrollment.completedLessons.length;
      enrollment.completedLessons = enrollment.completedLessons.filter(
        item => String(item) !== String(lessonId)
      );
      const completedCount = enrollment.completedLessons.length;
      if (beforeCount !== completedCount) {
        enrollment.progressPercent = totalLessons
          ? Math.round((completedCount / totalLessons) * 100)
          : 0;
      }
      if (totalLessons === 0) {
        enrollment.status = 'enrolled';
      }
      await enrollment.save();
    }

    res.json({ message: 'Đã xóa bài học.' });
  } catch (error) {
    console.error('Loi xoa bai hoc:', error);
    res.status(500).json({ message: 'Không xóa được bài học.' });
  }
};

const getLessonBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    let lesson = await Lesson.findOne({ slug }).lean();
    if (!lesson && mongoose.Types.ObjectId.isValid(slug)) {
      lesson = await Lesson.findById(slug).lean();
    }
    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học.' });
    }

    const course = await Course.findById(lesson.course).lean();
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học.' });
    }

    if (isStudentRole(req.currentUser.role)) {
      const enrolled = await Enrollment.findOne({
        course: lesson.course,
        student: req.currentUser._id
      }).lean();

      if (!enrolled) {
        return res.status(403).json({ message: 'Cậu cần tham gia lớp trước khi xem bài học.' });
      }
    }

    try {
      const userId = mongoose.Types.ObjectId.isValid(req.currentUser?._id)
        ? req.currentUser._id
        : null;
      await LessonView.create({
        lesson: lesson._id,
        course: lesson.course,
        user: userId,
        userRole: req.currentUser?.role || ''
      });
    } catch (error) {
      console.error('Loi ghi luot xem bai hoc:', error);
    }

    res.json({ lesson, course });
  } catch (error) {
    console.error('Loi lay bai hoc theo slug:', error);
    res.status(500).json({ message: 'Không tải được bài học.' });
  }
};

module.exports = {
  listLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonBySlug
};
