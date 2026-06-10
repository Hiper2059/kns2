const express = require('express');
const { updateLesson, deleteLesson, getLessonBySlug, toggleLessonReaction } = require('../controllers/lessonController');
const { completeLesson } = require('../controllers/enrollmentController');
const { requireActiveUser, requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/slug/:slug', requireActiveUser, getLessonBySlug);
router.patch('/:lessonId', requireTeacherOrAdmin, updateLesson);
router.delete('/:lessonId', requireTeacherOrAdmin, deleteLesson);
router.patch('/:lessonId/reaction', requireActiveUser, toggleLessonReaction);
router.post('/:lessonId/complete', requireActiveUser, completeLesson);

module.exports = router;
