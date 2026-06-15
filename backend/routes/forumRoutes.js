const express = require('express');
const {
  getPosts,
  createPost,
  updatePost,
  getComments,
  createComment,
  deletePost,
  deleteComment,
  listAllCommentsForAdmin,
  punishCommentAuthor,
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

router.get('/posts', optionalAuth, getPosts);
router.post('/posts', requireActiveUser, createPost);
router.patch('/posts/:id', requireActiveUser, updatePost);
router.delete('/posts/:id', requireActiveUser, deletePost);
router.patch('/posts/:id/reaction', requireActiveUser, togglePostReaction);

router.get('/comments', optionalAuth, getComments);
router.post('/comments', requireActiveUser, createComment);
router.delete('/comments/:id', requireActiveUser, deleteComment);
router.get('/admin/comments', requireAdmin, listAllCommentsForAdmin);
router.patch('/comments/:id/punish', requireAdmin, punishCommentAuthor);

router.get('/deleted/posts', requireAdmin, getDeletedPosts);
router.get('/deleted/comments', requireAdmin, getDeletedComments);
router.delete('/deleted/posts/:id', requireAdmin, deleteDeletedPost);
router.delete('/deleted/comments/:id', requireAdmin, deleteDeletedComment);

router.patch('/posts/:id/restore', requireAdmin, restorePost);
router.patch('/comments/:id/restore', requireAdmin, restoreComment);

module.exports = router;
