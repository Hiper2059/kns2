const express = require('express');
const lessonCommentController = require('../controllers/lessonCommentController');
const { requireActiveUser } = require('../middleware/auth');

const router = express.Router();

router.delete('/:commentId', requireActiveUser, lessonCommentController.deleteComment);

module.exports = router;
