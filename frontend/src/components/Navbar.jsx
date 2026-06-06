import React from 'react'
import { NavLink } from 'react-router-dom'
import './Navbar.css'

const IconHome = ({ width = 18, height = 18 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5z" fill="currentColor"/>
  </svg>
)

const IconForum = ({ width = 18, height = 18 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1v3l4-3h8a2 2 0 0 0 2-2V6z" fill="currentColor"/>
  </svg>
)

const IconLms = ({ width = 18, height = 18 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 5h18v14H3V5zm4 2v10l6-5-6-5z" fill="currentColor"/>
  </svg>
)

const IconTeacher = ({ width = 18, height = 18 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1H4z" fill="currentColor"/>
  </svg>
)

const IconManage = ({ width = 18, height = 18 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8 4a6.98 6.98 0 0 0-.18-1.5l2.12-1.65-2-3.46-2.5.99A6.98 6.98 0 0 0 12 4a6.98 6.98 0 0 0-2.44.38L7.06 3.4 5.06 6.86 7.18 8.5A6.98 6.98 0 0 0 7 10c0 .34.03.67.08 1L4.96 12.7l2 3.46 2.5-.99c.7.4 1.45.7 2.28.9V20h4v-1.93c.83-.2 1.58-.5 2.28-.9l2.5.99 2-3.46-2.12-1.65c.05-.33.08-.66.08-1z" fill="currentColor"/>
  </svg>
)

const Navbar = ({
  currentRole,
  currentUser,
  currentUserLabel,
  currentUserAvatar,
  currentRank,
  currentUserPoints,
  onLogout,
  onOpenAuth,
  onBrandClick,
  onOpenProfile,
  sidebarCollapsed,
  onToggleSidebar,
  sidebarOpen,
  onCloseSidebar
}) => {
  return (
    <aside className={`sidebar glass-nav ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'overlay-open' : ''}`}>
      <div
        className="sidebar-brand clickable-brand"
        onClick={onBrandClick}
        role="button"
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onBrandClick()
          }
        }}
      >
        <div className="brand-row">
          <h1 className="logo">Z-Mate</h1>
          <button className="sidebar-toggle" onClick={onToggleSidebar}>Toggle</button>
        </div>
        <p className="tagline">Kỹ năng sống</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon"><IconHome/></span>
          <span className="label">Trang chủ</span>
        </NavLink>

        <NavLink to="/forum" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon"><IconForum/></span>
          <span className="label">Diễn đàn</span>
        </NavLink>

        <NavLink to="/courses" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon"><IconLms/></span>
          <span className="label">Lớp học</span>
        </NavLink>

        {(currentRole === 'teacher' || currentRole === 'admin') && (
          <NavLink to="/teacher" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="icon"><IconTeacher/></span>
            <span className="label">Giảng viên</span>
          </NavLink>
        )}

        {currentRole === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="icon"><IconManage/></span>
            <span className="label">Quản lý</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-bottom">
        {sidebarOpen && (
          <div className="mobile-close">
            <button className="btn-ghost" onClick={onCloseSidebar}>Đóng</button>
          </div>
        )}

        {currentUser ? (
          <>
            <button className="user-avatar" onClick={onOpenProfile} aria-label="Mở hồ sơ cá nhân">
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt={currentUserLabel || currentUser} />
              ) : (
                <span>{(currentUserLabel || currentUser || 'U').slice(0, 1).toUpperCase()}</span>
              )}
            </button>
            <button className="user-name" onClick={onOpenProfile}>
              {currentUserLabel || currentUser}
            </button>
            <div className="rank-pill">
              {currentRank?.name || ''} · {currentUserPoints || 0} điểm
            </div>
            <div className="auth-actions">
              <button className="btn-ghost" onClick={onOpenProfile}>Hồ sơ</button>
              <button className="btn-ghost" onClick={onLogout}>Đăng xuất</button>
            </div>
          </>
        ) : (
          <div className="auth-actions">
            <button className="btn-login" onClick={() => onOpenAuth('login')}>Đăng nhập</button>
            <button className="btn-register" onClick={() => onOpenAuth('register')}>Đăng ký</button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Navbar
