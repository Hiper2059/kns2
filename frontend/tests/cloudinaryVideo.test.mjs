import test from 'node:test'
import assert from 'node:assert/strict'

import { getPlayableCloudinaryVideoUrl } from '../src/utils/cloudinaryVideo.js'

test('chuyển URL Cloudinary MOV cũ thành MP4 H.264/AAC', () => {
  const movUrl = 'https://res.cloudinary.com/demo/video/upload/v123/kns/chim.mov'

  assert.equal(
    getPlayableCloudinaryVideoUrl(movUrl),
    'https://res.cloudinary.com/demo/video/upload/f_mp4,vc_h264,ac_aac/v123/kns/chim.mp4'
  )
})

test('giữ nguyên URL MP4 và URL không thuộc Cloudinary', () => {
  const mp4Url = 'https://res.cloudinary.com/demo/video/upload/v123/kns/video.mp4'
  const externalMovUrl = 'https://example.com/video.mov'

  assert.equal(getPlayableCloudinaryVideoUrl(mp4Url), mp4Url)
  assert.equal(getPlayableCloudinaryVideoUrl(externalMovUrl), externalMovUrl)
})
