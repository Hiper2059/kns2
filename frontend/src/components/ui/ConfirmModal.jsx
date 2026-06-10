import React from 'react'
import Modal from './Modal'
import Button from './Button'
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'

const ConfirmModal = ({ 
  isOpen, 
  title = 'Xác nhận', 
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?', 
  confirmText = 'Đồng ý', 
  cancelText = 'Hủy', 
  onConfirm, 
  onCancel,
  variant = 'warning' // 'warning', 'danger', 'info'
}) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (variant) {
      case 'danger': return <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
      case 'warning': return <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
      case 'info': return <Info className="w-12 h-12 text-blue-500 mb-4" />
      default: return <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
    }
  }

  const getConfirmColor = () => {
    switch (variant) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white border-red-600'
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
      case 'info': return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
      default: return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
    }
  }

  return (
    <Modal title={title} onClose={onCancel} className="max-w-sm">
      <div className="flex flex-col items-center text-center">
        {getIcon()}
        <p className="text-slate-600 mb-6">{message}</p>
        
        <div className="flex items-center gap-3 w-full">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button className={`flex-1 ${getConfirmColor()}`} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmModal
