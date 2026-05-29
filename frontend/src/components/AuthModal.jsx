import './AuthModal.css'

const AuthModal = ({
  isOpen,
  authMode,
  authData,
  isAuthLoading,
  title,
  disableRegister = false,
  notifications = [],
  onClose,
  onAuth,
  onSwitchMode,
  onChange
}) => {
  if (!isOpen) {
    return null
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal card-panel auth-modal-split">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <div className="auth-form-panel">
          <h2>{title || (authMode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản')}</h2>
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={authData.username}
            onChange={e => onChange({ ...authData, username: e.target.value })}
          />
          {authMode === 'register' && (
            <input
              type="text"
              placeholder="Tên người dùng"
              value={authData.displayName || ''}
              onChange={e => onChange({ ...authData, displayName: e.target.value })}
            />
          )}
          <input
            type="password"
            placeholder="Mật khẩu"
            value={authData.password}
            onChange={e => onChange({ ...authData, password: e.target.value })}
          />
          <button className="btn-post" onClick={onAuth} disabled={isAuthLoading}>
            {isAuthLoading ? 'Đang xử lý...' : authMode === 'login' ? 'Vào ngay' : 'Tạo tài khoản'}
          </button>
          {!disableRegister && (
            <button type="button" onClick={onSwitchMode} className="auth-switch">
              {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          )}
        </div>

        <aside className="auth-notice-panel" aria-live="polite">
          <div className="auth-notice-header">
            <h3>Thông báo</h3>
            <span>{notifications.length}</span>
          </div>
          {notifications.length ? (
            <ul className="auth-notice-list">
              {notifications.map((item, index) => (
                <li key={`${item.title || 'note'}-${index}`} className={`auth-notice-item ${item.type || 'info'}`}>
                  <strong>{item.title || 'Lưu ý'}</strong>
                  <p>{item.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="auth-notice-empty">Chưa có thông báo nào.</p>
          )}
        </aside>
      </div>
    </div>
  )
}

export default AuthModal
