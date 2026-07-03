const fs = require('fs');
const config = require('../config/env');
const { cloudinary } = require('../utils/cloudinary');
const catchAsync = require('../utils/catchAsync');
const {
  buildVideoUploadOptions,
  getUploadedVideoUrl,
  uploadLargeVideo
} = require('../services/cloudinaryUploadService');

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

const uploadToCloudinary = (filePath, resourceType, file) => {
  let uploadOptions = {
    folder: config.cloudinary.folder,
    resource_type: resourceType
  };

  if (resourceType === 'video' && typeof cloudinary.uploader.upload_large === 'function') {
    uploadOptions = buildVideoUploadOptions(file, uploadOptions);
    return uploadLargeVideo(cloudinary.uploader, filePath, uploadOptions);
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

    const result = await uploadToCloudinary(filePath, 'video', req.file);
    const videoUrl = getUploadedVideoUrl(result, req.file);

    console.info('Cloudinary video uploaded:', {
      publicId: result.public_id,
      bytes: result.bytes,
      deliveryFormat: videoUrl.toLowerCase().includes('.mp4') ? 'mp4' : result.format
    });

    res.json({
      url: videoUrl,
      publicId: result.public_id
    });
  } finally {
    cleanupTempFile(filePath);
  }
});

module.exports = { uploadImage, uploadVideo };
