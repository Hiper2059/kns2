const express = require('express');
const {
  updateAssignment,
  deleteAssignment,
  upsertSubmission,
  listSubmissions,
  listGlobalAssignments,
  createGlobalAssignment
} = require('../controllers/assignmentController');
const { requireActiveUser, requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireActiveUser, listGlobalAssignments);
router.post('/', requireTeacherOrAdmin, createGlobalAssignment);

router.patch('/:assignmentId', requireTeacherOrAdmin, updateAssignment);
router.delete('/:assignmentId', requireTeacherOrAdmin, deleteAssignment);

router.post('/:assignmentId/submissions', requireActiveUser, upsertSubmission);
router.get('/:assignmentId/submissions', requireTeacherOrAdmin, listSubmissions);

module.exports = router;
