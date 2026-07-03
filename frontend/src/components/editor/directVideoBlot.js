export const DIRECT_VIDEO_FORMAT = 'directVideo'

const registeredQuills = new WeakSet()

export const registerDirectVideoBlot = Quill => {
  if (!Quill || registeredQuills.has(Quill)) {
    return
  }

  const BlockEmbed = Quill.import('blots/block/embed')

  class DirectVideoBlot extends BlockEmbed {
    static create(value) {
      const node = super.create()
      node.setAttribute('src', String(value || ''))
      node.setAttribute('controls', '')
      node.setAttribute('preload', 'metadata')
      node.setAttribute('playsinline', '')
      node.setAttribute('style', 'max-width:100%;height:auto;')
      return node
    }

    static value(node) {
      return node.getAttribute('src') || ''
    }
  }

  DirectVideoBlot.blotName = DIRECT_VIDEO_FORMAT
  DirectVideoBlot.tagName = 'video'

  Quill.register(DirectVideoBlot)
  registeredQuills.add(Quill)
}
