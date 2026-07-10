import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import axios from 'axios'
import 'react-quill/dist/quill.snow.css'
import { getApiErrorMessage } from '../utils/apiMessages'
import { useUI } from '../context/UIContext'
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

const buildModules = handlers => ({
  toolbar: {
    container: [
      ['bold', 'italic', 'underline'],
      ['link', 'image', 'video']
    ],
    handlers
  }
})

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const { showError } = useUI()
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const quillRef = useRef(null)
  const pendingSelectionRef = useRef(null)
  const stickyFormatsRef = useRef({
    bold: false,
    italic: false,
    underline: false
  })
  const [imageProgress, setImageProgress] = useState(0)
  const [videoProgress, setVideoProgress] = useState(0)

  const uploadToApi = async (file, type) => {
    if (!file) return null
    const token = localStorage.getItem('zmate_access_token')
    const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')

    try {
      const formData = new FormData()
      formData.append(type, file)
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
      showError(getApiErrorMessage(err, 'Không upload được file.'))
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

  const restoreSelectionSoon = useCallback(() => {
    window.requestAnimationFrame(() => {
      const quillInstance = quillRef.current?.getEditor?.()
      const selection = pendingSelectionRef.current
      if (!quillInstance || !selection) {
        return
      }

      const maxIndex = Math.max((quillInstance.getLength?.() || 1) - 1, 0)
      quillInstance.setSelection(Math.min(selection.index, maxIndex), selection.length || 0, 'silent')
    })
  }, [])

  const applyInlineFormat = useCallback(format => {
    const quillInstance = quillRef.current?.getEditor?.()
    if (!quillInstance) {
      return
    }

    const fallbackIndex = Math.max((quillInstance.getLength?.() || 1) - 1, 0)
    const range = quillInstance.getSelection() || pendingSelectionRef.current || { index: fallbackIndex, length: 0 }
    const currentFormats = quillInstance.getFormat(range)
    const enabled = !currentFormats?.[format]

    quillInstance.focus()
    quillInstance.setSelection(range.index, range.length || 0, 'silent')

    if (range.length > 0) {
      quillInstance.formatText(range.index, range.length, format, enabled, 'user')
      quillInstance.setSelection(range.index, range.length, 'silent')
    } else {
      quillInstance.format(format, enabled, 'user')
    }

    stickyFormatsRef.current = {
      ...stickyFormatsRef.current,
      [format]: enabled
    }
    pendingSelectionRef.current = quillInstance.getSelection() || range
  }, [])

  // Handler chỉ đọc ref khi Quill gọi sau render.
  /* eslint-disable react-hooks/refs */
  const modules = useMemo(
    () => buildModules({
      bold: () => applyInlineFormat('bold'),
      italic: () => applyInlineFormat('italic'),
      underline: () => applyInlineFormat('underline'),
      image: imageHandler,
      video: videoHandler
    }),
    [applyInlineFormat]
  )
  /* eslint-enable react-hooks/refs */

  const handleEditorChange = useCallback((content, delta, source, editor) => {
    const quillInstance = quillRef.current?.getEditor?.()
    const selection = quillInstance?.getSelection?.()
    if (selection) {
      pendingSelectionRef.current = selection
    }

    onChange?.(content, delta, source, editor)

    if (selection) {
      restoreSelectionSoon()
    }
  }, [onChange, restoreSelectionSoon])

  useEffect(() => {
    const quillInstance = quillRef.current?.getEditor?.()
    if (!quillInstance) {
      return undefined
    }

    const syncStickyFormats = (range, oldRange, source) => {
      if (range) {
        pendingSelectionRef.current = range
      }

      if (!range || source !== 'user') {
        return
      }

      const formats = quillInstance.getFormat(range)
      stickyFormatsRef.current = {
        bold: Boolean(formats.bold),
        italic: Boolean(formats.italic),
        underline: Boolean(formats.underline)
      }
    }

    const preserveStickyFormats = (delta, oldDelta, source) => {
      if (source !== 'user') {
        return
      }

      const range = quillInstance.getSelection()
      if (!range) {
        return
      }

      pendingSelectionRef.current = range
      if (range.length === 0) {
        Object.entries(stickyFormatsRef.current).forEach(([format, enabled]) => {
          if (enabled) {
            quillInstance.format(format, true, 'silent')
          }
        })
      }
    }

    quillInstance.on('selection-change', syncStickyFormats)
    quillInstance.on('text-change', preserveStickyFormats)

    return () => {
      quillInstance.off('selection-change', syncStickyFormats)
      quillInstance.off('text-change', preserveStickyFormats)
    }
  }, [])

  useEffect(() => {
    restoreSelectionSoon()
  }, [value, restoreSelectionSoon])

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

    return undefined
  }, [])

  return (
    <div className="rich-editor">
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
        onChange={handleEditorChange}
        placeholder={placeholder}
      />
    </div>
  )
}

export default RichTextEditor
