const Button = ({
  as: Component = 'button',
  variant = 'primary',
  size = 'medium',
  className = '',
  type,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-lg'

  const variantClasses = {
    primary: 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 hover:shadow-md',
    secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 hover:border-blue-300',
    outline: 'bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50',
    ghost: 'bg-transparent text-slate-600 hover:text-blue-600 hover:bg-slate-100',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300'
  }

  const sizeClasses = {
    small: 'h-8 px-3 text-xs',
    medium: 'h-10 px-4 text-sm',
    large: 'h-12 px-6 text-base'
  }

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.medium,
    className
  ].filter(Boolean).join(' ')

  return (
    <Component className={classes} type={Component === 'button' ? type || 'button' : undefined} {...props}>
      {children}
    </Component>
  )
}

export default Button
