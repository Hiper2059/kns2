const multer = require('multer');

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Video settings
const VIDEO_MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB
const VIDEO_ALLOWED_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime'
];

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Chi ho tro anh JPG, PNG, WebP.'));
  }
  return cb(null, true);
};

const videoFileFilter = (req, file, cb) => {
  if (!VIDEO_ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Chi ho tro video MP4, WebM, OGG, MOV.'));
  }
  return cb(null, true);
};

const imageUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFileFilter
});

const videoUpload = multer({
  storage,
  limits: { fileSize: VIDEO_MAX_FILE_SIZE },
  fileFilter: videoFileFilter
});

module.exports = {
  imageUpload,
  MAX_FILE_SIZE,
  ALLOWED_TYPES,
  videoUpload,
  VIDEO_MAX_FILE_SIZE,
  VIDEO_ALLOWED_TYPES
};
