const FormField = ({ label, hint, children, className = '', as = 'label' }) => {
  const Tag = as

  return (
    <Tag className={`block space-y-1.5 min-w-0 ${className}`}>
      {(label || hint) && (
        <span className="block space-y-0.5">
          {label && <span className="block text-sm font-bold text-slate-800">{label}</span>}
          {hint && <span className="block text-xs leading-relaxed text-slate-500">{hint}</span>}
        </span>
      )}
      {children}
    </Tag>
  )
}

export default FormField
