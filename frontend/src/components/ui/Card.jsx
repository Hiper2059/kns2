const Card = ({ as = 'div', variant = 'default', className = '', children, ...props }) => {
  const Tag = as
  const baseClasses = 'bg-white border border-slate-200'
  
  const variantClasses = {
    default: 'rounded-2xl transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1',
    flat: 'rounded-xl',
    soft: 'rounded-xl bg-slate-50'
  }

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.default,
    className
  ].filter(Boolean).join(' ')

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  )
}

export default Card
