const path = require('path');

const isMovVideoFile = file =>
  file?.mimetype === 'video/quicktime' ||
  path.extname(file?.originalname || '').toLowerCase() === '.mov';

const buildVideoUploadOptions = (file, baseOptions) => {
  if (!isMovVideoFile(file)) {
    return { ...baseOptions };
  }

  return {
    ...baseOptions,
    eager: [{
      format: 'mp4',
      video_codec: 'h264',
      audio_codec: 'aac'
    }],
    eager_async: false,
    timeout: 180000
  };
};

const getUploadedVideoUrl = (result, file) => {
  if (!isMovVideoFile(file)) {
    return result?.secure_url || '';
  }

  const transformedUrl = result?.eager?.find(item => item?.secure_url)?.secure_url;
  if (!transformedUrl) {
    throw new Error('Cloudinary khong tra ve URL MP4 cho video MOV.');
  }

  return transformedUrl;
};

const uploadLargeVideo = (uploader, filePath, options) => {
  if (!uploader || typeof uploader.upload_large !== 'function') {
    return Promise.reject(new Error('Cloudinary upload_large khong kha dung.'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, result) => {
      if (settled) {
        return;
      }
      settled = true;

      if (error) {
        reject(error);
        return;
      }
      if (!result?.secure_url) {
        reject(new Error('Cloudinary khong tra ve secure_url cho video.'));
        return;
      }

      resolve(result);
    };

    try {
      uploader.upload_large(filePath, options, finish);
    } catch (error) {
      finish(error);
    }
  });
};

module.exports = {
  buildVideoUploadOptions,
  getUploadedVideoUrl,
  uploadLargeVideo
};
