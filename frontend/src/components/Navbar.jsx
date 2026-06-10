import React from 'react'
import { NavLink } from 'react-router-dom'
import { BookOpen, Home, LogOut, Menu, MessageCircle, Settings, UserRound, UsersRound } from 'lucide-react'

const Navbar = ({
  currentRole,
  currentUser,
  currentUserLabel,
  currentUserAvatar,
  onLogout,
  onOpenAuth,
  onBrandClick,
  onOpenForum,
  onOpenProfile,
  sidebarOpen,
  onToggleSidebar,
  onCloseSidebar
}) => {
  const closeMobileSidebar = () => {
    if (sidebarOpen) {
      onCloseSidebar?.()
    }
  }

  const runAndClose = callback => event => {
    callback?.(event)
    closeMobileSidebar()
  }

  return (
    <header className={`fixed top-0 left-0 z-50 w-full min-h-[64px] px-4 md:px-[7.8vw] bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300 grid items-center gap-5 ${sidebarOpen ? 'grid-cols-1 gap-3 p-4 items-stretch' : 'grid-cols-[1fr_auto] md:grid-cols-[minmax(190px,auto)_minmax(0,1fr)_auto]'}`}>
      
      {/* Brand */}
      <div
        className="min-w-0 cursor-pointer flex"
        onClick={runAndClose(onBrandClick)}
        role="button"
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onBrandClick?.()
          }
        }}
      >
        <div className="inline-flex items-center gap-3 min-w-0">
          <span className="grid place-items-center w-[34px] h-[34px] rounded-lg bg-blue-600 text-white text-[15px] font-black leading-none shadow-[0_10px_18px_rgba(37,99,235,0.22)]">Z</span>
          <div className="grid gap-[1px] min-w-0">
            <div className="text-slate-900 text-[17px] font-black leading-tight whitespace-nowrap">Z-Mate</div>
            <div className="text-slate-500 text-[9px] font-black leading-snug tracking-wider whitespace-nowrap">KỸ NĂNG SỐNG</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`min-w-0 ${sidebarOpen ? 'grid gap-2 items-stretch' : 'hidden md:flex items-center justify-center gap-2'}`} aria-label="Điều hướng chính">
        {[
          { to: '/', icon: Home, label: 'Trang chủ', onClick: closeMobileSidebar },
          { to: '/forum', icon: MessageCircle, label: 'Diễn đàn', onClick: runAndClose(onOpenForum) },
          { to: '/courses', icon: BookOpen, label: 'Lớp học', onClick: closeMobileSidebar },
          ...(currentRole === 'teacher' ? [{ to: '/teacher', icon: UsersRound, label: 'Giảng viên', onClick: closeMobileSidebar }] : []),
          ...(currentRole === 'admin' ? [{ to: '/admin', icon: Settings, label: 'Quản lý', onClick: closeMobileSidebar }] : [])
        ].map((item, idx) => (
          <NavLink key={idx} to={item.to} onClick={item.onClick} className={({ isActive }) => `relative inline-flex items-center gap-2 min-h-[38px] px-3.5 rounded-full text-[13px] font-bold transition-all duration-200 ${sidebarOpen ? 'min-h-[44px] justify-start rounded-xl' : ''} ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}>
            <span className="inline-flex items-center justify-center text-current"><item.icon size={16} /></span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className={`flex items-center justify-end min-w-0 gap-2 ${sidebarOpen ? 'grid grid-cols-[auto_1fr] justify-between w-full mt-2' : ''}`}>
        
        {!sidebarOpen && (
          <button className="md:hidden inline-flex items-center justify-center w-[38px] h-[38px] rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer" onClick={onToggleSidebar} aria-label="Mở menu">
            <Menu size={18} />
          </button>
        )}

        {sidebarOpen && (
          <div className="inline-flex">
            <button className="inline-flex items-center justify-center gap-1.5 min-h-[34px] rounded-lg px-3.5 text-[12px] font-black border border-slate-200 bg-white text-blue-600 hover:bg-blue-50 active:translate-y-px transition-all" onClick={onCloseSidebar}>Đóng</button>
          </div>
        )}

        {currentUser ? (
          <div className={`inline-flex items-center gap-3 ${sidebarOpen ? 'inline-flex' : 'hidden md:inline-flex'}`}>
            <button 
              className="inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 border border-slate-200 rounded-full bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
              onClick={runAndClose(onOpenProfile)}
              aria-label="Mở hồ sơ cá nhân"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-700">
                {currentUserAvatar ? (
                  <img src={currentUserAvatar} alt={currentUserLabel || currentUser} className="w-full h-full object-cover block" />
                ) : (
                  (currentUserLabel || currentUser || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-[13px] font-bold text-slate-700 max-w-[120px] truncate">
                {currentUserLabel || currentUser}
              </span>
            </button>
            <button 
              className="inline-flex items-center justify-center min-h-[34px] rounded-xl px-4 text-[13px] font-bold border border-slate-200 bg-white text-blue-600 hover:bg-blue-50 active:translate-y-px transition-all cursor-pointer shadow-sm"
              onClick={runAndClose(onLogout)}
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className={`inline-flex items-center gap-2 ${sidebarOpen ? 'inline-flex' : 'hidden md:inline-flex'}`}>
            <button className="inline-flex items-center justify-center gap-1.5 min-h-[34px] rounded-lg px-3.5 text-[12px] font-black border border-slate-200 bg-white text-blue-600 hover:bg-blue-50 active:translate-y-px transition-all" onClick={runAndClose(() => onOpenAuth('login'))}>Đăng nhập</button>
            <button className="inline-flex items-center justify-center gap-1.5 min-h-[34px] rounded-lg px-3.5 text-[12px] font-black border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 active:translate-y-px transition-all" onClick={runAndClose(() => onOpenAuth('register'))}>Đăng ký</button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
