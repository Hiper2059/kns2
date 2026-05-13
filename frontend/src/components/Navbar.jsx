import './Navbar.css'

const Navbar = ({
  activeTab,
  onTabChange,
  currentRole,
  currentUser,
  currentRank,
  currentUserPoints,
  onLogout,
  onOpenAuth,
  onBrandClick,
  onForumClick
}) => (
  <header className="navbar">
    <div
      className="logo-zone clickable-brand"
      onClick={onBrandClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onBrandClick()}
    >
      <h1 className="logo">Z-Mate Hub</h1>
      <p className="tagline">Kỹ năng sống cho thế hệ trẻ</p>
    </div>

    <nav className="nav-links">
      <button className={activeTab === 'home' ? 'active' : ''} onClick={() => onTabChange('home')}>
        Trang chủ
      </button>
      <button className={activeTab === 'forum' ? 'active' : ''} onClick={onForumClick}>
        Diễn đàn
      </button>
      <button className={activeTab === 'lms' ? 'active' : ''} onClick={() => onTabChange('lms')}>
        Lớp học
      </button>
      {(currentRole === 'teacher' || currentRole === 'admin') && (
        <button className={activeTab === 'teacher' ? 'active' : ''} onClick={() => onTabChange('teacher')}>
          Giảng viên
        </button>
      )}
      {currentRole === 'admin' && (
        <button className={activeTab === 'manage' ? 'active' : ''} onClick={() => onTabChange('manage')}>
          Quản lý user
        </button>
      )}
    </nav>

    <div className="auth-buttons">
      {currentUser ? (
        <>
          <span className="user-name">Chào, {currentUser}</span>
          <span className="rank-pill">
            {currentRank.name} · {currentUserPoints} điểm
          </span>
          <button className="btn-login" onClick={onLogout}>
            Đăng xuất
          </button>
        </>
      ) : (
        <>
          <button className="btn-login" onClick={() => onOpenAuth('login')}>
            Đăng nhập
          </button>
          <button className="btn-register" onClick={() => onOpenAuth('register')}>
            Đăng ký
          </button>
        </>
      )}
    </div>
  </header>
)

export default Navbar
