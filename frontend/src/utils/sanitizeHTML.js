import DOMPurify from 'dompurify'

const ALLOWED_IFRAME_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com'
])

DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName !== 'iframe') {
    return
  }

  const src = node.getAttribute('src') || ''
  try {
    const url = new URL(src, window.location.origin)
    if (ALLOWED_IFRAME_HOSTS.has(url.hostname)) {
      return
    }
  } catch {
    // Invalid iframe URLs are removed below.
  }

  node.parentNode?.removeChild(node)
})

const sanitizeConfig = {
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'loading', 'referrerpolicy'],
  FORBID_TAGS: ['script', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
}

export const sanitizeHTML = html => DOMPurify.sanitize(String(html || ''), sanitizeConfig)
