const config = require('../config/env');
const { cloudinary } = require('../utils/cloudinary');

const uploadImage = async (req, res) => {
  try {
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      return res.status(500).json({ message: 'Cloudinary chua duoc cau hinh.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Chua co file anh.' });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: config.cloudinary.folder,
          resource_type: 'image'
        },
        (error, uploadResult) => {
          if (error) {
            return reject(error);
          }
          return resolve(uploadResult);
        }
      );

      stream.end(req.file.buffer);
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Loi upload anh:', error);
    res.status(500).json({ message: 'Khong upload duoc anh.' });
  }
};

const uploadVideo = async (req, res) => {
  try {
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      return res.status(500).json({ message: 'Cloudinary chua duoc cau hinh.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Chua co file video.' });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: config.cloudinary.folder,
          resource_type: 'video'
        },
        (error, uploadResult) => {
          if (error) {
            return reject(error);
          }
          return resolve(uploadResult);
        }
      );

      stream.end(req.file.buffer);
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Loi upload video:', error);
    res.status(500).json({ message: 'Khong upload duoc video.' });
  }
};

module.exports = { uploadImage, uploadVideo };
