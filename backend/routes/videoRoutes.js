const express = require('express');
const { listVideos, createVideo, deleteVideo } = require('../controllers/videoController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', listVideos);
router.post('/', requireAdmin, createVideo);
router.delete('/:id', requireAdmin, deleteVideo);

module.exports = router;
