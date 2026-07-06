import { useMemo } from 'react'

const allowedTags = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'BLOCKQUOTE',
  'OL', 'UL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'A', 'IMG', 'VIDEO', 'SOURCE', 'IFRAME', 'SPAN', 'DIV'
])

const allowedAttributes = new Set([
  'href', 'src', 'alt', 'title', 'target', 'rel', 'width', 'height',
  'controls', 'preload', 'playsinline', 'allow', 'allowfullscreen',
  'frameborder', 'loading', 'referrerpolicy', 'type'
])

const allowedIframeHosts = new Set([
  'youtube.com', 'www.youtube.com', 'youtube-nocookie.com',
  'www.youtube-nocookie.com', 'player.vimeo.com'
])

const hasSafeUrl = (value, { image = false } = {}) => {
  const normalized = String(value || '').trim()
  if (!normalized) return false
  if (image && /^data:image\/(png|jpeg|gif|webp);base64,/i.test(normalized)) return true
  try {
    const url = new URL(normalized, window.location.origin)
    return ['http:', 'https:', 'blob:'].includes(url.protocol)
  } catch {
    return false
  }
}

const sanitizeRichHtml = html => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return ''
  const documentNode = new DOMParser().parseFromString(String(html || ''), 'text/html')

  Array.from(documentNode.body.querySelectorAll('*')).forEach(node => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...node.childNodes)
      return
    }

    Array.from(node.attributes).forEach(attribute => {
      if (!allowedAttributes.has(attribute.name.toLowerCase())) {
        node.removeAttribute(attribute.name)
      }
    })

    if (node.hasAttribute('href') && !hasSafeUrl(node.getAttribute('href'))) {
      node.removeAttribute('href')
    }
    if (node.hasAttribute('src') && !hasSafeUrl(node.getAttribute('src'), { image: node.tagName === 'IMG' })) {
      node.removeAttribute('src')
    }
    if (node.tagName === 'IFRAME') {
      try {
        const url = new URL(node.getAttribute('src') || '', window.location.origin)
        if (!allowedIframeHosts.has(url.hostname) || url.protocol !== 'https:') node.remove()
      } catch {
        node.remove()
      }
    }
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })

  return documentNode.body.innerHTML
}

const SafeRichHtml = ({ html, className = '' }) => {
  const safeHtml = useMemo(() => sanitizeRichHtml(html), [html])
  return <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml }} />
}

export default SafeRichHtml
