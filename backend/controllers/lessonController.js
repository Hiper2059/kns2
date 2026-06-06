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
    .replace(/-{2,}/g, '-');

const ensureUniqueSlug = async (baseSlug, excludeId) => {
  let slug = baseSlug || 'bai-hoc';
  let suffix = 1;
  while (true) {
    const query = excludeId ? { slug, _id: { $ne: excludeId } } : { slug };
    const exists = await Lesson.findOne(query).lean();
    if (!exists) {
      return slug;
    }
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

const ensureCourseAccess = async (req, res, course, actionLabel = 'truy cap lop hoc') => {
  if (!course) {
    res.status(404).json({ message: 'Khong tim thay lop hoc.' });
    return false;
  }

  if (req.currentUser.role === 'admin') {
    return true;
  }

  if (req.currentUser.role === 'teacher') {
    if (String(course.teacher) === String(req.currentUser._id)) {
      return true;
    }

    res.status(403).json({ message: 'Ban khong co quyen truy cap lop nay.' });
    return false;
  }

  if (isStudentRole(req.currentUser.role)) {
    const enrolled = await Enrollment.findOne({
      course: course._id,
      student: req.currentUser._id
    }).lean();

    if (enrolled) {
      return true;
    }

    res.status(403).json({ message: `Cau can tham gia lop truoc khi ${actionLabel}.` });
    return false;
  }

  res.status(403).json({ message: 'Ban khong co quyen truy cap lop nay.' });
  return false;
};

const listLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).lean();

    if (!course) {
      return res.status(404).json({ message: 'Khong tim thay lop hoc.' });
    }

    if (isStudentRole(req.currentUser.role)) {
      const enrolled = await Enrollment.findOne({
        course: courseId,
        student: req.currentUser._id
      }).lean();

      if (!enrolled) {
        return res.status(403).json({ message: 'Cau can tham gia lop truoc khi xem bai hoc.' });
      }
    }

    const lessons = await Lesson.find({ course: courseId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json({ lessons });
  } catch (error) {
    console.error('Loi lay bai hoc:', error);
    res.status(500).json({ message: 'Khong tai duoc danh sach bai hoc.' });
  }
};

const createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, videoUrl, imageUrl, order } = req.body || {};
    const trimmedTitle = String(title || '').trim();

    if (!trimmedTitle) {
      return res.status(400).json({ message: 'Thieu tieu de bai hoc.' });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ message: 'Khong tim thay lop hoc.' });
    }

    if (req.currentUser.role === 'teacher' && String(course.teacher) !== String(req.currentUser._id)) {
      return res.status(403).json({ message: 'Ban khong co quyen them bai hoc cho lop nay.' });
    }

    let normalizedOrder = Number(order);
    if (!normalizedOrder || Number.isNaN(normalizedOrder)) {
      const lastLesson = await Lesson.findOne({ course: courseId })
        .sort({ order: -1 })
        .lean();
      normalizedOrder = lastLesson ? lastLesson.order + 1 : 1;
    }

    const baseSlug = slugify(`${course.title} ${trimmedTitle}`);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    const created = await Lesson.create({
      course: courseId,
      title: trimmedTitle,
      content: String(content || '').trim(),
      videoUrl: String(videoUrl || '').trim(),
      imageUrl: String(imageUrl || '').trim(),
      slug: uniqueSlug,
      order: normalizedOrder,
      createdBy: req.currentUser._id,
      createdByName: req.currentUser.username
    });

    res.status(201).json({ message: 'Da them bai hoc.', lesson: created });
  } catch (error) {
    console.error('Loi tao bai hoc:', error);
    res.status(500).json({ message: 'Khong tao duoc bai hoc.' });
  }
};

const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, content, videoUrl, imageUrl, order } = req.body || {};

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Khong tim thay bai hoc.' });
    }

    const course = await Course.findById(lesson.course).lean();
    if (!course) {
      return res.status(404).json({ message: 'Khong tim thay lop hoc.' });
    }

    if (req.currentUser.role === 'teacher' && String(course.teacher) !== String(req.currentUser._id)) {
      return res.status(403).json({ message: 'Ban khong co quyen sua bai hoc nay.' });
    }

    if (title !== undefined) {
      const trimmedTitle = String(title || '').trim();
      if (!trimmedTitle) {
        return res.status(400).json({ message: 'Tieu de bai hoc khong duoc rong.' });
      }
      lesson.title = trimmedTitle;
      const baseSlug = slugify(`${course.title} ${lesson.title}`);
      lesson.slug = await ensureUniqueSlug(baseSlug, lesson._id);
    }
    if (content !== undefined) lesson.content = String(content || '').trim();
    if (videoUrl !== undefined) lesson.videoUrl = String(videoUrl || '').trim();
    if (imageUrl !== undefined) lesson.imageUrl = String(imageUrl || '').trim();
    if (order !== undefined && !Number.isNaN(Number(order))) lesson.order = Number(order);

    await lesson.save();
    res.json({ message: 'Da cap nhat bai hoc.', lesson });
  } catch (error) {
    console.error('Loi cap nhat bai hoc:', error);
    res.status(500).json({ message: 'Khong cap nhat duoc bai hoc.' });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Khong tim thay bai hoc.' });
    }

    const course = await Course.findById(lesson.course).lean();
    if (!course) {
      return res.status(404).json({ message: 'Khong tim thay lop hoc.' });
    }

    if (req.currentUser.role === 'teacher' && String(course.teacher) !== String(req.currentUser._id)) {
      return res.status(403).json({ message: 'Ban khong co quyen xoa bai hoc nay.' });
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

    res.json({ message: 'Da xoa bai hoc.' });
  } catch (error) {
    console.error('Loi xoa bai hoc:', error);
    res.status(500).json({ message: 'Khong xoa duoc bai hoc.' });
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
      return res.status(404).json({ message: 'Khong tim thay bai hoc.' });
    }

    const course = await Course.findById(lesson.course).lean();
    if (!course) {
      return res.status(404).json({ message: 'Khong tim thay lop hoc.' });
    }

    if (isStudentRole(req.currentUser.role)) {
      const enrolled = await Enrollment.findOne({
        course: lesson.course,
        student: req.currentUser._id
      }).lean();

      if (!enrolled) {
        return res.status(403).json({ message: 'Cau can tham gia lop truoc khi xem bai hoc.' });
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

    const userKey = req.currentUser?._id ? String(req.currentUser._id) : '';
    const heartUserIds = lesson.heartUserIds || [];
    const heartCount = heartUserIds.length;
    const isHearted = userKey ? heartUserIds.some(item => String(item) === userKey) : false;

    res.json({
      lesson: {
        ...lesson,
        heartCount,
        isHearted
      },
      course
    });
  } catch (error) {
    console.error('Loi lay bai hoc theo slug:', error);
    res.status(500).json({ message: 'Khong tai duoc bai hoc.' });
  }
};

const toggleLessonReaction = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Khong tim thay bai hoc.' });
    }

    const course = await Course.findById(lesson.course).lean();
    const canAccess = await ensureCourseAccess(req, res, course, 'tha tim bai giang');
    if (!canAccess) {
      return;
    }

    const userKey = req.currentUser?._id ? String(req.currentUser._id) : '';
    if (!userKey) {
      return res.status(401).json({ message: 'Can dang nhap de tha tim.' });
    }

    const existingIndex = (lesson.heartUserIds || []).findIndex(item => String(item) === userKey);
    if (existingIndex >= 0) {
      lesson.heartUserIds.splice(existingIndex, 1);
    } else {
      lesson.heartUserIds.push(userKey);
    }

    await lesson.save();

    const heartCount = lesson.heartUserIds.length;
    const isHearted = lesson.heartUserIds.some(item => String(item) === userKey);
    res.json({ heartCount, isHearted });
  } catch (error) {
    console.error('Loi tha tim bai hoc:', error);
    res.status(500).json({ message: 'Khong tha tim duoc.' });
  }
};

module.exports = {
  listLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonBySlug,
  toggleLessonReaction
};
