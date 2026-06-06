const express = require('express');
const {
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  upsertSubmission,
  listSubmissions,
  gradeSubmission
} = require('../controllers/assignmentController');
const { requireActiveUser, requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/courses/:courseId/assignments', requireActiveUser, listAssignments);
router.post('/courses/:courseId/assignments', requireTeacherOrAdmin, createAssignment);
router.patch('/assignments/:assignmentId', requireTeacherOrAdmin, updateAssignment);
router.delete('/assignments/:assignmentId', requireTeacherOrAdmin, deleteAssignment);

router.post('/assignments/:assignmentId/submissions', requireActiveUser, upsertSubmission);
router.get('/assignments/:assignmentId/submissions', requireTeacherOrAdmin, listSubmissions);
router.patch('/submissions/:submissionId/grade', requireTeacherOrAdmin, gradeSubmission);

module.exports = router;
