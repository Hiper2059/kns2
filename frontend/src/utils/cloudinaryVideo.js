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

  // 1. Transform existing <video> tags
  let transformedHtml = html.replace(
    /(<video[^>]*\ssrc=["'])([^"']+)(["'])/gi,
    (match, before, srcUrl, after) => {
      const transformedUrl = getPlayableCloudinaryVideoUrl(srcUrl)
      return `${before}${transformedUrl}${after}`
    }
  )

  // 2. Transform legacy <iframe> tags containing Cloudinary URLs into <video> tags
  // The standard Quill video blot uses iframes which breaks raw Cloudinary video URLs.
  transformedHtml = transformedHtml.replace(
    /<iframe[^>]*\ssrc=["']([^"']+res\.cloudinary\.com[^"']+)["'][^>]*><\/iframe>/gi,
    (match, srcUrl) => {
      const transformedUrl = getPlayableCloudinaryVideoUrl(srcUrl)
      return `<video controls playsinline preload="metadata" style="max-width:100%;height:auto;border-radius:0.5rem" src="${transformedUrl}"></video>`
    }
  )

  return transformedHtml
}
