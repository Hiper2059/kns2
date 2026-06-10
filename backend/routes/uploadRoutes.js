const express = require('express');
const { uploadImage, uploadVideo } = require('../controllers/uploadController');
const { requireTeacherOrAdmin } = require('../middleware/auth');
const { imageUpload, videoUpload } = require('../middleware/upload');

const router = express.Router();

router.post('/image', requireTeacherOrAdmin, (req, res, next) => {
  imageUpload.single('image')(req, res, err => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload that bai.' });
    }
    return next();
  });
}, uploadImage);

router.post('/video', requireTeacherOrAdmin, (req, res, next) => {
  videoUpload.single('video')(req, res, err => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload that bai.' });
    }
    return next();
  });
}, uploadVideo);

module.exports = router;
