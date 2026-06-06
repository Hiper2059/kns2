import { useState } from 'react'
import { getApiErrorMessage } from '../utils/apiMessages'
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
  categories = [],
  customCategories = [],
  onAddCategory,
  onRemoveCategory,
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
  const [newCategoryName, setNewCategoryName] = useState('')
  const formatCount = value => new Intl.NumberFormat('vi-VN').format(value || 0)
  const getReportTargetLabel = targetType => {
    if (targetType === 'post') return 'BÃ i viáº¿t'
    if (targetType === 'comment') return 'BÃ¬nh luáº­n diá»…n Ä‘Ã n'
    if (targetType === 'lesson_comment') return 'BÃ¬nh luáº­n bÃ i há»c'
    return targetType || 'KhÃ´ng rÃµ'
  }
  const analyticsData = analytics || {}
  const last30Days = Array.isArray(analyticsData.viewsLast30Days)
    ? analyticsData.viewsLast30Days.map((item, index) => ({
        key: item.date || item.day || String(index),
        label: item.label || item.date || `NgÃ y ${index + 1}`,
        views: item.views || 0
      }))
    : []

  const handleCopyUploadUrl = async () => {
    if (!adminUploadUrl) {
      return
    }
    try {
      await navigator.clipboard.writeText(adminUploadUrl)
      alert('ÄÃ£ sao chÃ©p link video.')
    } catch {
      alert('KhÃ´ng sao chÃ©p Ä‘Æ°á»£c link video.')
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
      alert(getApiErrorMessage(error, 'KhÃ´ng táº£i Ä‘Æ°á»£c bÃ¬nh luáº­n bÃ i há»c.'))
    } finally {
      setLoadingLessonCommentsId('')
    }
  }

  const handleDeleteLessonComment = async lessonCommentId => {
    if (!lessonCommentId || !api) {
      return
    }

    if (!window.confirm('XÃ³a bÃ¬nh luáº­n bÃ i há»c nÃ y?')) {
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
      alert(getApiErrorMessage(error, 'KhÃ´ng xÃ³a Ä‘Æ°á»£c bÃ¬nh luáº­n.'))
    }
  }

  const handleSubmitCategory = async event => {
    event.preventDefault()
    await onAddCategory?.(newCategoryName)
    setNewCategoryName('')
  }

  return (
    <div className="forum-view">
      <div className="admin-dashboard card-panel">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <span className="admin-logo">Admin</span>
            <span className="admin-subtitle">Báº£ng quáº£n trá»‹</span>
          </div>
          <nav className="admin-nav">
            {[
              { id: 'overview', label: 'Tá»•ng quan' },
              { id: 'users', label: 'NgÆ°á»i dÃ¹ng' },
              { id: 'lessons', label: 'BÃ i há»c' },
              { id: 'moderation', label: 'Kiá»ƒm duyá»‡t' },
              { id: 'content', label: 'Ná»™i dung' },
              { id: 'reports', label: 'BÃ¡o cÃ¡o' },
              { id: 'settings', label: 'CÃ i Ä‘áº·t' }
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
            <p className="admin-insight__title">ÄÃ¡nh giÃ¡ nhanh</p>
            <p className="admin-insight__text">
              {isLoadingAnalytics
                ? 'Äang táº£i thá»‘ng kÃª bÃ i há»c...'
                : `LÆ°á»£t xem bÃ i há»c: ${formatCount(analyticsData.totalLessonViews)} Â· NgÆ°á»i xem: ${formatCount(analyticsData.uniqueLessonViewers)}`}
            </p>
          </div>
        </aside>

        <div className="admin-main">
          <header className="admin-topbar">
            <div className="admin-search">
              <input type="text" placeholder="TÃ¬m nhanh ngÆ°á»i dÃ¹ng hoáº·c ná»™i dung" />
            </div>
            <div className="admin-action-buttons">
              {`Tá»•ng sá»‘ tÃ i khoáº£n: ${formatCount(managedUsers.length)}`}
            </div>
          </header>

          <section className="admin-content-grid">
            {activeSection === 'overview' && (
              <div className="admin-overview">
                <div className="admin-metric admin-metric--mint">
                  <span className="admin-metric__title">Tá»•ng tÃ i khoáº£n</span>
                  <h3>{formatCount(managedUsers.length)}</h3>
                  <span className="admin-metric__note">Cáº­p nháº­t theo danh sÃ¡ch hiá»‡n táº¡i</span>
                </div>
                <div className="admin-metric admin-metric--peach">
                  <span className="admin-metric__title">LÆ°á»£t xem bÃ i há»c</span>
                  <h3>{formatCount(analyticsData.totalLessonViews)}</h3>
                  <span className="admin-metric__note">NgÆ°á»i xem: {formatCount(analyticsData.uniqueLessonViewers)}</span>
                </div>
                <div className="admin-metric admin-metric--sky">
                  <span className="admin-metric__title">BÃ i viáº¿t cáº§n xá»­ lÃ½</span>
                  <h3>{formatCount(forumPosts.length)}</h3>
                  <span className="admin-metric__note">Danh sÃ¡ch bÃ i viáº¿t má»›i</span>
                </div>
                <div className="admin-metric admin-metric--rose">
                  <span className="admin-metric__title">BÃ¡o cÃ¡o kiá»ƒm duyá»‡t</span>
                  <h3>{formatCount(moderationReports.length)}</h3>
                  <span className="admin-metric__note">AI kiá»ƒm duyá»‡t gáº§n Ä‘Ã¢y</span>
                </div>
              </div>
            )}

            {activeSection === 'users' && (
              <div className="admin-card admin-card--span card-panel">
              <div className="admin-card__header">
                <h4>Quáº£n lÃ½ ngÆ°á»i dÃ¹ng</h4>
                <span>{formatCount(managedUsers.length)} tÃ i khoáº£n</span>
              </div>
              <div className="management-list">
                {managedUsers.length ? (
                  managedUsers.map(user => (
                    <div key={user.username} className="management-item">
                      <div>
                        <strong>{user.username}</strong>
                        <p>Vai trÃ² hiá»‡n táº¡i: {user.role}</p>
                        <p>Tráº¡ng thÃ¡i: {user.status || 'active'}</p>
                        <p>Sá»‘ vi pháº¡m: {user.violationCount || 0}</p>
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
                          XÃ³a tÃ i khoáº£n
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="post-card empty-state">
                    <h4>ChÆ°a cÃ³ dá»¯ liá»‡u ngÆ°á»i dÃ¹ng</h4>
                    <p>ÄÄƒng nháº­p báº±ng tÃ i khoáº£n admin Ä‘á»ƒ táº£i danh sÃ¡ch.</p>
                  </div>
                )}
              </div>
              <div className="management-actions">
                <button className="btn-ghost" onClick={onFetchUsers}>
                  {isLoadingUsers ? 'Äang táº£i...' : 'Táº£i láº¡i danh sÃ¡ch'}
                </button>
              </div>
            </div>
            )}

            {activeSection === 'users' && (
              <div className="admin-card card-panel">
                <div className="admin-card__header">
                  <h4>Táº¡o tÃ i khoáº£n má»›i</h4>
                  <span>Táº¡o nhanh</span>
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
                    placeholder="TÃªn hiá»ƒn thá»‹"
                    value={newUserData.displayName}
                    onChange={e => onNewUserDataChange({ ...newUserData, displayName: e.target.value })}
                  />
                  <input
                    type="password"
                    placeholder="Máº­t kháº©u"
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
                  <button className="btn-post" onClick={onCreateUser}>Táº¡o tÃ i khoáº£n</button>
                </div>
                <p className="helper-text">
                  Táº¡o xong tÃ i khoáº£n giáº£ng viÃªn hoáº·c admin lÃ  cÃ³ thá»ƒ phÃ¢n quyá»n vÃ  má»Ÿ Ä‘Ãºng khu vá»±c quáº£n trá»‹.
                </p>
              </div>
            )}

            {activeSection === 'reports' && (
              <div className="admin-card card-panel">
                <div className="admin-card__header">
                  <h4>LÆ°á»£t truy cáº­p bÃ i há»c</h4>
                  <span>{formatCount(analyticsData.totalLessonViews)} lÆ°á»£t</span>
                </div>
                <div className="admin-analytics">
                  <div className="admin-analytics__stat">
                    <p>NgÆ°á»i xem</p>
                    <strong>{formatCount(analyticsData.uniqueLessonViewers)}</strong>
                  </div>
                  <div className="admin-analytics__stat">
                    <p>Top bÃ i há»c</p>
                    <strong>{formatCount(analyticsData.topLessons?.length || 0)}</strong>
                  </div>
                </div>
                <div className="admin-analytics__list">
                  {analyticsData.topLessons?.length ? (
                    analyticsData.topLessons.map(item => (
                      <div key={String(item.lessonId)} className="admin-analytics__item">
                        <div>
                          <p className="admin-analytics__lesson">{item.lessonTitle || 'BÃ i há»c chÆ°a xÃ¡c Ä‘á»‹nh'}</p>
                          <p className="admin-analytics__course">{item.courseTitle || 'ChÆ°a gáº¯n lá»›p há»c'}</p>
                        </div>
                        <span>{formatCount(item.views)} lÆ°á»£t</span>
                      </div>
                    ))
                  ) : (
                    <p className="helper-text">ChÆ°a cÃ³ dá»¯ liá»‡u lÆ°á»£t xem bÃ i há»c.</p>
                  )}
                </div>
                <div className="admin-analytics__timeline">
                  <div className="admin-analytics__timeline-header">
                    <span>30 ngÃ y gáº§n nháº¥t</span>
                    <strong>{formatCount(analyticsData.totalLast30Days)} lÆ°á»£t</strong>
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
                        <span>ChÆ°a cÃ³ dá»¯ liá»‡u</span>
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
                  <span>Quáº£n trá»‹ ná»™i dung</span>
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
                    {adminUploadUrl ? 'Sao chÃ©p link' : 'ChÆ°a cÃ³ link'}
                  </button>
                  {adminUploadUrl && (
                    <button className="btn-ghost" onClick={onClearAdminUploadUrl}>
                      XÃ³a link
                    </button>
                  )}
                </div>
                {isAdminUploadLoading && <p className="helper-text">Äang upload video...</p>}
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
                  <h4>BÃ i viáº¿t cáº§n kiá»ƒm duyá»‡t nhanh</h4>
                  <span>{formatCount(forumPosts.length)} bÃ i</span>
                </div>
                {forumPosts.length ? (
                  <div className="report-list">
                    {forumPosts.map(post => (
                      <div key={post.id} className="report-item">
                        <p>
                          <strong>{post.title}</strong> Â· {post.author} Â· {post.category}
                        </p>
                        <p>{post.content}</p>
                        <button className="btn-danger" onClick={() => onAdminDeletePost(post)}>
                          XÃ³a bÃ i viáº¿t nÃ y
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>KhÃ´ng cÃ³ bÃ i viáº¿t nÃ o Ä‘á»ƒ xÃ³a.</p>
                )}
              </div>
            )}

            {activeSection === 'lessons' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Quáº£n lÃ½ bÃ i há»c</h4>
                  <span>{formatCount(courses.length)} lá»›p</span>
                </div>
                <div className="management-actions">
                  <select
                    value={selectedCourse?._id || ''}
                    onChange={e => {
                      const selected = courses.find(course => String(course._id) === String(e.target.value)) || null
                      onSelectCourse?.(selected)
                    }}
                  >
                    <option value="">Chá»n lá»›p há»c</option>
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
                        <strong>{selectedCourse.title}</strong> Â· {selectedCourse.category}
                      </p>
                      <p>{selectedCourse.description || 'ChÆ°a cÃ³ mÃ´ táº£ lá»›p há»c.'}</p>
                    </div>

                    {courseLessons.length ? (
                      courseLessons.map(lesson => (
                        <div key={lesson._id} className="report-item">
                          <p>
                            <strong>{lesson.order}. {lesson.title}</strong>
                          </p>
                          <p>{lesson.slug || lesson._id}</p>
                          <p>{lesson.content ? 'CÃ³ ná»™i dung bÃ i há»c.' : 'ChÆ°a cÃ³ ná»™i dung.'}</p>
                          <div className="management-actions">
                            <button className="btn-post" onClick={() => onOpenLesson?.(lesson)}>
                              Xem bÃ i há»c
                            </button>
                            <button className="btn-ghost" onClick={() => handleOpenLessonComments(lesson._id)}>
                              {expandedLessonId === lesson._id ? 'áº¨n bÃ¬nh luáº­n' : 'Xem bÃ¬nh luáº­n'}
                            </button>
                            <button className="btn-danger" onClick={() => onDeleteLesson?.(lesson._id)}>
                              XÃ³a bÃ i há»c
                            </button>
                          </div>

                          {expandedLessonId === lesson._id && (
                            <div className="admin-lesson-comments">
                              {loadingLessonCommentsId === lesson._id ? (
                                <p>Äang táº£i bÃ¬nh luáº­n bÃ i há»c...</p>
                              ) : (lessonCommentsById[lesson._id] || []).length ? (
                                (lessonCommentsById[lesson._id] || []).map(comment => (
                                  <div key={comment._id} className="report-item admin-lesson-comment-item">
                                    <p>
                                      <button
                                        type="button"
                                        className="link-button"
                                        onClick={() => onOpenProfile?.(comment.author || comment.authorName)}
                                      >
                                        {comment.authorName || 'KhÃ¡ch'}
                                      </button>
                                      {' '}Â· {new Date(comment.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                    <p>{comment.content}</p>
                                    <div className="management-actions">
                                      <button className="btn-danger" onClick={() => handleDeleteLessonComment(comment._id)}>
                                        XÃ³a bÃ¬nh luáº­n
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p>ChÆ°a cÃ³ bÃ¬nh luáº­n nÃ o trong bÃ i há»c nÃ y.</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>ChÆ°a cÃ³ bÃ i há»c nÃ o trong lá»›p nÃ y.</p>
                    )}
                  </div>
                ) : (
                  <p>Chá»n má»™t lá»›p Ä‘á»ƒ xem vÃ  quáº£n lÃ½ bÃ i há»c.</p>
                )}
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="admin-card card-panel">
                <div className="admin-card__header">
                  <h4>Lá»c ná»™i dung bá»‹ áº©n</h4>
                  <span>Bá»™ lá»c kiá»ƒm duyá»‡t</span>
                </div>
                <div className="management-actions">
                  <select value={deletedReasonFilter} onChange={e => onReasonChange(e.target.value)}>
                    <option value="all">Táº¥t cáº£</option>
                    <option value="ai_moderation">AI kiá»ƒm duyá»‡t</option>
                    <option value="manual">Thá»§ cÃ´ng</option>
                  </select>
                  <button className="btn-ghost" onClick={onFetchDeletedPosts}>
                    {isLoadingDeletedPosts ? 'Äang táº£i bÃ i viáº¿t...' : 'Táº£i bÃ i viáº¿t Ä‘Ã£ áº©n'}
                  </button>
                  <button className="btn-ghost" onClick={onFetchDeletedComments}>
                    {isLoadingDeletedComments ? 'Äang táº£i bÃ¬nh luáº­n...' : 'Táº£i bÃ¬nh luáº­n Ä‘Ã£ áº©n'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>BÃ i viáº¿t Ä‘Ã£ bá»‹ áº©n (soft-delete)</h4>
                  <span>{formatCount(deletedPosts.length)} bÃ i</span>
                </div>
                {deletedPosts.length ? (
                  <div className="report-list">
                    {deletedPosts.map(post => (
                      <div key={post._id} className="report-item">
                        <p>
                          <strong>{post.title}</strong> Â· {post.author} Â· {post.category}
                        </p>
                        <p>Ná»™i dung: {post.content}</p>
                        <p>LÃ½ do áº©n: {post.deletionReason || 'KhÃ´ng rÃµ'}</p>
                        <p>áº¨n bá»Ÿi: {post.deletedBy || 'KhÃ´ng rÃµ'} Â· LÃºc: {post.deletedAt ? new Date(post.deletedAt).toLocaleString('vi-VN') : 'KhÃ´ng rÃµ'}</p>
                        <div className="management-actions">
                          <button className="btn-post" onClick={() => onRestorePost(post._id)}>
                            KhÃ´i phá»¥c bÃ i viáº¿t
                          </button>
                          <button className="btn-danger" onClick={() => onPermanentDeletePost(post._id)}>
                            XÃ³a vÄ©nh viá»…n
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>ChÆ°a cÃ³ bÃ i nÃ o bá»‹ áº©n.</p>
                )}
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>BÃ¬nh luáº­n Ä‘Ã£ bá»‹ áº©n (soft-delete)</h4>
                  <span>{formatCount(deletedComments.length)} bÃ¬nh luáº­n</span>
                </div>
                {deletedComments.length ? (
                  <div className="report-list">
                    {deletedComments.map(comment => (
                      <div key={comment._id} className="report-item">
                        <p>
                          <strong>{comment.author}</strong> Â· Post: {String(comment.postId)}
                        </p>
                        <p>Ná»™i dung: {comment.text}</p>
                        <p>LÃ½ do áº©n: {comment.deletionReason || 'KhÃ´ng rÃµ'}</p>
                        <p>áº¨n bá»Ÿi: {comment.deletedBy || 'KhÃ´ng rÃµ'} Â· LÃºc: {comment.deletedAt ? new Date(comment.deletedAt).toLocaleString('vi-VN') : 'KhÃ´ng rÃµ'}</p>
                        <div className="management-actions">
                          <button className="btn-post" onClick={() => onRestoreComment(comment._id)}>
                            KhÃ´i phá»¥c bÃ¬nh luáº­n
                          </button>
                          <button className="btn-danger" onClick={() => onPermanentDeleteComment(comment._id)}>
                            XÃ³a vÄ©nh viá»…n
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>ChÆ°a cÃ³ bÃ¬nh luáº­n nÃ o bá»‹ áº©n.</p>
                )}
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Lá»‹ch sá»­ kiá»ƒm duyá»‡t AI</h4>
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
                            {report.targetAuthor || 'KhÃ´ng rÃµ ngÆ°á»i Ä‘Äƒng'}
                          </button>
                          {' '}Â· {getReportTargetLabel(report.targetType)} Â· {report.createdAt ? new Date(report.createdAt).toLocaleString('vi-VN') : ''}
                        </p>
                        <p>MÃ£ ná»™i dung: {report.targetId}</p>
                        <p>Ná»™i dung: {report.content}</p>
                        <p>LÃ½ do: {report.reason || 'KhÃ´ng rÃµ'}</p>
                        <button className="btn-ghost" onClick={() => onDeleteModerationReport(report._id)}>
                          XÃ³a report
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>ChÆ°a cÃ³ report nÃ o.</p>
                )}
                <div className="management-actions">
                  <button className="btn-ghost" onClick={onFetchReports}>
                    {isLoadingReports ? 'Äang táº£i...' : 'Táº£i report'}
                  </button>
                  <button className="btn-danger" onClick={onClearModerationReports}>
                    XÃ³a táº¥t cáº£ report
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="admin-card admin-card--span card-panel">
                <div className="admin-card__header">
                  <h4>Cai dat</h4>
                  <span>He thong va danh muc</span>
                </div>
                <div className="category-manager">
                  <div>
                    <h5>Danh muc lop hoc</h5>
                    <p className="helper-text">
                      Danh muc moi se xuat hien trong LMS, dien dan va form tao lop.
                    </p>
                  </div>

                  <form className="category-form" onSubmit={handleSubmitCategory}>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={event => setNewCategoryName(event.target.value)}
                      placeholder="Vi du: Suc khoe tinh than..."
                      aria-label="Ten danh muc moi"
                    />
                    <button className="btn-post" type="submit">Them danh muc</button>
                  </form>

                  <div className="category-chip-list">
                    {categories.length ? (
                      categories.map(category => {
                        const canRemove = customCategories.includes(category)
                        return (
                          <span key={category} className="category-chip">
                            {category}
                            {canRemove && (
                              <button
                                type="button"
                                aria-label={`Xoa danh muc ${category}`}
                                onClick={() => onRemoveCategory?.(category)}
                              >
                                Xoa
                              </button>
                            )}
                          </span>
                        )
                      })
                    ) : (
                      <p className="helper-text">Chua co danh muc nao.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default ManageView
