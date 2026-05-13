const express = require('express');
const {
  listCourses,
  listMyCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');
const { requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/courses', listCourses);
router.get('/courses/mine', requireTeacherOrAdmin, listMyCourses);
router.get('/courses/:courseId', getCourse);
router.post('/courses', requireTeacherOrAdmin, createCourse);
router.patch('/courses/:courseId', requireTeacherOrAdmin, updateCourse);
router.delete('/courses/:courseId', requireTeacherOrAdmin, deleteCourse);

module.exports = router;
