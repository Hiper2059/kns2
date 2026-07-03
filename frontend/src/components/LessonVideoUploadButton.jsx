import { useRef, useState } from 'react'
import { Film, LoaderCircle } from 'lucide-react'
import {
  LESSON_VIDEO_ACCEPT,
  uploadSelectedLessonVideo
} from '../utils/lessonVideoUpload'

const LessonVideoUploadButton = ({
  className = '',
  disabled = false,
  onUpload,
  onUploaded,
  onUploadingChange
}) => {
  const inputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || isUploading) return

    setIsUploading(true)
    onUploadingChange?.(true)
    try {
      const url = await uploadSelectedLessonVideo(file, onUpload)
      if (url) onUploaded?.(url)
    } catch {
      // onUpload owns the user-facing error message.
    } finally {
      setIsUploading(false)
      onUploadingChange?.(false)
    }
  }

  const isDisabled = disabled || isUploading || typeof onUpload !== 'function'

  return (
    <>
      <button
        type="button"
        className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
        disabled={isDisabled}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? <LoaderCircle size={18} className="animate-spin" /> : <Film size={18} />}
        <span>{isUploading ? 'Đang tải lên...' : 'Tải video lên'}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={LESSON_VIDEO_ACCEPT}
        onChange={handleFileChange}
      />
    </>
  )
}

export default LessonVideoUploadButton
