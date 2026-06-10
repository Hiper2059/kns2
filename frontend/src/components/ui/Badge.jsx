const Badge = ({ variant = 'neutral', className = '', children, ...props }) => {
  const baseClasses = 'inline-flex items-center gap-1.5 w-fit rounded-full px-2.5 py-1 text-xs font-bold leading-none'
  const variantClasses = {
    neutral: 'bg-slate-100 text-slate-600',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700'
  }
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant] || variantClasses.neutral} ${className}`} {...props}>
      {children}
    </span>
  )
}

export default Badge
