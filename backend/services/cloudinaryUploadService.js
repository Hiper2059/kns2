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

module.exports = { uploadLargeVideo };
