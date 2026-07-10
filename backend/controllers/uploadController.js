const fs = require('fs');
const config = require('../config/env');
const { cloudinary } = require('../utils/cloudinary');
const catchAsync = require('../utils/catchAsync');

const isCloudinaryConfigured = () =>
  Boolean(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);

const cleanupTempFile = filePath => {
  if (!filePath) {
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn('Khong xoa duoc file tam:', error);
  }
};

const uploadToCloudinary = (filePath, resourceType) => {
  const uploadOptions = {
    folder: config.cloudinary.folder,
    resource_type: resourceType
  };

  if (resourceType === 'video' && typeof cloudinary.uploader.upload_large === 'function') {
    return cloudinary.uploader.upload_large(filePath, uploadOptions);
  }

  return cloudinary.uploader.upload(filePath, uploadOptions);
};

const uploadImage = catchAsync(async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!isCloudinaryConfigured()) {
      return res.status(500).json({ message: 'Cloudinary chua duoc cau hinh.' });
    }

    if (!filePath) {
      return res.status(400).json({ message: 'Chua co file anh.' });
    }

    const result = await uploadToCloudinary(filePath, 'image');

    res.json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } finally {
    cleanupTempFile(filePath);
  }
});

const uploadVideo = catchAsync(async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!isCloudinaryConfigured()) {
      return res.status(500).json({ message: 'Cloudinary chua duoc cau hinh.' });
    }

    if (!filePath) {
      return res.status(400).json({ message: 'Chua co file video.' });
    }

    const result = await uploadToCloudinary(filePath, 'video');

    res.json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } finally {
    cleanupTempFile(filePath);
  }
});

const signVideoUpload = catchAsync(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    return res.status(500).json({ message: 'Cloudinary chua duoc cau hinh.' });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = config.cloudinary.folder || 'kns';
  const paramsToSign = { folder, timestamp };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    config.cloudinary.apiSecret
  );

  res.json({
    signature,
    timestamp,
    folder,
    cloudName: config.cloudinary.cloudName,
    apiKey: config.cloudinary.apiKey
  });
});

module.exports = { uploadImage, uploadVideo, signVideoUpload };
