import { useEffect, useMemo, useRef, useState } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import axios from 'axios'
import 'react-quill/dist/quill.snow.css'
import { getApiErrorMessage } from '../utils/apiMessages'
import './RichTextEditor.css'

const quillFormats = [
  'bold',
  'italic',
  'underline',
  'link',
  'image',
  'video'
]

const latexTextReplacements = [
  [/\\rightarrow/g, '→'],
  [/\\leftarrow/g, '←'],
  [/\\uparrow/g, '↑'],
  [/\\downarrow/g, '↓'],
  [/\\times/g, '×'],
  [/\\div/g, '÷'],
  [/\\leq/g, '≤'],
  [/\\geq/g, '≥']
]

const normalizePastedText = text => {
  let normalized = String(text || '')

  latexTextReplacements.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement)
  })

  normalized = normalized
    .replace(/([→←↑↓×÷≤≥])\s*\$/g, '$1')
    .replace(/\$\s*([→←↑↓×÷≤≥])/g, '$1')
    .replace(/\u00a0/g, ' ')

  return normalized
}

const buildModules = toolbarId => ({
  toolbar: {
    container: `#${toolbarId}`,
    handlers: {}
  }
})

const defaultInlineFormats = {
  bold: false,
  italic: false,
  underline: false
}

const applyStickyFormats = (quill, formats, source = 'silent') => {
  if (!quill) return

  Object.entries(formats).forEach(([name, enabled]) => {
    quill.format(name, enabled, source)
  })
}

const toggleInlineFormat = (quill, format, savedRange, activeFormatsRef, onActiveFormatsChange) => {
  if (!quill) return

  const fallbackIndex = Math.max((quill.getLength?.() || 1) - 1, 0)
  const range = quill.getSelection() || savedRange || { index: fallbackIndex, length: 0 }
  if (!range) return

  const nextFormats = {
    ...activeFormatsRef.current,
    [format]: !activeFormatsRef.current[format]
  }

  activeFormatsRef.current = nextFormats
  onActiveFormatsChange(nextFormats)

  quill.focus()
  quill.setSelection(range.index, range.length, 'silent')

  if (range.length > 0) {
    quill.formatText(range.index, range.length, format, nextFormats[format], 'user')
    quill.setSelection(range.index, range.length, 'silent')
    applyStickyFormats(quill, nextFormats)
    return
  }

  applyStickyFormats(quill, nextFormats, 'user')
}

const RichTextEditor = ({ value, onChange, placeholder, toolbarId }) => {
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const quillRef = useRef(null)
  const lastRangeRef = useRef(null)
  const activeFormatsRef = useRef(defaultInlineFormats)
  const [imageProgress, setImageProgress] = useState(0)
  const [videoProgress, setVideoProgress] = useState(0)
  const [activeFormats, setActiveFormats] = useState(defaultInlineFormats)

  const uploadToApi = async (file, type) => {
    if (!file) return null
    const token = localStorage.getItem('zmate_access_token')
    const formData = new FormData()
    formData.append(type, file)
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')
      const res = await axios.post(`${API_BASE}/api/uploads/${type}`, formData, {
        headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: progressEvent => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          if (type === 'image') setImageProgress(percent)
          if (type === 'video') setVideoProgress(percent)
        }
      })
      setTimeout(() => {
        if (type === 'image') setImageProgress(0)
        if (type === 'video') setVideoProgress(0)
      }, 800)
      return res.data?.url || null
    } catch (err) {
      console.error('Upload error', err)
      alert(getApiErrorMessage(err, 'Không upload được file.'))
      if (type === 'image') setImageProgress(0)
      if (type === 'video') setVideoProgress(0)
      return null
    }
  }

  const imageHandler = function () {
    imageInputRef.current?.click()
  }

  const videoHandler = function () {
    videoInputRef.current?.click()
  }

  const modules = useMemo(() => ({
    ...buildModules(toolbarId),
    toolbar: {
      ...buildModules(toolbarId).toolbar,
      handlers: {
        ...buildModules(toolbarId).toolbar.handlers,
        image: imageHandler,
        video: videoHandler
      }
    }
  }), [toolbarId])

  const handleInlineFormatClick = format => {
    const quillInstance = quillRef.current?.getEditor?.()
    toggleInlineFormat(quillInstance, format, lastRangeRef.current, activeFormatsRef, setActiveFormats)
  }

  useEffect(() => {
    const quillInstance = quillRef.current?.getEditor?.()
    if (!quillInstance) {
      return
    }

    const textNodeType = window.Node?.TEXT_NODE || 3
    quillInstance.clipboard.addMatcher(textNodeType, (node, delta) => {
      const normalizedDelta = delta?.ops?.reduce((accumulator, op) => {
        if (typeof op.insert === 'string') {
          accumulator.insert(normalizePastedText(op.insert), op.attributes)
          return accumulator
        }

        accumulator.insert(op.insert, op.attributes)
        return accumulator
      }, new (Quill.import('delta'))())

      return normalizedDelta || delta
    })

    const preserveStickyFormats = () => {
      const range = quillInstance.getSelection()
      if (range) {
        lastRangeRef.current = range
        if (range.length === 0) {
          applyStickyFormats(quillInstance, activeFormatsRef.current)
        }
      }
    }

    quillInstance.on('selection-change', preserveStickyFormats)
    quillInstance.on('text-change', preserveStickyFormats)

    return () => {
      quillInstance.off('selection-change', preserveStickyFormats)
      quillInstance.off('text-change', preserveStickyFormats)
    }
  }, [])

  return (
    <div className="rich-editor">
      <div id={toolbarId} className="ql-toolbar ql-snow editor-toolbar">
        <span className="ql-formats">
          <button
            className={activeFormats.bold ? 'editor-format-button is-active' : 'editor-format-button'}
            type="button"
            aria-label="In đậm"
            aria-pressed={activeFormats.bold}
            onMouseDown={event => event.preventDefault()}
            onClick={() => handleInlineFormatClick('bold')}
          >
            B
          </button>
          <button
            className={activeFormats.italic ? 'editor-format-button is-active' : 'editor-format-button'}
            type="button"
            aria-label="In nghiêng"
            aria-pressed={activeFormats.italic}
            onMouseDown={event => event.preventDefault()}
            onClick={() => handleInlineFormatClick('italic')}
          >
            <i>I</i>
          </button>
          <button
            className={activeFormats.underline ? 'editor-format-button is-active' : 'editor-format-button'}
            type="button"
            aria-label="Gạch chân"
            aria-pressed={activeFormats.underline}
            onMouseDown={event => event.preventDefault()}
            onClick={() => handleInlineFormatClick('underline')}
          >
            <u>U</u>
          </button>
        </span>
        <span className="ql-formats">
          <button className="ql-link" type="button" aria-label="Chèn liên kết" />
          <button className="ql-image" type="button" aria-label="Chèn ảnh" />
          <button className="ql-video" type="button" aria-label="Chèn video" />
        </span>
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={async e => {
          const file = e.target.files?.[0]
          if (!file) return
          const url = await uploadToApi(file, 'image')
          if (url) {
            const quillInstance = quillRef.current?.getEditor?.()
            const range = quillInstance?.getSelection?.() || { index: quillInstance?.getLength?.() || 0 }
            if (url && quillInstance) {
              quillInstance.insertEmbed(range.index, 'image', url, 'user')
              quillInstance.setSelection(range.index + 1)
            }
          }
          e.target.value = ''
        }}
      />
      {imageProgress > 0 && imageProgress < 100 && (
        <div className="upload-progress image">
          <div className="bar" style={{ width: `${imageProgress}%` }}></div>
          <div className="label">Đang tải ảnh lên {imageProgress}%</div>
        </div>
      )}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={async e => {
          const file = e.target.files?.[0]
          if (!file) return
          const url = await uploadToApi(file, 'video')
          const quillInstance = quillRef.current?.getEditor?.()
          const range = quillInstance?.getSelection?.() || { index: quillInstance?.getLength?.() || 0 }
          if (url && quillInstance) {
            quillInstance.clipboard.dangerouslyPasteHTML(range.index, `<p><video controls src="${url}" style="max-width:100%"></video></p>`, 'user')
          }
          e.target.value = ''
        }}
      />
      {videoProgress > 0 && videoProgress < 100 && (
        <div className="upload-progress video">
          <div className="bar" style={{ width: `${videoProgress}%` }}></div>
          <div className="label">Đang tải video lên {videoProgress}%</div>
        </div>
      )}
      <ReactQuill
        theme="snow"
        ref={quillRef}
        modules={modules}
        formats={quillFormats}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  )
}

export default RichTextEditor
