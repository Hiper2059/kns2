const Select = ({ className = '', children, ...props }) => (
  <select 
    className={`w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none transition-colors px-4 py-2 h-10 text-sm text-slate-800 ${className}`} 
    {...props}
  >
    {children}
  </select>
)

export default Select
