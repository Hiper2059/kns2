const CLOUDINARY_VIDEO_UPLOAD_SEGMENT = '/video/upload/'
const MOV_EXTENSION = /\.mov(?=([?#]|$))/i
const TRANSCODE_PARAMS = 'f_mp4,vc_h264,ac_aac'

export const getPlayableCloudinaryVideoUrl = value => {
  const url = String(value || '')
  if (
    !url.includes('res.cloudinary.com/') ||
    !url.includes(CLOUDINARY_VIDEO_UPLOAD_SEGMENT) ||
    !MOV_EXTENSION.test(url)
  ) {
    return url
  }

  // Already has transcoding params
  if (url.includes(TRANSCODE_PARAMS)) {
    return url
  }

  return url
    .replace(
      CLOUDINARY_VIDEO_UPLOAD_SEGMENT,
      `${CLOUDINARY_VIDEO_UPLOAD_SEGMENT}${TRANSCODE_PARAMS}/`
    )
    .replace(MOV_EXTENSION, '.mp4')
}

/**
 * Transform all Cloudinary video src URLs inside HTML content
 * so <video> elements with Cloudinary URLs become playable.
 */
export const transformHtmlVideoUrls = html => {
  if (!html || typeof html !== 'string' || !html.includes('res.cloudinary.com/')) {
    return html
  }

  return html.replace(
    /(<video[^>]*\ssrc=["'])([^"']+)(["'])/gi,
    (match, before, srcUrl, after) => {
      const transformed = getPlayableCloudinaryVideoUrl(srcUrl)
      return `${before}${transformed}${after}`
    }
  )
}
