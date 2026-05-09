const express = require('express');
const {
  getPosts,
  createPost,
  getComments,
  createComment,
  deletePost,
  deleteComment,
  getDeletedPosts,
  getDeletedComments,
  deleteDeletedPost,
  deleteDeletedComment,
  restorePost,
  restoreComment
} = require('../controllers/forumController');
const { requireActiveUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/forum/posts', getPosts);
router.post('/forum/posts', requireActiveUser, createPost);
router.delete('/forum/posts/:id', requireActiveUser, deletePost);

router.get('/forum/comments', getComments);
router.post('/forum/comments', requireActiveUser, createComment);
router.delete('/forum/comments/:id', requireActiveUser, deleteComment);

router.get('/forum/deleted/posts', requireAdmin, getDeletedPosts);
router.get('/forum/deleted/comments', requireAdmin, getDeletedComments);
router.delete('/forum/deleted/posts/:id', requireAdmin, deleteDeletedPost);
router.delete('/forum/deleted/comments/:id', requireAdmin, deleteDeletedComment);

router.patch('/forum/posts/:id/restore', requireAdmin, restorePost);
router.patch('/forum/comments/:id/restore', requireAdmin, restoreComment);

module.exports = router;
