const express = require('express');
const router = express.Router();
const lessonCommentController = require('../controllers/lessonCommentController');
const authMiddleware = require('../middleware/auth');

// Public: list comments
router.get('/lessons/:lessonId/comments', authMiddleware.optionalAuth, lessonCommentController.listComments);

// Auth required: post comment
router.post('/lessons/:lessonId/comments', authMiddleware.requireActiveUser, lessonCommentController.createComment);

// Delete comment (owner or teacher/admin)
router.delete('/comments/:commentId', authMiddleware.requireActiveUser, lessonCommentController.deleteComment);

module.exports = router;
