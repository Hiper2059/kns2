const Textarea = ({ className = '', ...props }) => (
  <textarea 
    className={`w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none transition-colors px-4 py-3 min-h-[110px] text-sm text-slate-800 placeholder-slate-400 resize-y ${className}`} 
    {...props} 
  />
)

export default Textarea
