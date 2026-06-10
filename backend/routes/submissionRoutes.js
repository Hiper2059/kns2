const express = require('express');
const { gradeSubmission } = require('../controllers/assignmentController');
const { requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.patch('/:submissionId/grade', requireTeacherOrAdmin, gradeSubmission);

module.exports = router;
