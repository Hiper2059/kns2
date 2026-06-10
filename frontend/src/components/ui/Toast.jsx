import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const iconMap = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />
}

const colorMap = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
}

const iconColorMap = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500'
}

const progressColorMap = {
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  warning: 'bg-amber-400',
  info: 'bg-blue-400'
}

const TOAST_DURATION = 3500

const ToastItem = ({ toast, onRemove }) => {
  const [exiting, setExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const startTime = Date.now()
    const duration = toast.duration || TOAST_DURATION

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 30)

    const timeout = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onRemove(toast.id), 300)
    }, duration)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [toast.id, toast.duration, onRemove])

  const handleClose = () => {
    setExiting(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const type = toast.type || 'info'

  return (
    <div
      className={`
        relative overflow-hidden flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)]
        border rounded-xl shadow-lg px-4 pt-3 pb-3
        transition-all duration-300
        ${colorMap[type] || colorMap.info}
        ${exiting ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'}
      `}
      role="alert"
    >
      <span className={`mt-0.5 shrink-0 ${iconColorMap[type] || iconColorMap.info}`}>
        {iconMap[type] || iconMap.info}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug break-words">{toast.message}</p>
      </div>
      <button
        type="button"
        className="shrink-0 mt-0.5 p-0.5 rounded hover:bg-black/5 transition-colors"
        onClick={handleClose}
        aria-label="Đóng"
      >
        <X size={14} />
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5">
        <div
          className={`h-full transition-all duration-100 ease-linear ${progressColorMap[type] || progressColorMap.info}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

const ToastContainer = ({ toasts = [], onRemove }) => {
  if (!toasts.length) return null

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-auto">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

export default ToastContainer
