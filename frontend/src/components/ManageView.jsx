import { useState } from 'react'
import './ManageView.css'

const ManageView = ({
  isLoadingUsers,
  isLoadingReports,
  isLoadingDeletedPosts,
  isLoadingDeletedComments,
  isLoadingAnalytics,
  onFetchUsers,
  onFetchReports,
  onFetchDeletedPosts,
  onFetchDeletedComments,
  deletedReasonFilter,
  onReasonChange,
  newUserData,
  onNewUserDataChange,
  onCreateUser,
  newVideoData,
  onVideoDataChange,
  onAddVideo,
  categories,
  managedUsers,
  currentUser,
  onRoleChange,
  onStatusChange,
  onDeleteUser,
  moderationReports,
  onDeleteModerationReport,
  onClearModerationReports,
  forumPosts,
  onAdminDeletePost,
  deletedPosts,
  onRestorePost,
  onPermanentDeletePost,
  deletedComments,
  onRestoreComment,
  onPermanentDeleteComment,
  analytics
}) => {
  const [activeSection, setActiveSection] = useState('overview')
  const formatCount = value => new Intl.NumberFormat('vi-VN').format(value || 0)
  const analyticsData = analytics || {}
  const last30Days = Array.isArray(analyticsData.viewsLast30Days)
    ? analyticsData.viewsLast30Days.map((item, index) => ({
        key: item.date || item.day || String(index),
        label: item.label || item.date || `Ngay ${index + 1}`,
        views: item.views || 0
      }))
    : []

  return (
    <div className="forum-view">
      <div className="admin-dashboard card-panel">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <span className="admin-logo">Kero Admin</span>
            <span className="admin-subtitle">Dashboard quan tri</span>
          </div>
          <nav className="admin-nav">
            {[
              { id: 'overview', label: 'Tong quan' },
              { id: 'users', label: 'Nguoi dung' },
              { id: 'moderation', label: 'Kiem duyet' },
              { id: 'content', label: 'Noi dung' },
              { id: 'reports', label: 'Bao cao' },
              { id: 'settings', label: 'Cai dat' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                className={`admin-nav__item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="admin-insight">
            <p className="admin-insight__title">Danh gia nhanh</p>
            <p className="admin-insight__text">
              {isLoadingAnalytics
                ? 'Dang tai thong ke bai hoc...'
                : `Luot xem bai hoc: ${formatCount(analyticsData.totalLessonViews)} · Nguoi xem: ${formatCount(analyticsData.uniqueLessonViewers)}`}
            </p>
          </div>
        </aside>

        <div className="admin-main">
          <header className="admin-topbar">
            <div className="admin-search">
              <input type="text" placeholder="Tim nhanh user hoac noi dung" />
            </div>
            <div className="admin-action-buttons">
              {`Tong so tai khoan: ${formatCount(managedUsers.length)}`}
            </div>
          </header>

          <section className="admin-content-grid">
            {activeSection === 'overview' && (
              <div className="admin-overview">
                <div className="admin-metric admin-metric--mint">
                  <span className="admin-metric__title">Tong tai khoan</span>
                  <h3>{formatCount(managedUsers.length)}</h3>
                  <span className="admin-metric__note">Cap nhat theo danh sach hien tai</span>
                </div>
                <div className="admin-metric admin-metric--peach">
                  <span className="admin-metric__title">Luot xem bai hoc</span>
                  <h3>{formatCount(analyticsData.totalLessonViews)}</h3>
                  <span className="admin-metric__note">Nguoi xem: {formatCount(analyticsData.uniqueLessonViewers)}</span>
                </div>
                <div className="admin-metric admin-metric--sky">
                  <span className="admin-metric__title">Bai viet can xu ly</span>
                  <h3>{formatCount(forumPosts.length)}</h3>
                  <span className="admin-metric__note">Danh sach bai viet moi</span>
                </div>
                <div className="admin-metric admin-metric--rose">
                  <span className="admin-metric__title">Report kiem duyet</span>
                  <h3>{formatCount(moderationReports.length)}</h3>
                  <span className="admin-metric__note">AI kiem duyet gan day</span>
                </div>
              </div>
            )}

            {activeSection === 'users' && (
              <div className="admin-card admin-card--span card-panel">
              <div className="admin-card__header">
                <h4>Quan ly nguoi dung</h4>
                <span>{formatCount(managedUsers.length)} tai khoan</span>
              </div>
              <div className="management-list">
                {managedUsers.length ? (
                  managedUsers.map(user => (
                    <div key={user.username} className="management-item">
                      <div>
                        <strong>{user.username}</strong>
                        <p>Vai tro hien tai: {user.role}</p>
                        <p>Trang thai: {user.status || 'active'}</p>
                        <p>So loi bi bat: {user.violationCount || 0}</p>
                      </div>

                      <div className="user-admin-actions">
                        <select
                          value={user.role}
                          onChange={e => onRoleChange(user.username, e.target.value)}
                          disabled={user.username === currentUser}
                        >
                          <option value="student">student</option>
                          <option value="teacher">teacher</option>
                          <option value="admin">admin</option>
                        </select>

                        <select
                          value={user.status || 'active'}
                          onChange={e => onStatusChange(user.username, e.target.value)}
                          disabled={user.username === currentUser}
                        >
                          <option value="active">active</option>
                          <option value="suspended">suspended</option>
                          <option value="banned">banned</option>
                        </select>

                        <button
                          className="btn-danger"
                          onClick={() => onDeleteUser(user.username)}
                          disabled={user.username === currentUser}
                        >
                          Xoa tai khoan
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="post-card empty-state">
                    <h4>Chua co du lieu user</h4>
                    <p>Dang nhap bang tai khoan admin de tai danh sach.</p>
                  </div>
                )}
              </div>
              <div className="management-actions">
                <button className="btn-ghost" onClick={onFetchUsers}>
                  {isLoadingUsers ? 'Dang tai...' : 'Tai lai danh sach'}
                </button>
              </div>
            </div>
            )}

            {activeSection === 'users' && (
              <div className="admin-card card-panel">
                <div className="admin-card__header">
                  <h4>Tao tai khoan moi</h4>
                  <span>Quick create</span>
                </div>
                <div className="video-admin-form">
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUserData.username}
                    onChange={e => onNewUserDataChange({ ...newUserData, username: e.target.value })}
                  />
                  <input
                    type="password"
                    placeholder="Mat khau"
                    value={newUserData.password}
                    onChange={e => onNewUserDataChange({ ...newUserData, password: e.target.value })}
                  />
                  <select
                    value={newUserData.role}
                    onChange={e => onNewUserDataChange({ ...newUserData, role: e.target.value })}
                  >
                    <option value="student">student</option>
                    <option value="teacher">teacher</option>
                    <option value="admin">admin</option>
                  </select>
                  <button className="btn-post" onClick={onCreateUser}>Tao tai khoan</button>
                </div>
                <p className="helper-text">
                  Tao tai khoan giao vien xong, vao tab "Giang vien" de them lop hoc, bai hoc va video.
                </p>
              </div>
            )}

            {activeSection === 'reports' && (
              <div className="admin-card card-panel">
                <div className="admin-card__header">
                  <h4>Luot truy cap bai hoc</h4>
                  <span>{formatCount(analyticsData.totalLessonViews)} luot</span>
                </div>
                <div className="admin-analytics">
                  <div className="admin-analytics__stat">
                    <p>Nguoi xem</p>
                    <strong>{formatCount(analyticsData.uniqueLessonViewers)}</strong>
                  </div>
                  <div className="admin-analytics__stat">
                    <p>Top bai hoc</p>
                    <strong>{formatCount(analyticsData.topLessons?.length || 0)}</strong>
                  </div>
                </div>
                <div className="admin-analytics__list">
                  {analyticsData.topLessons?.length ? (
                    analyticsData.topLessons.map(item => (
                      <div key={String(item.lessonId)} className="admin-analytics__item">
                        <div>
                          <p className="admin-analytics__lesson">{item.lessonTitle || 'Bai hoc chua xac dinh'}</p>
                          <p className="admin-analytics__course">{item.courseTitle || 'Chua gan lop hoc'}</p>
                        </div>
                        <span>{formatCount(item.views)} luot</span>
                      </div>
                    ))
                  ) : (
                    <p className="helper-text">Chua co du lieu luot xem bai hoc.</p>
                  )}
                </div>
                <div className="admin-analytics__timeline">
                  <div className="admin-analytics__timeline-header">
                    <span>30 ngay gan nhat</span>
                    <strong>{formatCount(analyticsData.totalLast30Days)} luot</strong>
                  </div>
                  <div className="admin-analytics__timeline-grid">
                    {last30Days.length ? (
                      last30Days.map(day => (
                        <div key={day.key} className="admin-analytics__timeline-item">
                          <span>{day.label}</span>
                          <strong>{formatCount(day.views)}</strong>
                        </div>
                      ))
                    ) : (
                      <div className="admin-analytics__timeline-item">
                        <span>Chua co du lieu</span>
                        <strong>0</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'content' && (
              <div className="admin-card card-panel">
                <div className="admin-card__header">
                  <h4>Them video YouTube</h4>
                  <span>Quan tri noi dung</span>
                </div>
                <div className="video-admin-form">
                  <select
                    value={newVideoData.category}
                    onChange={e => onVideoDataChange({ ...newVideoData, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Dan link YouTube (watch, youtu.be, hoac embed)"
                    value={newVideoData.url}
                    onChange={e => onVideoDataChange({ ...newVideoData, url: e.target.value })}
                  />
                  <button className="btn-post" onClick={onAddVideo}>Them video</button>
                </div>
              </div>
            )}

            {activeSection === 'content' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Bai viet can kiem duyet nhanh</h4>
                  <span>{formatCount(forumPosts.length)} bai</span>
                </div>
                {forumPosts.length ? (
                  <div className="report-list">
                    {forumPosts.map(post => (
                      <div key={post.id} className="report-item">
                        <p>
                          <strong>{post.title}</strong> · {post.author} · {post.category}
                        </p>
                        <p>{post.content}</p>
                        <button className="btn-danger" onClick={() => onAdminDeletePost(post)}>
                          Xoa bai viet nay
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Khong co bai viet nao de xoa.</p>
                )}
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="admin-card card-panel">
                <div className="admin-card__header">
                  <h4>Loc noi dung bi an</h4>
                  <span>Bo loc kiem duyet</span>
                </div>
                <div className="management-actions">
                  <select value={deletedReasonFilter} onChange={e => onReasonChange(e.target.value)}>
                    <option value="all">Tat ca</option>
                    <option value="ai_moderation">AI kiem duyet</option>
                    <option value="manual">Thu cong</option>
                  </select>
                  <button className="btn-ghost" onClick={onFetchDeletedPosts}>
                    {isLoadingDeletedPosts ? 'Dang tai bai viet...' : 'Tai bai viet da an'}
                  </button>
                  <button className="btn-ghost" onClick={onFetchDeletedComments}>
                    {isLoadingDeletedComments ? 'Dang tai binh luan...' : 'Tai binh luan da an'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Bai viet da bi an (soft-delete)</h4>
                  <span>{formatCount(deletedPosts.length)} bai</span>
                </div>
                {deletedPosts.length ? (
                  <div className="report-list">
                    {deletedPosts.map(post => (
                      <div key={post._id} className="report-item">
                        <p>
                          <strong>{post.title}</strong> · {post.author} · {post.category}
                        </p>
                        <p>Noi dung: {post.content}</p>
                        <p>Ly do an: {post.deletionReason || 'Khong ro'}</p>
                        <p>An boi: {post.deletedBy || 'Khong ro'} · Luc: {post.deletedAt ? new Date(post.deletedAt).toLocaleString('vi-VN') : 'Khong ro'}</p>
                        <div className="management-actions">
                          <button className="btn-post" onClick={() => onRestorePost(post._id)}>
                            Khoi phuc bai viet
                          </button>
                          <button className="btn-danger" onClick={() => onPermanentDeletePost(post._id)}>
                            Xoa vinh vien
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Chua co bai nao bi an.</p>
                )}
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Binh luan da bi an (soft-delete)</h4>
                  <span>{formatCount(deletedComments.length)} binh luan</span>
                </div>
                {deletedComments.length ? (
                  <div className="report-list">
                    {deletedComments.map(comment => (
                      <div key={comment._id} className="report-item">
                        <p>
                          <strong>{comment.author}</strong> · Post: {String(comment.postId)}
                        </p>
                        <p>Noi dung: {comment.text}</p>
                        <p>Ly do an: {comment.deletionReason || 'Khong ro'}</p>
                        <p>An boi: {comment.deletedBy || 'Khong ro'} · Luc: {comment.deletedAt ? new Date(comment.deletedAt).toLocaleString('vi-VN') : 'Khong ro'}</p>
                        <div className="management-actions">
                          <button className="btn-post" onClick={() => onRestoreComment(comment._id)}>
                            Khoi phuc binh luan
                          </button>
                          <button className="btn-danger" onClick={() => onPermanentDeleteComment(comment._id)}>
                            Xoa vinh vien
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Chua co binh luan nao bi an.</p>
                )}
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Lich su kiem duyet AI</h4>
                  <span>{formatCount(moderationReports.length)} report</span>
                </div>
                {moderationReports.length ? (
                  <div className="report-list">
                    {moderationReports.map(report => (
                      <div key={report._id} className="report-item">
                        <p>
                          <strong>{report.targetAuthor}</strong> · {report.targetType} · {report.createdAt ? new Date(report.createdAt).toLocaleString('vi-VN') : ''}
                        </p>
                        <p>Noi dung: {report.content}</p>
                        <p>Ly do: {report.reason || 'Khong ro'}</p>
                        <button className="btn-ghost" onClick={() => onDeleteModerationReport(report._id)}>
                          Xoa report
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Chua co report nao.</p>
                )}
                <div className="management-actions">
                  <button className="btn-ghost" onClick={onFetchReports}>
                    {isLoadingReports ? 'Dang tai...' : 'Tai report'}
                  </button>
                  <button className="btn-danger" onClick={onClearModerationReports}>
                    Xoa tat ca report
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Cai dat</h4>
                  <span>He thong</span>
                </div>
                <p className="helper-text">Chua co tuy chinh nao trong muc nay.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default ManageView
