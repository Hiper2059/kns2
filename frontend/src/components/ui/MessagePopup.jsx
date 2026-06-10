import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

const MessagePopup = ({
  isOpen,
  title = 'Thông báo',
  message = '',
  onClose,
  variant = 'info' // 'success', 'error', 'warning', 'info'
}) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (variant) {
      case 'success': return <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
      case 'error': return <XCircle className="w-12 h-12 text-red-500 mb-4" />
      case 'warning': return <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
      case 'info': return <Info className="w-12 h-12 text-blue-500 mb-4" />
      default: return <Info className="w-12 h-12 text-blue-500 mb-4" />
    }
  }

  const getButtonColor = () => {
    switch (variant) {
      case 'success': return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
      case 'error': return 'bg-red-600 hover:bg-red-700 text-white border-red-600'
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
      case 'info': return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
      default: return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
    }
  }

  return (
    <Modal title={title} onClose={onClose} className="max-w-sm">
      <div className="flex flex-col items-center text-center">
        {getIcon()}
        <p className="text-slate-600 mb-6 whitespace-pre-wrap">{message}</p>
        <Button className={`w-full ${getButtonColor()}`} onClick={onClose}>
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default MessagePopup
