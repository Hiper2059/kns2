import './AuthModal.css'

const AuthModal = ({
  isOpen,
  authMode,
  authData,
  isAuthLoading,
  title,
  disableRegister = false,
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
      <div className="auth-modal card-panel">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
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
    </div>
  )
}

export default AuthModal
