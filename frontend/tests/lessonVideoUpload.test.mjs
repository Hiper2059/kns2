import test from 'node:test'
import assert from 'node:assert/strict'

import {
  LESSON_VIDEO_ACCEPT,
  uploadSelectedLessonVideo
} from '../src/utils/lessonVideoUpload.js'

test('upload MOV đúng một lần và giữ URL Cloudinary trả về', async () => {
  const file = { name: 'chim-bo-cau.mov', type: 'video/quicktime' }
  const cloudinaryUrl = 'https://res.cloudinary.com/demo/video/upload/kns/chim-bo-cau.mov'
  let uploadCount = 0

  const result = await uploadSelectedLessonVideo(file, async selectedFile => {
    uploadCount += 1
    assert.equal(selectedFile, file)
    return cloudinaryUrl
  })

  assert.equal(uploadCount, 1)
  assert.equal(result, cloudinaryUrl)
  assert.match(LESSON_VIDEO_ACCEPT, /video\/quicktime/)
  assert.match(LESSON_VIDEO_ACCEPT, /\.mov/)
})

test('không chấp nhận kết quả upload thiếu URL', async () => {
  await assert.rejects(
    uploadSelectedLessonVideo({ name: 'video.mp4' }, async () => ''),
    /không trả về URL/i
  )
})
