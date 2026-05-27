import './ChatWidget.css'

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
}) => (
  <>
    {isOpen && (
      <div className="chat-container floating-chat card-panel">
        <div className="chat-header">
          <h3>Z-Mate Tư vấn</h3>
          <button className="chat-close" onClick={onClose}>×</button>
        </div>
        <div className="chat-box">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <p>{msg.text}</p>
              {Array.isArray(msg.actions) && msg.actions.length > 0 && (
                <div className="chat-actions">
                  {msg.actions.map(action => (
                    <button
                      key={`${index}-${action.id}`}
                      className="chat-action-btn"
                      onClick={() => onActionClick(action.id)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && <p className="message bot">Z-Mate đang gõ...</p>}
        </div>
        <div className="input-area">
          <input
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isLoading && onSend()}
            placeholder="Hỏi Z-Mate..."
          />
          <button onClick={onSend} className="btn-search" disabled={isLoading}>
            {isLoading ? '...' : 'Gửi'}
          </button>
        </div>
      </div>
    )}

    <button className="chat-toggle-btn" onClick={onToggle}>
      {isOpen ? '−' : 'Chat'}
    </button>
  </>
)

export default ChatWidget
