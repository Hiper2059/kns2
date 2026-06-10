import { X } from 'lucide-react'

const Modal = ({ title, children, onClose, className = '', bodyClassName = '', labelledBy = 'modal-title' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
    <div
      className={`w-full max-w-md max-h-[90vh] overflow-auto border border-white/70 rounded-2xl bg-white shadow-2xl ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={event => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 pb-4">
        <h2 id={labelledBy} className="m-0 text-xl font-bold leading-tight text-slate-800">{title}</h2>
        <button type="button" className="grid place-items-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300" onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </button>
      </div>
      <div className={`p-5 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  </div>
)

export default Modal
