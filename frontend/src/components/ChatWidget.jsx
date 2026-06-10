import { BotMessageSquare, X, Send, User, Sparkles } from 'lucide-react'

const ChatWidget = ({
  isOpen,
  messages,
  isLoading,
  input,
  onInputChange,
  onSend,
  onToggle,
  onClose,
  onActionClick
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-[360px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden mb-4 border border-slate-200/60 transform transition-all duration-300 origin-bottom-right animate-in zoom-in-95">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 pb-5 flex items-center justify-between text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 right-10 w-24 h-24 bg-blue-400/20 rounded-full blur-xl mb-[-20px]"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                <BotMessageSquare size={22} className="text-white drop-shadow-sm" />
              </div>
              <div>
                <h3 className="font-black text-[17px] tracking-wide drop-shadow-sm">Z-Mate AI</h3>
                <span className="text-[12px] font-bold text-blue-100 flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  Đang trực tuyến
                </span>
              </div>
            </div>
            <button className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4 shadow-sm relative">
                  <BotMessageSquare size={36} />
                  <div className="absolute -top-1 -right-1 text-yellow-400 animate-bounce"><Sparkles size={20} /></div>
                </div>
                <p className="text-[15px] font-black text-slate-700 mb-2">Xin chào! Tớ là Z-Mate 👋</p>
                <p className="text-[13px] font-medium text-slate-500 leading-relaxed">Tớ ở đây để hỗ trợ cậu về kỹ năng sống, học tập và phát triển bản thân. Cậu muốn hỏi gì nào?</p>
              </div>
            )}
            
            {messages.map((msg, index) => {
              const isBot = msg.sender === 'bot'
              return (
                <div key={index} className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex max-w-[85%] gap-2 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto shadow-sm ${isBot ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {isBot ? <BotMessageSquare size={16} /> : <User size={16} />}
                    </div>
                    <div className={`flex flex-col gap-2 ${isBot ? 'items-start' : 'items-end'}`}>
                      <div className={`px-4 py-2.5 text-[14px] font-medium shadow-sm whitespace-pre-wrap leading-relaxed ${isBot ? 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-bl-sm' : 'bg-blue-600 text-white rounded-2xl rounded-br-sm'}`}>
                        {msg.text}
                      </div>
                      {Array.isArray(msg.actions) && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {msg.actions.map(action => (
                            <button
                              key={`${index}-${action.id}`}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-bold rounded-xl border border-blue-200 transition-colors shadow-sm"
                              onClick={() => onActionClick(action.id)}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex gap-2 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                    <BotMessageSquare size={16} />
                  </div>
                  <div className="px-4 py-3.5 bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <div className="relative flex items-center">
              <input
                className="w-full h-12 pl-4 pr-12 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                value={input}
                onChange={e => onInputChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isLoading && input.trim() && onSend()}
                placeholder="Hỏi Z-Mate điều gì đó..."
                disabled={isLoading}
              />
              <button 
                onClick={onSend} 
                disabled={isLoading || !input.trim()}
                className="absolute right-1.5 w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                <Send size={15} className={input.trim() && !isLoading ? "translate-x-[-1px] translate-y-[1px]" : ""} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen ? 'bg-slate-800 hover:bg-slate-900 text-white scale-90' : 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:scale-110 text-white animate-bounce shadow-blue-500/40'} cursor-pointer`}
        onClick={onToggle}
      >
        {isOpen ? <X size={24} /> : <BotMessageSquare size={28} />}
      </button>
    </div>
  )
}

export default ChatWidget
