const express = require('express');
const router = express.Router();
const lessonCommentController = require('../controllers/lessonCommentController');
const authMiddleware = require('../middleware/auth');

router.get('/:lessonId/comments', authMiddleware.optionalAuth, lessonCommentController.listComments);

router.post('/:lessonId/comments', authMiddleware.requireActiveUser, lessonCommentController.createComment);

module.exports = router;
