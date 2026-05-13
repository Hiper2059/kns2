const multer = require('multer');

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Chi ho tro anh JPG, PNG, WebP.'));
  }
  return cb(null, true);
};

const imageUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

module.exports = { imageUpload, MAX_FILE_SIZE, ALLOWED_TYPES };
