const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const ForumPost = require('../models/ForumPost');
const ForumComment = require('../models/ForumComment');
const LessonComment = require('../models/LessonComment');
const LessonView = require('../models/LessonView');

const listCourses = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) {
      filter.category = category.trim();
    }

    const courses = await Course.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ courses });
  } catch (error) {
    console.error('Loi lay danh sach lop hoc:', error);
    res.status(500).json({ message: 'Không tải được danh sách lớp học.' });
  }
};

const listMyCourses = async (req, res) => {
  try {
    const teacherId = req.currentUser?._id;
    const courses = await Course.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ courses });
  } catch (error) {
    console.error('Loi lay lop cua giao vien:', error);
    res.status(500).json({ message: 'Không tải được lớp học của giáo viên.' });
  }
};

const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).lean();
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học.' });
    }

    res.json({ course });
  } catch (error) {
    console.error('Loi lay thong tin lop:', error);
    res.status(500).json({ message: 'Không tải được thông tin lớp học.' });
  }
};

const createCourse = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Loi tao lop hoc:', error);
    res.status(500).json({ message: 'Không tạo được lớp học.' });
  }
};

const updateCourse = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Loi cap nhat lop hoc:', error);
    res.status(500).json({ message: 'Không cập nhật được lớp học.' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học.' });
    }

    if (req.currentUser.role === 'teacher' && String(course.teacher) !== String(req.currentUser._id)) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa lớp học này.' });
    }

    const [assignmentIds, forumPostIds] = await Promise.all([
      Assignment.find({ course: course._id }, { _id: 1 }).lean(),
      ForumPost.find({ scope: 'course', course: course._id }, { _id: 1 }).lean()
    ]);

    await Promise.all([
      Lesson.deleteMany({ course: course._id }),
      LessonComment.deleteMany({ course: course._id }),
      LessonView.deleteMany({ course: course._id }),
      Enrollment.deleteMany({ course: course._id }),
      Submission.deleteMany({
        $or: [
          { course: course._id },
          { assignment: { $in: assignmentIds.map(item => item._id) } }
        ]
      }),
      Assignment.deleteMany({ course: course._id }),
      ForumComment.deleteMany({ postId: { $in: forumPostIds.map(item => item._id) } }),
      ForumPost.deleteMany({ scope: 'course', course: course._id })
    ]);

    await course.deleteOne();

    res.json({ message: 'Đã xóa lớp học.' });
  } catch (error) {
    console.error('Loi xoa lop hoc:', error);
    res.status(500).json({ message: 'Không xóa được lớp học.' });
  }
};

module.exports = {
  listCourses,
  listMyCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
};
