const express = require('express');
const { getAdminLessonAnalytics } = require('../controllers/analyticsController');
const { requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/lessons/overview', requireTeacherOrAdmin, getAdminLessonAnalytics);

module.exports = router;
