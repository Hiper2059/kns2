const express = require('express');
const { uploadImage } = require('../controllers/uploadController');
const { requireTeacherOrAdmin } = require('../middleware/auth');
const { imageUpload } = require('../middleware/upload');

const router = express.Router();

router.post('/uploads/image', requireTeacherOrAdmin, (req, res, next) => {
  imageUpload.single('image')(req, res, err => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload that bai.' });
    }
    return next();
  });
}, uploadImage);

module.exports = router;
