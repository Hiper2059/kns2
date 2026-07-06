const express = require('express');
const {
  listCourses,
  listMyCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');
const { listLessons, createLesson } = require('../controllers/lessonController');
const { listAssignments, createAssignment } = require('../controllers/assignmentController');
const { enrollCourse, listCourseEnrollments, getCourseLeaderboard } = require('../controllers/enrollmentController');
const { requireActiveUser, requireTeacherOrAdmin, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createCourseSchema, updateCourseSchema } = require('../validations/courseValidation');

const router = express.Router();

router.get('/', optionalAuth, listCourses);
router.get('/mine', requireTeacherOrAdmin, listMyCourses);
router.get('/:courseId', optionalAuth, getCourse);
router.post('/', requireTeacherOrAdmin, validate(createCourseSchema), createCourse);
router.patch('/:courseId', requireTeacherOrAdmin, validate(updateCourseSchema), updateCourse);
router.delete('/:courseId', requireTeacherOrAdmin, deleteCourse);

router.get('/:courseId/lessons', optionalAuth, listLessons);
router.post('/:courseId/lessons', requireTeacherOrAdmin, createLesson);

router.get('/:courseId/assignments', requireActiveUser, listAssignments);
router.post('/:courseId/assignments', requireTeacherOrAdmin, createAssignment);

router.post('/:courseId/enroll', requireActiveUser, enrollCourse);
router.get('/:courseId/enrollments', requireTeacherOrAdmin, listCourseEnrollments);
router.get('/:courseId/leaderboard', getCourseLeaderboard);

module.exports = router;
