import { useMemo, useRef, useState } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import axios from 'axios'
import 'react-quill/dist/quill.snow.css'
import './RichTextEditor.css'

let quillRegistered = false

const registerQuill = () => {
  if (quillRegistered) return

  const Font = Quill.import('formats/font')
  Font.whitelist = [
    'sans-serif',
    'serif',
    'monospace',
    'be-vietnam-pro',
    'merriweather',
    'fira-sans'
  ]
  Quill.register(Font, true)
  quillRegistered = true
}

const quillFormats = [
  'font',
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'script',
  'list',
  'indent',
  'align',
  'blockquote',
  'code-block',
  'link',
  'image',
  'video'
]

const buildModules = toolbarId => ({
  toolbar: {
    container: `#${toolbarId}`,
    handlers: {
      latex: function () {
        const range = this.quill.getSelection()
        if (!range) return
        const insertText = '$$\\text{LaTeX}$$'
        this.quill.insertText(range.index, insertText, 'user')
        this.quill.setSelection(range.index + 2, 8, 'user')
      }
    }
  }
})

const RichTextEditor = ({ value, onChange, placeholder, toolbarId }) => {
  registerQuill()

  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const quillRef = useRef(null)
  const [imageProgress, setImageProgress] = useState(0)
  const [videoProgress, setVideoProgress] = useState(0)

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
      alert(err.response?.data?.message || err.message || 'Không upload được file.')
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

  return (
    <div className="rich-editor">
      <div id={toolbarId} className="ql-toolbar ql-snow editor-toolbar">
        <span className="ql-formats">
          <select className="ql-font" defaultValue="sans-serif">
            <option value="sans-serif">Sans</option>
            <option value="serif">Serif</option>
            <option value="monospace">Mono</option>
            <option value="be-vietnam-pro">Be Vietnam Pro</option>
            <option value="merriweather">Merriweather</option>
            <option value="fira-sans">Fira Sans</option>
          </select>
          <select className="ql-header" defaultValue="">
            <option value="1">H1</option>
            <option value="2">H2</option>
            <option value="3">H3</option>
            <option value="">Normal</option>
          </select>
        </span>
        <span className="ql-formats">
          <button className="ql-bold" />
          <button className="ql-italic" />
          <button className="ql-underline" />
          <button className="ql-strike" />
        </span>
        <span className="ql-formats">
          <button className="ql-list" value="ordered" />
          <button className="ql-list" value="bullet" />
          <button className="ql-indent" value="-1" />
          <button className="ql-indent" value="+1" />
        </span>
        <span className="ql-formats">
          <button className="ql-blockquote" />
          <button className="ql-code-block" />
        </span>
        <span className="ql-formats">
          <button className="ql-link" />
          <button className="ql-image" />
          <button className="ql-video" />
        </span>
        <span className="ql-formats">
          <button className="ql-clean" />
        </span>
        <span className="ql-formats">
          <button className="ql-latex" type="button">Text LaTeX</button>
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
          <div className="label">Uploading image {imageProgress}%</div>
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
          <div className="label">Uploading video {videoProgress}%</div>
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
