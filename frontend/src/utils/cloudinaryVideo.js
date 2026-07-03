const CLOUDINARY_VIDEO_UPLOAD_SEGMENT = '/video/upload/'
const MOV_EXTENSION = /\.mov(?=([?#]|$))/i

export const getPlayableCloudinaryVideoUrl = value => {
  const url = String(value || '')
  if (
    !url.includes('res.cloudinary.com/') ||
    !url.includes(CLOUDINARY_VIDEO_UPLOAD_SEGMENT) ||
    !MOV_EXTENSION.test(url)
  ) {
    return url
  }

  return url
    .replace(
      CLOUDINARY_VIDEO_UPLOAD_SEGMENT,
      `${CLOUDINARY_VIDEO_UPLOAD_SEGMENT}f_mp4,vc_h264,ac_aac/`
    )
    .replace(MOV_EXTENSION, '.mp4')
}
