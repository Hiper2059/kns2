const test = require('node:test');
const assert = require('node:assert/strict');

const { uploadLargeVideo } = require('../services/cloudinaryUploadService');

test('chờ callback upload_large rồi trả URL video MOV', async () => {
  let finishUpload;
  const uploader = {
    upload_large(filePath, options, callback) {
      assert.equal(filePath, 'chim-bo-cau.mov');
      assert.equal(options.resource_type, 'video');
      finishUpload = callback;
      return { type: 'stream' };
    }
  };

  let settled = false;
  const uploadPromise = uploadLargeVideo(uploader, 'chim-bo-cau.mov', {
    folder: 'kns',
    resource_type: 'video'
  }).finally(() => {
    settled = true;
  });

  await Promise.resolve();
  assert.equal(settled, false);

  finishUpload(null, {
    secure_url: 'https://res.cloudinary.com/demo/video/upload/kns/chim-bo-cau.mov',
    public_id: 'kns/chim-bo-cau'
  });

  const result = await uploadPromise;
  assert.equal(result.public_id, 'kns/chim-bo-cau');
  assert.match(result.secure_url, /\.mov$/);
})

test('trả lỗi Cloudinary từ callback', async () => {
  const cloudinaryError = new Error('Upload failed');
  const uploader = {
    upload_large(filePath, options, callback) {
      callback(cloudinaryError);
    }
  };

  await assert.rejects(
    uploadLargeVideo(uploader, 'video.mp4', { resource_type: 'video' }),
    cloudinaryError
  );
});

test('báo lỗi khi Cloudinary không trả secure_url', async () => {
  const uploader = {
    upload_large(filePath, options, callback) {
      callback(null, { public_id: 'kns/video' });
    }
  };

  await assert.rejects(
    uploadLargeVideo(uploader, 'video.mp4', { resource_type: 'video' }),
    /secure_url/
  );
});
