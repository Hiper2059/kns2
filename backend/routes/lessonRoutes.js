const express = require('express');
const { listLessons, createLesson, updateLesson, deleteLesson, getLessonBySlug } = require('../controllers/lessonController');
const { requireActiveUser, requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get lessons for a course
router.get('/courses/:courseId/lessons', requireActiveUser, listLessons);
router.post('/courses/:courseId/lessons', requireTeacherOrAdmin, createLesson);
router.patch('/lessons/:lessonId', requireTeacherOrAdmin, updateLesson);
router.delete('/lessons/:lessonId', requireTeacherOrAdmin, deleteLesson);
router.get('/lessons/slug/:slug', requireActiveUser, getLessonBySlug);

module.exports = router;
