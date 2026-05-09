const express = require('express');
const { listVideos, createVideo, deleteVideo } = require('../controllers/videoController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/videos', listVideos);
router.post('/videos', requireAdmin, createVideo);
router.delete('/videos/:id', requireAdmin, deleteVideo);

module.exports = router;
