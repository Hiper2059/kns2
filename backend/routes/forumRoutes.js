const express = require('express');
const {
  getPosts,
  createPost,
  getComments,
  createComment,
  deletePost,
  deleteComment,
  togglePostReaction,
  getDeletedPosts,
  getDeletedComments,
  deleteDeletedPost,
  deleteDeletedComment,
  restorePost,
  restoreComment
} = require('../controllers/forumController');
const { requireActiveUser, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/forum/posts', optionalAuth, getPosts);
router.post('/forum/posts', requireActiveUser, createPost);
router.delete('/forum/posts/:id', requireActiveUser, deletePost);
router.patch('/forum/posts/:id/reaction', requireActiveUser, togglePostReaction);

router.get('/forum/comments', optionalAuth, getComments);
router.post('/forum/comments', requireActiveUser, createComment);
router.delete('/forum/comments/:id', requireActiveUser, deleteComment);

router.get('/forum/deleted/posts', requireAdmin, getDeletedPosts);
router.get('/forum/deleted/comments', requireAdmin, getDeletedComments);
router.delete('/forum/deleted/posts/:id', requireAdmin, deleteDeletedPost);
router.delete('/forum/deleted/comments/:id', requireAdmin, deleteDeletedComment);

router.patch('/forum/posts/:id/restore', requireAdmin, restorePost);
router.patch('/forum/comments/:id/restore', requireAdmin, restoreComment);

module.exports = router;
