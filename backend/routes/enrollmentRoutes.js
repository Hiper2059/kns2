const express = require('express');
const {
  listMyEnrollments,
  evaluateEnrollment
} = require('../controllers/enrollmentController');
const { requireActiveUser, requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireActiveUser, listMyEnrollments);
router.patch('/:enrollmentId/evaluate', requireTeacherOrAdmin, evaluateEnrollment);

module.exports = router;
