const EmptyState = ({ title, children, className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-2 border border-dashed border-slate-300 rounded-2xl bg-slate-50 p-8 text-center text-slate-500 ${className}`}>
    {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
    {children}
  </div>
)

export default EmptyState
