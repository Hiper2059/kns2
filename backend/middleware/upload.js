const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const VIDEO_MAX_FILE_SIZE = 200 * 1024 * 1024;
const VIDEO_ALLOWED_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime'
];

const UPLOAD_TMP_DIR =
  process.env.UPLOAD_TMP_DIR || path.join(os.tmpdir(), 'kns-uploads');

fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_TMP_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const basename = path
      .basename(file.originalname || 'upload', ext)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 48);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(null, `${basename || 'upload'}-${uniqueSuffix}${ext}`);
  }
});

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
  VIDEO_ALLOWED_TYPES,
  UPLOAD_TMP_DIR
};
