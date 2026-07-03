const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildVideoUploadOptions,
  getUploadedVideoUrl,
  uploadLargeVideo
} = require('../services/cloudinaryUploadService');

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

test('yêu cầu Cloudinary tạo MP4 H.264/AAC cho file MOV', () => {
  const options = buildVideoUploadOptions(
    { originalname: 'chim-bo-cau.mov', mimetype: 'video/quicktime' },
    { folder: 'kns', resource_type: 'video' }
  );

  assert.equal(options.eager_async, false);
  assert.equal(options.timeout, 180000);
  assert.deepEqual(options.eager, [{
    format: 'mp4',
    video_codec: 'h264',
    audio_codec: 'aac'
  }]);
});

test('dùng URL MP4 đã chuyển đổi cho file MOV', () => {
  const result = {
    secure_url: 'https://res.cloudinary.com/demo/video/upload/kns/chim.mov',
    eager: [{
      secure_url: 'https://res.cloudinary.com/demo/video/upload/v1/kns/chim.mp4'
    }]
  };

  const url = getUploadedVideoUrl(result, {
    originalname: 'chim.mov',
    mimetype: 'video/quicktime'
  });

  assert.match(url, /\.mp4$/);
});
