const Input = ({ className = '', ...props }) => {
  const classes = [
    'w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none transition-colors px-4 py-2 h-10 text-sm text-slate-800 placeholder-slate-400',
    className
  ].filter(Boolean).join(' ')

  return <input className={classes} {...props} />
}

export default Input
