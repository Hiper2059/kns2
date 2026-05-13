const express = require('express');
const {
  enrollCourse,
  listMyEnrollments,
  listCourseEnrollments,
  completeLesson,
  evaluateEnrollment
} = require('../controllers/enrollmentController');
const { requireActiveUser, requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/courses/:courseId/enroll', requireActiveUser, enrollCourse);
router.get('/enrollments/me', requireActiveUser, listMyEnrollments);
router.get('/courses/:courseId/enrollments', requireTeacherOrAdmin, listCourseEnrollments);
router.post('/lessons/:lessonId/complete', requireActiveUser, completeLesson);
router.patch('/enrollments/:enrollmentId/evaluate', requireTeacherOrAdmin, evaluateEnrollment);

module.exports = router;
