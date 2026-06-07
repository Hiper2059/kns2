import { useState } from 'react'
import { getApiErrorMessage } from '../utils/apiMessages'
import './ManageView.css'

const ManageView = ({
  isLoadingUsers,
  isLoadingReports,
  isLoadingDeletedPosts,
  isLoadingDeletedComments,
  isLoadingAnalytics,
  isLoadingForumComments,
  courses,
  selectedCourse,
  onSelectCourse,
  courseLessons,
  onOpenLesson,
  onDeleteLesson,
  onFetchUsers,
  onFetchReports,
  onFetchDeletedPosts,
  onFetchDeletedComments,
  onFetchForumComments,
  deletedReasonFilter,
  onReasonChange,
  newUserData,
  onNewUserDataChange,
  onCreateUser,
  managedUsers,
  currentUser,
  onRoleChange,
  onStatusChange,
  onDeleteUser,
  moderationReports,
  onDeleteModerationReport,
  onClearModerationReports,
  forumPosts,
  forumComments = [],
  onAdminDeletePost,
  onPunishForumComment,
  deletedPosts,
  onRestorePost,
  onPermanentDeletePost,
  deletedComments,
  onRestoreComment,
  onPermanentDeleteComment,
  analytics,
  adminUploadUrl,
  isAdminUploadLoading,
  onAdminUploadVideo,
  onClearAdminUploadUrl,
  onOpenProfile,
  api
}) => {
  const [activeSection, setActiveSection] = useState('overview')
  const [lessonCommentsById, setLessonCommentsById] = useState({})
  const [expandedLessonId, setExpandedLessonId] = useState('')
  const [loadingLessonCommentsId, setLoadingLessonCommentsId] = useState('')
  const formatCount = value => new Intl.NumberFormat('vi-VN').format(value || 0)
  const analyticsData = analytics || {}

  const navItems = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'users', label: 'Người dùng' },
    { id: 'lessons', label: 'Lớp & bài học' },
    { id: 'comments', label: 'Bình luận' },
    { id: 'moderation', label: 'Kiểm duyệt' },
    { id: 'reports', label: 'Báo cáo' },
    { id: 'content', label: 'Nội dung' }
  ]

  const getReportTargetLabel = targetType => {
    if (targetType === 'post') return 'Bài viết'
    if (targetType === 'comment') return 'Bình luận diễn đàn'
    if (targetType === 'lesson_comment') return 'Bình luận bài học'
    return targetType || 'Không rõ'
  }

  const handleCopyUploadUrl = async () => {
    if (!adminUploadUrl) return
    try {
      await navigator.clipboard.writeText(adminUploadUrl)
      alert('Đã sao chép link video.')
    } catch {
      alert('Không sao chép được link video.')
    }
  }

  const handleOpenLessonComments = async lessonId => {
    if (!lessonId || !api) return
    if (expandedLessonId === lessonId) {
      setExpandedLessonId('')
      return
    }

    setExpandedLessonId(lessonId)
    if (lessonCommentsById[lessonId]) return

    setLoadingLessonCommentsId(lessonId)
    try {
      const response = await api.get(`/api/lessons/${lessonId}/comments`)
      setLessonCommentsById(prev => ({ ...prev, [lessonId]: response.data.comments || [] }))
    } catch (error) {
      alert(getApiErrorMessage(error, 'Không tải được bình luận bài học.'))
    } finally {
      setLoadingLessonCommentsId('')
    }
  }

  const handleDeleteLessonComment = async lessonCommentId => {
    if (!lessonCommentId || !api) return
    if (!window.confirm('Xóa bình luận bài học này?')) return

    try {
      await api.delete(`/api/comments/${lessonCommentId}`)
      setLessonCommentsById(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(lessonId => {
          next[lessonId] = (next[lessonId] || []).filter(comment => String(comment._id) !== String(lessonCommentId))
        })
        return next
      })
    } catch (error) {
      alert(getApiErrorMessage(error, 'Không xóa được bình luận.'))
    }
  }

  const renderCommentScope = comment => {
    if (comment.postScope === 'course') {
      return comment.courseTitle ? `Diễn đàn lớp: ${comment.courseTitle}` : 'Diễn đàn lớp'
    }
    return 'Diễn đàn chung'
  }

  return (
    <div className="forum-view">
      <div className="admin-dashboard card-panel">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <span className="admin-logo">Admin</span>
            <span className="admin-subtitle">Bảng quản trị</span>
          </div>
          <nav className="admin-nav">
            {navItems.map(item => (
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
            <p className="admin-insight__title">Đánh giá nhanh</p>
            <p className="admin-insight__text">
              {isLoadingAnalytics
                ? 'Đang tải thống kê...'
                : `Lượt xem bài học: ${formatCount(analyticsData.totalLessonViews)} · Người xem: ${formatCount(analyticsData.uniqueLessonViewers)}`}
            </p>
          </div>
        </aside>

        <div className="admin-main">
          <header className="admin-topbar">
            <div className="admin-search">
              <input type="text" placeholder="Tìm nhanh người dùng hoặc nội dung" />
            </div>
            <div className="admin-action-buttons">
              {`Tổng số tài khoản: ${formatCount(managedUsers.length)}`}
            </div>
          </header>

          <section className="admin-content-grid">
            {activeSection === 'overview' && (
              <div className="admin-overview">
                <div className="admin-metric admin-metric--mint">
                  <span className="admin-metric__title">Tổng tài khoản</span>
                  <h3>{formatCount(managedUsers.length)}</h3>
                  <span className="admin-metric__note">Theo danh sách hiện tại</span>
                </div>
                <div className="admin-metric admin-metric--peach">
                  <span className="admin-metric__title">Lượt xem bài học</span>
                  <h3>{formatCount(analyticsData.totalLessonViews)}</h3>
                  <span className="admin-metric__note">Người xem: {formatCount(analyticsData.uniqueLessonViewers)}</span>
                </div>
                <div className="admin-metric admin-metric--sky">
                  <span className="admin-metric__title">Tổng lớp học</span>
                  <h3>{formatCount(courses.length)}</h3>
                  <span className="admin-metric__note">Admin có thể xem tất cả lớp</span>
                </div>
                <div className="admin-metric admin-metric--rose">
                  <span className="admin-metric__title">Bình luận diễn đàn</span>
                  <h3>{formatCount(forumComments.length)}</h3>
                  <span className="admin-metric__note">Có thể xóa và phạt tài khoản</span>
                </div>
              </div>
            )}

            {activeSection === 'users' && (
              <>
                <div className="admin-card admin-card--span card-panel">
                  <div className="admin-card__header">
                    <h4>Quản lý người dùng</h4>
                    <span>{formatCount(managedUsers.length)} tài khoản</span>
                  </div>
                  <div className="management-list">
                    {managedUsers.length ? managedUsers.map(user => (
                      <div key={user.username} className="management-item">
                        <div>
                          <strong>{user.username}</strong>
                          <p>Vai trò: {user.role}</p>
                          <p>Trạng thái: {user.status || 'active'}</p>
                          <p>Số vi phạm: {user.violationCount || 0}</p>
                        </div>
                        <div className="user-admin-actions">
                          <select
                            value={user.role}
                            onChange={event => onRoleChange(user.username, event.target.value)}
                            disabled={user.username === currentUser || user.role === 'teacher'}
                          >
                            <option value="student">student</option>
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                            {user.role === 'teacher' && <option value="teacher">teacher</option>}
                          </select>
                          <select
                            value={user.status || 'active'}
                            onChange={event => onStatusChange(user.username, event.target.value)}
                            disabled={user.username === currentUser}
                          >
                            <option value="active">active</option>
                            <option value="suspended">suspended</option>
                            <option value="banned">banned</option>
                          </select>
                          <button className="btn-danger" onClick={() => onDeleteUser(user.username)} disabled={user.username === currentUser}>
                            Xóa tài khoản
                          </button>
                        </div>
                      </div>
                    )) : <p>Chưa có dữ liệu người dùng.</p>}
                  </div>
                  <div className="management-actions">
                    <button className="btn-ghost" onClick={onFetchUsers}>
                      {isLoadingUsers ? 'Đang tải...' : 'Tải lại danh sách'}
                    </button>
                  </div>
                </div>

                <div className="admin-card card-panel">
                  <div className="admin-card__header">
                    <h4>Tạo tài khoản mới</h4>
                    <span>Không tạo giảng viên tại đây</span>
                  </div>
                  <div className="video-admin-form">
                    <input type="text" placeholder="Username" value={newUserData.username} onChange={event => onNewUserDataChange({ ...newUserData, username: event.target.value })} />
                    <input type="text" placeholder="Tên hiển thị" value={newUserData.displayName} onChange={event => onNewUserDataChange({ ...newUserData, displayName: event.target.value })} />
                    <input type="password" placeholder="Mật khẩu" value={newUserData.password} onChange={event => onNewUserDataChange({ ...newUserData, password: event.target.value })} />
                    <select value={newUserData.role} onChange={event => onNewUserDataChange({ ...newUserData, role: event.target.value })}>
                      <option value="student">student</option>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <button className="btn-post" onClick={onCreateUser}>Tạo tài khoản</button>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'lessons' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Tất cả lớp học và bài học</h4>
                  <span>{formatCount(courses.length)} lớp</span>
                </div>
                <div className="management-actions">
                  <select
                    value={selectedCourse?._id || ''}
                    onChange={event => {
                      const nextCourse = courses.find(course => String(course._id) === String(event.target.value)) || null
                      onSelectCourse?.(nextCourse)
                    }}
                  >
                    <option value="">Chọn lớp học</option>
                    {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
                  </select>
                </div>
                {selectedCourse ? (
                  <div className="report-list">
                    <div className="report-item">
                      <p><strong>{selectedCourse.title}</strong> · {selectedCourse.category}</p>
                      <p>{selectedCourse.description || 'Chưa có mô tả lớp học.'}</p>
                    </div>
                    {courseLessons.length ? courseLessons.map(lesson => (
                      <div key={lesson._id} className="report-item">
                        <p><strong>{lesson.order}. {lesson.title}</strong></p>
                        <p>{lesson.content ? 'Có nội dung bài học.' : 'Chưa có nội dung.'}</p>
                        <div className="management-actions">
                          <button className="btn-post" onClick={() => onOpenLesson?.(lesson)}>Vào bài học</button>
                          <button className="btn-ghost" onClick={() => handleOpenLessonComments(lesson._id)}>
                            {expandedLessonId === lesson._id ? 'Ẩn bình luận' : 'Xem bình luận'}
                          </button>
                          <button className="btn-danger" onClick={() => onDeleteLesson?.(lesson._id)}>Xóa bài học</button>
                        </div>
                        {expandedLessonId === lesson._id && (
                          <div className="admin-lesson-comments">
                            {loadingLessonCommentsId === lesson._id ? <p>Đang tải bình luận...</p> : (lessonCommentsById[lesson._id] || []).length ? (
                              (lessonCommentsById[lesson._id] || []).map(comment => (
                                <div key={comment._id} className="report-item admin-lesson-comment-item">
                                  <p>
                                    <button type="button" className="link-button" onClick={() => onOpenProfile?.(comment.author || comment.authorName)}>
                                      {comment.authorName || 'Khách'}
                                    </button>
                                    {' '}· {new Date(comment.createdAt).toLocaleString('vi-VN')}
                                  </p>
                                  <p>{comment.content}</p>
                                  <button className="btn-danger" onClick={() => handleDeleteLessonComment(comment._id)}>Xóa bình luận</button>
                                </div>
                              ))
                            ) : <p>Chưa có bình luận trong bài học này.</p>}
                          </div>
                        )}
                      </div>
                    )) : <p>Chưa có bài học nào trong lớp này.</p>}
                  </div>
                ) : <p>Chọn một lớp để xem và quản lý bài học.</p>}
              </div>
            )}

            {activeSection === 'comments' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Quản lý bình luận diễn đàn</h4>
                  <span>{formatCount(forumComments.length)} bình luận</span>
                </div>
                <div className="management-actions">
                  <button className="btn-ghost" onClick={onFetchForumComments}>
                    {isLoadingForumComments ? 'Đang tải...' : 'Tải bình luận mới nhất'}
                  </button>
                </div>
                <div className="report-list">
                  {forumComments.length ? forumComments.map(comment => (
                    <div key={comment._id} className="report-item">
                      <p>
                        <button type="button" className="link-button" onClick={() => onOpenProfile?.(comment.author)}>
                          {comment.author}
                        </button>
                        {' '}· {renderCommentScope(comment)} · {comment.createdAt ? new Date(comment.createdAt).toLocaleString('vi-VN') : ''}
                      </p>
                      <p>Bài viết: {comment.postTitle || String(comment.postId)}</p>
                      <p>{comment.text}</p>
                      <div className="management-actions">
                        <button className="btn-danger" onClick={() => onPunishForumComment?.(comment, 'warn')}>Xóa + ghi vi phạm</button>
                        <button className="btn-danger" onClick={() => onPunishForumComment?.(comment, 'suspend')}>Xóa + tạm khóa</button>
                        <button className="btn-danger" onClick={() => onPunishForumComment?.(comment, 'ban')}>Xóa + ban</button>
                      </div>
                    </div>
                  )) : <p>Chưa có bình luận diễn đàn nào.</p>}
                </div>
              </div>
            )}

            {activeSection === 'moderation' && (
              <>
                <div className="admin-card card-panel">
                  <div className="admin-card__header">
                    <h4>Nội dung đã ẩn</h4>
                    <span>Bộ lọc kiểm duyệt</span>
                  </div>
                  <div className="management-actions">
                    <select value={deletedReasonFilter} onChange={event => onReasonChange(event.target.value)}>
                      <option value="all">Tất cả</option>
                      <option value="ai_moderation">AI kiểm duyệt</option>
                      <option value="manual_delete">Thủ công</option>
                      <option value="admin_warn">Admin phạt</option>
                    </select>
                    <button className="btn-ghost" onClick={onFetchDeletedPosts}>{isLoadingDeletedPosts ? 'Đang tải bài...' : 'Tải bài đã ẩn'}</button>
                    <button className="btn-ghost" onClick={onFetchDeletedComments}>{isLoadingDeletedComments ? 'Đang tải bình luận...' : 'Tải bình luận đã ẩn'}</button>
                  </div>
                </div>

                <div className="admin-card admin-card--span card-panel">
                  <div className="admin-card__header">
                    <h4>Bài viết đã ẩn</h4>
                    <span>{formatCount(deletedPosts.length)} bài</span>
                  </div>
                  <div className="report-list">
                    {deletedPosts.length ? deletedPosts.map(post => (
                      <div key={post._id} className="report-item">
                        <p><strong>{post.title}</strong> · {post.author} · {post.category}</p>
                        <p>{post.content}</p>
                        <p>Lý do: {post.deletionReason || 'Không rõ'}</p>
                        <div className="management-actions">
                          <button className="btn-post" onClick={() => onRestorePost(post._id)}>Khôi phục</button>
                          <button className="btn-danger" onClick={() => onPermanentDeletePost(post._id)}>Xóa vĩnh viễn</button>
                        </div>
                      </div>
                    )) : <p>Chưa có bài viết bị ẩn.</p>}
                  </div>
                </div>

                <div className="admin-card admin-card--span card-panel">
                  <div className="admin-card__header">
                    <h4>Bình luận đã ẩn</h4>
                    <span>{formatCount(deletedComments.length)} bình luận</span>
                  </div>
                  <div className="report-list">
                    {deletedComments.length ? deletedComments.map(comment => (
                      <div key={comment._id} className="report-item">
                        <p><strong>{comment.author}</strong> · Post: {String(comment.postId)}</p>
                        <p>{comment.text}</p>
                        <p>Lý do: {comment.deletionReason || 'Không rõ'}</p>
                        <div className="management-actions">
                          <button className="btn-post" onClick={() => onRestoreComment(comment._id)}>Khôi phục</button>
                          <button className="btn-danger" onClick={() => onPermanentDeleteComment(comment._id)}>Xóa vĩnh viễn</button>
                        </div>
                      </div>
                    )) : <p>Chưa có bình luận bị ẩn.</p>}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'reports' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Lịch sử kiểm duyệt AI</h4>
                  <span>{formatCount(moderationReports.length)} report</span>
                </div>
                <div className="report-list">
                  {moderationReports.length ? moderationReports.map(report => (
                    <div key={report._id} className="report-item">
                      <p>
                        <button type="button" className="link-button" onClick={() => onOpenProfile?.(report.targetAuthor)}>
                          {report.targetAuthor || 'Không rõ người đăng'}
                        </button>
                        {' '}· {getReportTargetLabel(report.targetType)}
                      </p>
                      <p>Nội dung: {report.content}</p>
                      <p>Lý do: {report.reason || 'Không rõ'}</p>
                      <button className="btn-ghost" onClick={() => onDeleteModerationReport(report._id)}>Xóa report</button>
                    </div>
                  )) : <p>Chưa có report nào.</p>}
                </div>
                <div className="management-actions">
                  <button className="btn-ghost" onClick={onFetchReports}>{isLoadingReports ? 'Đang tải...' : 'Tải report'}</button>
                  <button className="btn-danger" onClick={onClearModerationReports}>Xóa tất cả report</button>
                </div>
              </div>
            )}

            {activeSection === 'content' && (
              <>
                <div className="admin-card card-panel">
                  <div className="admin-card__header">
                    <h4>Upload video</h4>
                    <span>Cloudinary</span>
                  </div>
                  <div className="video-admin-form">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={event => {
                        const file = event.target.files?.[0]
                        if (file) onAdminUploadVideo?.(file)
                        event.target.value = ''
                      }}
                    />
                    <button className="btn-post" onClick={handleCopyUploadUrl} disabled={!adminUploadUrl}>
                      {adminUploadUrl ? 'Sao chép link' : 'Chưa có link'}
                    </button>
                    {adminUploadUrl && <button className="btn-ghost" onClick={onClearAdminUploadUrl}>Xóa link</button>}
                  </div>
                  {isAdminUploadLoading && <p className="helper-text">Đang upload video...</p>}
                  {adminUploadUrl && <a className="admin-upload-link" href={adminUploadUrl} target="_blank" rel="noreferrer">{adminUploadUrl}</a>}
                </div>

                <div className="admin-card admin-card--span card-panel">
                  <div className="admin-card__header">
                    <h4>Bài viết diễn đàn</h4>
                    <span>{formatCount(forumPosts.length)} bài</span>
                  </div>
                  <div className="report-list">
                    {forumPosts.length ? forumPosts.map(post => (
                      <div key={post.id} className="report-item">
                        <p><strong>{post.title}</strong> · {post.author} · {post.category}</p>
                        <p>{post.content}</p>
                        <button className="btn-danger" onClick={() => onAdminDeletePost(post)}>Xóa bài viết</button>
                      </div>
                    )) : <p>Không có bài viết nào.</p>}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default ManageView
