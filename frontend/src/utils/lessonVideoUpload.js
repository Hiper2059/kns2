export const LESSON_VIDEO_ACCEPT = 'video/mp4,video/webm,video/ogg,video/quicktime,.mov'

export const uploadSelectedLessonVideo = async (file, uploadVideo) => {
  if (!file || typeof uploadVideo !== 'function') {
    return ''
  }

  const url = await uploadVideo(file)
  if (!url) {
    throw new Error('Upload video không trả về URL.')
  }

  return url
}
