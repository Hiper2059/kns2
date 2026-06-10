import { Search } from 'lucide-react'

const SearchInput = ({ className = '', inputClassName = '', ...props }) => (
  <label className={`flex items-center gap-2.5 w-full bg-white border border-slate-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 rounded-lg px-3.5 h-10 transition-colors text-slate-400 ${className}`}>
    <Search size={18} aria-hidden="true" />
    <input className={`flex-1 border-0 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none ${inputClassName}`} type="search" {...props} />
  </label>
)

export default SearchInput
