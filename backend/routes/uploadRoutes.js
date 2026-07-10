const express = require('express');
const { uploadImage, uploadVideo, signVideoUpload } = require('../controllers/uploadController');
const { requireActiveUser } = require('../middleware/auth');
const { imageUpload, videoUpload } = require('../middleware/upload');

const router = express.Router();

router.post('/image', requireActiveUser, (req, res, next) => {
  imageUpload.single('image')(req, res, err => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload that bai.' });
    }
    return next();
  });
}, uploadImage);

router.post('/video', requireActiveUser, (req, res, next) => {
  videoUpload.single('video')(req, res, err => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload that bai.' });
    }
    return next();
  });
}, uploadVideo);

router.get('/sign-video', requireActiveUser, signVideoUpload);

module.exports = router;

