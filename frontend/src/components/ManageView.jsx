import { useState } from 'react'
import './ManageView.css'

const ManageView = ({
  isLoadingUsers,
  isLoadingReports,
  isLoadingDeletedPosts,
  isLoadingDeletedComments,
  isLoadingAnalytics,
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
  const getReportTargetLabel = targetType => {
    if (targetType === 'post') return 'Bài viết'
    if (targetType === 'comment') return 'Bình luận diễn đàn'
    if (targetType === 'lesson_comment') return 'Bình luận bài học'
    return targetType || 'Không rõ'
  }
  const analyticsData = analytics || {}
  const last30Days = Array.isArray(analyticsData.viewsLast30Days)
    ? analyticsData.viewsLast30Days.map((item, index) => ({
        key: item.date || item.day || String(index),
        label: item.label || item.date || `Ngày ${index + 1}`,
        views: item.views || 0
      }))
    : []

  const handleCopyUploadUrl = async () => {
    if (!adminUploadUrl) {
      return
    }
    try {
      await navigator.clipboard.writeText(adminUploadUrl)
      alert('Đã sao chép link video.')
    } catch {
      alert('Không sao chép được link video.')
    }
  }

  const handleOpenLessonComments = async lessonId => {
    if (!lessonId || !api) {
      return
    }

    if (expandedLessonId === lessonId) {
      setExpandedLessonId('')
      return
    }

    setExpandedLessonId(lessonId)
    if (lessonCommentsById[lessonId]) {
      return
    }

    setLoadingLessonCommentsId(lessonId)
    try {
      const response = await api.get(`/api/lessons/${lessonId}/comments`)
      setLessonCommentsById(prev => ({
        ...prev,
        [lessonId]: response.data.comments || []
      }))
    } catch (error) {
      alert(error.response?.data?.message || 'Không tải được bình luận bài học.')
    } finally {
      setLoadingLessonCommentsId('')
    }
  }

  const handleDeleteLessonComment = async lessonCommentId => {
    if (!lessonCommentId || !api) {
      return
    }

    if (!window.confirm('Xóa bình luận bài học này?')) {
      return
    }

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
      alert(error.response?.data?.message || 'Không xóa được bình luận.')
    }
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
            {[
              { id: 'overview', label: 'Tổng quan' },
              { id: 'users', label: 'Người dùng' },
              { id: 'lessons', label: 'Bài học' },
              { id: 'moderation', label: 'Kiểm duyệt' },
              { id: 'content', label: 'Nội dung' },
              { id: 'reports', label: 'Báo cáo' },
              { id: 'settings', label: 'Cài đặt' }
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
            <p className="admin-insight__title">Đánh giá nhanh</p>
            <p className="admin-insight__text">
              {isLoadingAnalytics
                ? 'Đang tải thống kê bài học...'
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
                  <span className="admin-metric__note">Cập nhật theo danh sách hiện tại</span>
                </div>
                <div className="admin-metric admin-metric--peach">
                  <span className="admin-metric__title">Lượt xem bài học</span>
                  <h3>{formatCount(analyticsData.totalLessonViews)}</h3>
                  <span className="admin-metric__note">Người xem: {formatCount(analyticsData.uniqueLessonViewers)}</span>
                </div>
                <div className="admin-metric admin-metric--sky">
                  <span className="admin-metric__title">Bài viết cần xử lý</span>
                  <h3>{formatCount(forumPosts.length)}</h3>
                  <span className="admin-metric__note">Danh sách bài viết mới</span>
                </div>
                <div className="admin-metric admin-metric--rose">
                  <span className="admin-metric__title">Báo cáo kiểm duyệt</span>
                  <h3>{formatCount(moderationReports.length)}</h3>
                  <span className="admin-metric__note">AI kiểm duyệt gần đây</span>
                </div>
              </div>
            )}

            {activeSection === 'users' && (
              <div className="admin-card admin-card--span card-panel">
              <div className="admin-card__header">
                <h4>Quản lý người dùng</h4>
                <span>{formatCount(managedUsers.length)} tài khoản</span>
              </div>
              <div className="management-list">
                {managedUsers.length ? (
                  managedUsers.map(user => (
                    <div key={user.username} className="management-item">
                      <div>
                        <strong>{user.username}</strong>
                        <p>Vai trò hiện tại: {user.role}</p>
                        <p>Trạng thái: {user.status || 'active'}</p>
                        <p>Số vi phạm: {user.violationCount || 0}</p>
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
                          Xóa tài khoản
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="post-card empty-state">
                    <h4>Chưa có dữ liệu người dùng</h4>
                    <p>Đăng nhập bằng tài khoản admin để tải danh sách.</p>
                  </div>
                )}
              </div>
              <div className="management-actions">
                <button className="btn-ghost" onClick={onFetchUsers}>
                  {isLoadingUsers ? 'Đang tải...' : 'Tải lại danh sách'}
                </button>
              </div>
            </div>
            )}

            {activeSection === 'users' && (
              <div className="admin-card card-panel">
                <div className="admin-card__header">
                  <h4>Tạo tài khoản mới</h4>
                  <span>Tạo nhanh</span>
                </div>
                <div className="video-admin-form">
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUserData.username}
                    onChange={e => onNewUserDataChange({ ...newUserData, username: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Tên hiển thị"
                    value={newUserData.displayName}
                    onChange={e => onNewUserDataChange({ ...newUserData, displayName: e.target.value })}
                  />
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={newUserData.password}
                    onChange={e => onNewUserDataChange({ ...newUserData, password: e.target.value })}
                  />
                  <select
                    value={newUserData.role}
                    onChange={e => onNewUserDataChange({ ...newUserData, role: e.target.value })}
                  >
                    <option value="teacher">teacher</option>
                    <option value="admin">admin</option>
                  </select>
                  <button className="btn-post" onClick={onCreateUser}>Tạo tài khoản</button>
                </div>
                <p className="helper-text">
                  Tạo xong tài khoản giảng viên hoặc admin là có thể phân quyền và mở đúng khu vực quản trị.
                </p>
              </div>
            )}

            {activeSection === 'reports' && (
              <div className="admin-card card-panel">
                <div className="admin-card__header">
                  <h4>Lượt truy cập bài học</h4>
                  <span>{formatCount(analyticsData.totalLessonViews)} lượt</span>
                </div>
                <div className="admin-analytics">
                  <div className="admin-analytics__stat">
                    <p>Người xem</p>
                    <strong>{formatCount(analyticsData.uniqueLessonViewers)}</strong>
                  </div>
                  <div className="admin-analytics__stat">
                    <p>Top bài học</p>
                    <strong>{formatCount(analyticsData.topLessons?.length || 0)}</strong>
                  </div>
                </div>
                <div className="admin-analytics__list">
                  {analyticsData.topLessons?.length ? (
                    analyticsData.topLessons.map(item => (
                      <div key={String(item.lessonId)} className="admin-analytics__item">
                        <div>
                          <p className="admin-analytics__lesson">{item.lessonTitle || 'Bài học chưa xác định'}</p>
                          <p className="admin-analytics__course">{item.courseTitle || 'Chưa gắn lớp học'}</p>
                        </div>
                        <span>{formatCount(item.views)} lượt</span>
                      </div>
                    ))
                  ) : (
                    <p className="helper-text">Chưa có dữ liệu lượt xem bài học.</p>
                  )}
                </div>
                <div className="admin-analytics__timeline">
                  <div className="admin-analytics__timeline-header">
                    <span>30 ngày gần nhất</span>
                    <strong>{formatCount(analyticsData.totalLast30Days)} lượt</strong>
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
                        <span>Chưa có dữ liệu</span>
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
                  <h4>Upload video (Cloudinary)</h4>
                  <span>Quản trị nội dung</span>
                </div>
                <div className="video-admin-form">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        onAdminUploadVideo?.(file)
                      }
                      e.target.value = ''
                    }}
                  />
                  <button
                    className="btn-post"
                    onClick={handleCopyUploadUrl}
                    disabled={!adminUploadUrl}
                  >
                    {adminUploadUrl ? 'Sao chép link' : 'Chưa có link'}
                  </button>
                  {adminUploadUrl && (
                    <button className="btn-ghost" onClick={onClearAdminUploadUrl}>
                      Xóa link
                    </button>
                  )}
                </div>
                {isAdminUploadLoading && <p className="helper-text">Đang upload video...</p>}
                {adminUploadUrl && (
                  <div className="admin-upload-result">
                    <span>Link video:</span>
                    <a className="admin-upload-link" href={adminUploadUrl} target="_blank" rel="noreferrer">
                      {adminUploadUrl}
                    </a>
                  </div>
                )}
              </div>
            )}


            {activeSection === 'content' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Bài viết cần kiểm duyệt nhanh</h4>
                  <span>{formatCount(forumPosts.length)} bài</span>
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
                          Xóa bài viết này
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Không có bài viết nào để xóa.</p>
                )}
              </div>
            )}

            {activeSection === 'lessons' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Quản lý bài học</h4>
                  <span>{formatCount(courses.length)} lớp</span>
                </div>
                <div className="management-actions">
                  <select
                    value={selectedCourse?._id || ''}
                    onChange={e => {
                      const selected = courses.find(course => String(course._id) === String(e.target.value)) || null
                      onSelectCourse?.(selected)
                    }}
                  >
                    <option value="">Chọn lớp học</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCourse ? (
                  <div className="report-list">
                    <div className="report-item">
                      <p>
                        <strong>{selectedCourse.title}</strong> · {selectedCourse.category}
                      </p>
                      <p>{selectedCourse.description || 'Chưa có mô tả lớp học.'}</p>
                    </div>

                    {courseLessons.length ? (
                      courseLessons.map(lesson => (
                        <div key={lesson._id} className="report-item">
                          <p>
                            <strong>{lesson.order}. {lesson.title}</strong>
                          </p>
                          <p>{lesson.slug || lesson._id}</p>
                          <p>{lesson.content ? 'Có nội dung bài học.' : 'Chưa có nội dung.'}</p>
                          <div className="management-actions">
                            <button className="btn-post" onClick={() => onOpenLesson?.(lesson)}>
                              Xem bài học
                            </button>
                            <button className="btn-ghost" onClick={() => handleOpenLessonComments(lesson._id)}>
                              {expandedLessonId === lesson._id ? 'Ẩn bình luận' : 'Xem bình luận'}
                            </button>
                            <button className="btn-danger" onClick={() => onDeleteLesson?.(lesson._id)}>
                              Xóa bài học
                            </button>
                          </div>

                          {expandedLessonId === lesson._id && (
                            <div className="admin-lesson-comments">
                              {loadingLessonCommentsId === lesson._id ? (
                                <p>Đang tải bình luận bài học...</p>
                              ) : (lessonCommentsById[lesson._id] || []).length ? (
                                (lessonCommentsById[lesson._id] || []).map(comment => (
                                  <div key={comment._id} className="report-item admin-lesson-comment-item">
                                    <p>
                                      <button
                                        type="button"
                                        className="link-button"
                                        onClick={() => onOpenProfile?.(comment.author || comment.authorName)}
                                      >
                                        {comment.authorName || 'Khách'}
                                      </button>
                                      {' '}· {new Date(comment.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                    <p>{comment.content}</p>
                                    <div className="management-actions">
                                      <button className="btn-danger" onClick={() => handleDeleteLessonComment(comment._id)}>
                                        Xóa bình luận
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p>Chưa có bình luận nào trong bài học này.</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>Chưa có bài học nào trong lớp này.</p>
                    )}
                  </div>
                ) : (
                  <p>Chọn một lớp để xem và quản lý bài học.</p>
                )}
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="admin-card card-panel">
                <div className="admin-card__header">
                  <h4>Lọc nội dung bị ẩn</h4>
                  <span>Bộ lọc kiểm duyệt</span>
                </div>
                <div className="management-actions">
                  <select value={deletedReasonFilter} onChange={e => onReasonChange(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="ai_moderation">AI kiểm duyệt</option>
                    <option value="manual">Thủ công</option>
                  </select>
                  <button className="btn-ghost" onClick={onFetchDeletedPosts}>
                    {isLoadingDeletedPosts ? 'Đang tải bài viết...' : 'Tải bài viết đã ẩn'}
                  </button>
                  <button className="btn-ghost" onClick={onFetchDeletedComments}>
                    {isLoadingDeletedComments ? 'Đang tải bình luận...' : 'Tải bình luận đã ẩn'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Bài viết đã bị ẩn (soft-delete)</h4>
                  <span>{formatCount(deletedPosts.length)} bài</span>
                </div>
                {deletedPosts.length ? (
                  <div className="report-list">
                    {deletedPosts.map(post => (
                      <div key={post._id} className="report-item">
                        <p>
                          <strong>{post.title}</strong> · {post.author} · {post.category}
                        </p>
                        <p>Nội dung: {post.content}</p>
                        <p>Lý do ẩn: {post.deletionReason || 'Không rõ'}</p>
                        <p>Ẩn bởi: {post.deletedBy || 'Không rõ'} · Lúc: {post.deletedAt ? new Date(post.deletedAt).toLocaleString('vi-VN') : 'Không rõ'}</p>
                        <div className="management-actions">
                          <button className="btn-post" onClick={() => onRestorePost(post._id)}>
                            Khôi phục bài viết
                          </button>
                          <button className="btn-danger" onClick={() => onPermanentDeletePost(post._id)}>
                            Xóa vĩnh viễn
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Chưa có bài nào bị ẩn.</p>
                )}
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Bình luận đã bị ẩn (soft-delete)</h4>
                  <span>{formatCount(deletedComments.length)} bình luận</span>
                </div>
                {deletedComments.length ? (
                  <div className="report-list">
                    {deletedComments.map(comment => (
                      <div key={comment._id} className="report-item">
                        <p>
                          <strong>{comment.author}</strong> · Post: {String(comment.postId)}
                        </p>
                        <p>Nội dung: {comment.text}</p>
                        <p>Lý do ẩn: {comment.deletionReason || 'Không rõ'}</p>
                        <p>Ẩn bởi: {comment.deletedBy || 'Không rõ'} · Lúc: {comment.deletedAt ? new Date(comment.deletedAt).toLocaleString('vi-VN') : 'Không rõ'}</p>
                        <div className="management-actions">
                          <button className="btn-post" onClick={() => onRestoreComment(comment._id)}>
                            Khôi phục bình luận
                          </button>
                          <button className="btn-danger" onClick={() => onPermanentDeleteComment(comment._id)}>
                            Xóa vĩnh viễn
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Chưa có bình luận nào bị ẩn.</p>
                )}
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Lịch sử kiểm duyệt AI</h4>
                  <span>{formatCount(moderationReports.length)} report</span>
                </div>
                {moderationReports.length ? (
                  <div className="report-list">
                    {moderationReports.map(report => (
                      <div key={report._id} className="report-item">
                        <p>
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => onOpenProfile?.(report.targetAuthor)}
                          >
                            {report.targetAuthor || 'Không rõ người đăng'}
                          </button>
                          {' '}· {getReportTargetLabel(report.targetType)} · {report.createdAt ? new Date(report.createdAt).toLocaleString('vi-VN') : ''}
                        </p>
                        <p>Mã nội dung: {report.targetId}</p>
                        <p>Nội dung: {report.content}</p>
                        <p>Lý do: {report.reason || 'Không rõ'}</p>
                        <button className="btn-ghost" onClick={() => onDeleteModerationReport(report._id)}>
                          Xóa report
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Chưa có report nào.</p>
                )}
                <div className="management-actions">
                  <button className="btn-ghost" onClick={onFetchReports}>
                    {isLoadingReports ? 'Đang tải...' : 'Tải report'}
                  </button>
                  <button className="btn-danger" onClick={onClearModerationReports}>
                    Xóa tất cả report
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Cài đặt</h4>
                  <span>Hệ thống</span>
                </div>
                <p className="helper-text">Chưa có tùy chỉnh nào trong mục này.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default ManageView
