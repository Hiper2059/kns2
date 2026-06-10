import { useState } from 'react'
import {
  BarChart3,
  BookOpen,
  FileText,
  Flag,
  LayoutDashboard,
  MessageSquare,
  Search,
  ShieldCheck,
  UserRound,
  Users
} from 'lucide-react'
import { getApiErrorMessage } from '../utils/apiMessages'
import { useUI } from '../context/UIContext'

const baseInputClass = "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
const baseButtonClass = "inline-flex items-center justify-center h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] cursor-pointer text-[13px]"
const ghostButtonClass = "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer text-[13px]"
const dangerButtonClass = "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all cursor-pointer text-[13px]"

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
  const { showToast, showError, showSuccess } = useUI()
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

  const navMeta = {
    overview: { label: 'Tổng quan', icon: LayoutDashboard },
    users: { label: 'Người dùng', icon: Users },
    lessons: { label: 'Lớp & bài học', icon: BookOpen },
    comments: { label: 'Bình luận', icon: MessageSquare },
    moderation: { label: 'Kiểm duyệt', icon: ShieldCheck },
    reports: { label: 'Báo cáo', icon: Flag },
    content: { label: 'Nội dung', icon: FileText }
  }

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
      showSuccess('Đã sao chép link video.')
    } catch {
      showError('Không sao chép được link video.')
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
      showError(getApiErrorMessage(error, 'Không tải được bình luận bài học.'))
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
      showError(getApiErrorMessage(error, 'Không xóa được bình luận.'))
    }
  }

  const renderCommentScope = comment => {
    if (comment.postScope === 'course') {
      return comment.courseTitle ? `Diễn đàn lớp: ${comment.courseTitle}` : 'Diễn đàn lớp'
    }
    return 'Diễn đàn chung'
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] min-w-0 flex flex-col lg:flex-row bg-white overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-[260px] bg-slate-900 text-slate-300 flex flex-col flex-shrink-0">
          <div className="p-6 md:p-8 flex items-center gap-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-inner">
              <ShieldCheck size={24} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white text-[16px] font-black tracking-tight truncate">Quản trị viên</span>
              <span className="text-blue-400 text-[11px] font-bold uppercase tracking-wider">Dashboard</span>
            </div>
          </div>
          
          <nav className="flex-1 py-6 px-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto hide-scrollbar">
            {navItems.map(item => {
              const meta = navMeta[item.id] || item
              const Icon = meta.icon
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`flex items-center gap-3 w-full px-4 h-12 flex-shrink-0 text-[14px] font-bold rounded-xl transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-[0_4px_14px_0_rgb(37,99,235,0.39)]' 
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`}
                  onClick={() => setActiveSection(item.id)}
                >
                  {Icon && <Icon size={18} className={isActive ? "text-white" : "text-slate-500"} />}
                  <span className="whitespace-nowrap">{meta.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="hidden lg:block p-6 border-t border-slate-800 bg-slate-950/50">
            <p className="text-[12px] font-bold uppercase text-slate-500 mb-2 tracking-wide">Đánh giá nhanh</p>
            <div className="text-[13px] font-medium leading-relaxed text-slate-400">
              {isLoadingAnalytics ? (
                <span className="animate-pulse">Đang tải thống kê...</span>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between"><span>Lượt xem bài:</span> <strong className="text-white">{formatCount(analyticsData.totalLessonViews)}</strong></div>
                  <div className="flex justify-between"><span>Người xem:</span> <strong className="text-white">{formatCount(analyticsData.uniqueLessonViewers)}</strong></div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <header className="h-[76px] px-6 md:px-8 flex items-center justify-between border-b border-slate-200 flex-shrink-0 bg-white">
            <h2 className="text-xl font-black text-slate-900 hidden md:block">
              {navMeta[activeSection]?.label || 'Tổng quan'}
            </h2>
            <div className="flex items-center gap-3 h-11 px-4 bg-slate-100 rounded-xl max-w-md w-full border border-slate-200/50 focus-within:bg-white focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Tìm nhanh người dùng hoặc nội dung..." className="bg-transparent border-none text-[14px] font-semibold text-slate-800 w-full focus:outline-none placeholder-slate-400" />
            </div>
            <div className="hidden lg:flex items-center h-10 px-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] font-bold">
              {`Tổng tài khoản: ${formatCount(managedUsers.length)}`}
            </div>
          </header>

          <section className="flex-1 p-6 md:p-8 overflow-y-auto">
            {activeSection === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="relative p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 overflow-hidden shadow-sm">
                  <span className="block text-[12px] font-black uppercase mb-1 opacity-70 tracking-wide">Tổng tài khoản</span>
                  <h3 className="text-3xl lg:text-4xl font-black mb-4">{formatCount(managedUsers.length)}</h3>
                  <UserRound className="absolute right-4 bottom-4 w-20 h-20 opacity-10" />
                  <span className="block text-[13px] font-bold opacity-80">Theo danh sách hiện tại</span>
                </div>
                
                <div className="relative p-6 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 overflow-hidden shadow-sm">
                  <span className="block text-[12px] font-black uppercase mb-1 opacity-70 tracking-wide">Lượt xem bài học</span>
                  <h3 className="text-3xl lg:text-4xl font-black mb-4">{formatCount(analyticsData.totalLessonViews)}</h3>
                  <BarChart3 className="absolute right-4 bottom-4 w-20 h-20 opacity-10" />
                  <span className="block text-[13px] font-bold opacity-80">Người xem: {formatCount(analyticsData.uniqueLessonViewers)}</span>
                </div>

                <div className="relative p-6 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 overflow-hidden shadow-sm">
                  <span className="block text-[12px] font-black uppercase mb-1 opacity-70 tracking-wide">Tổng lớp học</span>
                  <h3 className="text-3xl lg:text-4xl font-black mb-4">{formatCount(courses.length)}</h3>
                  <BookOpen className="absolute right-4 bottom-4 w-20 h-20 opacity-10" />
                  <span className="block text-[13px] font-bold opacity-80">Admin xem tất cả</span>
                </div>

                <div className="relative p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 overflow-hidden shadow-sm">
                  <span className="block text-[12px] font-black uppercase mb-1 opacity-70 tracking-wide">Bình luận diễn đàn</span>
                  <h3 className="text-3xl lg:text-4xl font-black mb-4">{formatCount(forumComments.length)}</h3>
                  <MessageSquare className="absolute right-4 bottom-4 w-20 h-20 opacity-10" />
                  <span className="block text-[13px] font-bold opacity-80">Đang theo dõi toàn hệ thống</span>
                </div>
              </div>
            )}

            {activeSection === 'users' && (
              <div className="flex flex-col gap-8">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-black text-slate-900">Quản lý người dùng</h4>
                      <p className="text-[14px] text-slate-500 font-medium">Theo dõi và chỉnh sửa quyền tài khoản.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[13px] font-bold">{formatCount(managedUsers.length)} tài khoản</span>
                      <button className={ghostButtonClass} onClick={onFetchUsers}>
                        {isLoadingUsers ? 'Đang tải...' : 'Làm mới'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col max-h-[500px] overflow-y-auto bg-slate-50">
                    {managedUsers.length ? managedUsers.map(user => (
                      <div key={user.username} className="p-6 border-b border-slate-200 flex flex-col lg:flex-row justify-between gap-6 hover:bg-slate-100/50 transition-colors bg-white">
                        <div className="flex-1">
                          <strong className="block text-[16px] font-black text-slate-900 mb-2">{user.username} {user.displayName ? `(${user.displayName})` : ''}</strong>
                          <div className="flex flex-wrap gap-2 text-[13px] font-bold">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">Vai trò: <span className="uppercase text-slate-800">{user.role}</span></span>
                            <span className={`px-2.5 py-1 rounded-md ${user.status === 'banned' ? 'bg-red-100 text-red-700' : user.status === 'suspended' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              Trạng thái: {user.status || 'active'}
                            </span>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">Vi phạm: {user.violationCount || 0}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 lg:self-start">
                          <select
                            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
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
                            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
                            value={user.status || 'active'}
                            onChange={event => onStatusChange(user.username, event.target.value)}
                            disabled={user.username === currentUser}
                          >
                            <option value="active">active</option>
                            <option value="suspended">suspended</option>
                            <option value="banned">banned</option>
                          </select>
                          <button className={dangerButtonClass} onClick={() => onDeleteUser(user.username)} disabled={user.username === currentUser}>
                            Xóa TK
                          </button>
                        </div>
                      </div>
                    )) : <div className="p-8 text-center text-slate-500 font-medium">Chưa có dữ liệu người dùng.</div>}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <div className="mb-6 pb-4 border-b border-slate-100">
                    <h4 className="text-lg font-black text-slate-900">Tạo tài khoản mới</h4>
                    <p className="text-[14px] text-slate-500 font-medium">Sử dụng form dưới đây để thêm nhanh thành viên mới.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
                    <input type="text" className={baseInputClass} placeholder="Username" value={newUserData.username} onChange={event => onNewUserDataChange({ ...newUserData, username: event.target.value })} />
                    <input type="text" className={baseInputClass} placeholder="Tên hiển thị" value={newUserData.displayName} onChange={event => onNewUserDataChange({ ...newUserData, displayName: event.target.value })} />
                    <input type="password" className={baseInputClass} placeholder="Mật khẩu" value={newUserData.password} onChange={event => onNewUserDataChange({ ...newUserData, password: event.target.value })} />
                    <div className="flex items-center gap-3">
                      <select className={baseInputClass} value={newUserData.role} onChange={event => onNewUserDataChange({ ...newUserData, role: event.target.value })}>
                        <option value="student">student</option>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                      <button className={baseButtonClass} onClick={onCreateUser}>Tạo</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'lessons' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-0">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-black text-slate-900">Quản lý Lớp & Bài học</h4>
                    <span className="text-[14px] text-slate-500 font-medium">{formatCount(courses.length)} lớp trên hệ thống</span>
                  </div>
                  <select
                    className="w-full md:w-64 h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 cursor-pointer focus:outline-none focus:border-blue-500"
                    value={selectedCourse?._id || ''}
                    onChange={event => {
                      const nextCourse = courses.find(course => String(course._id) === String(event.target.value)) || null
                      onSelectCourse?.(nextCourse)
                    }}
                  >
                    <option value="">-- Chọn lớp học --</option>
                    {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
                  </select>
                </div>
                <div className="flex flex-col p-6 bg-slate-50 gap-4">
                  {selectedCourse ? (
                    <>
                      <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900">
                        <strong className="block text-lg font-black mb-1">{selectedCourse.title}</strong>
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-200/50 text-[11px] font-black uppercase mb-3">{selectedCourse.category}</span>
                        <p className="text-[14px] font-medium opacity-80">{selectedCourse.description || 'Chưa có mô tả lớp học.'}</p>
                      </div>
                      
                      <div className="flex flex-col gap-4 mt-2">
                        {courseLessons.length ? courseLessons.map(lesson => (
                          <div key={lesson._id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                              <div>
                                <strong className="text-[16px] font-black text-slate-900">{lesson.order}. {lesson.title}</strong>
                                <p className="text-[13px] text-slate-500 font-medium mt-1">{lesson.content ? 'Có nội dung bài học.' : 'Chưa có nội dung.'}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button className={baseButtonClass} onClick={() => onOpenLesson?.(lesson)}>Vào bài học</button>
                                <button className={ghostButtonClass} onClick={() => handleOpenLessonComments(lesson._id)}>
                                  {expandedLessonId === lesson._id ? 'Ẩn bình luận' : 'Xem bình luận'}
                                </button>
                                <button className={dangerButtonClass} onClick={() => onDeleteLesson?.(lesson._id)}>Xóa bài</button>
                              </div>
                            </div>

                            {expandedLessonId === lesson._id && (
                              <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
                                {loadingLessonCommentsId === lesson._id ? <p className="text-[13px] text-slate-500 font-medium animate-pulse">Đang tải bình luận...</p> : (lessonCommentsById[lesson._id] || []).length ? (
                                  (lessonCommentsById[lesson._id] || []).map(comment => (
                                    <div key={comment._id} className="p-4 bg-white border border-slate-200 rounded-lg text-[14px]">
                                      <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-slate-800 text-[13px]">
                                          <button type="button" className="text-blue-600 hover:underline cursor-pointer" onClick={() => onOpenProfile?.(comment.author || comment.authorName)}>
                                            {comment.authorName || 'Khách'}
                                          </button>
                                          <span className="text-slate-400 font-medium ml-2">· {new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
                                        </p>
                                        <button className="text-[12px] font-bold text-red-500 hover:text-red-700 cursor-pointer transition-colors" onClick={() => handleDeleteLessonComment(comment._id)}>Xóa</button>
                                      </div>
                                      <p className="text-slate-600">{comment.content}</p>
                                    </div>
                                  ))
                                ) : <p className="text-[13px] text-slate-500 font-medium">Chưa có bình luận trong bài học này.</p>}
                              </div>
                            )}
                          </div>
                        )) : <div className="py-10 text-center text-slate-500 font-medium">Chưa có bài học nào trong lớp này.</div>}
                      </div>
                    </>
                  ) : <div className="py-20 text-center text-slate-500 font-medium bg-white rounded-xl border border-dashed border-slate-300">Chọn một lớp ở trên để xem và quản lý bài học.</div>}
                </div>
              </div>
            )}

            {activeSection === 'comments' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-black text-slate-900">Quản lý bình luận diễn đàn</h4>
                    <span className="text-[14px] text-slate-500 font-medium">{formatCount(forumComments.length)} bình luận</span>
                  </div>
                  <button className={ghostButtonClass} onClick={onFetchForumComments}>
                    {isLoadingForumComments ? 'Đang tải...' : 'Tải bình luận mới nhất'}
                  </button>
                </div>
                <div className="flex flex-col gap-4 p-6 bg-slate-50">
                  {forumComments.length ? forumComments.map(comment => (
                    <div key={comment._id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-3">
                        <div>
                          <p className="text-[13px] font-bold text-slate-800 mb-1">
                            <button type="button" className="text-blue-600 hover:underline cursor-pointer" onClick={() => onOpenProfile?.(comment.author)}>
                              {comment.author}
                            </button>
                            <span className="text-slate-400 font-medium ml-2">· {renderCommentScope(comment)} · {comment.createdAt ? new Date(comment.createdAt).toLocaleString('vi-VN') : ''}</span>
                          </p>
                          <p className="text-[12px] font-bold text-slate-500 mb-2 bg-slate-50 inline-block px-2 py-1 rounded">Bài viết: {comment.postTitle || String(comment.postId)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 flex-shrink-0">
                          <button className={dangerButtonClass} onClick={() => onPunishForumComment?.(comment, 'warn')}>Xóa + Cảnh cáo</button>
                          <button className={dangerButtonClass} onClick={() => onPunishForumComment?.(comment, 'suspend')}>Xóa + Khóa 3 ngày</button>
                          <button className={dangerButtonClass} onClick={() => onPunishForumComment?.(comment, 'ban')}>Xóa + Ban vĩnh viễn</button>
                        </div>
                      </div>
                      <p className="text-[15px] text-slate-700 p-4 bg-slate-50 rounded-lg border border-slate-100">{comment.text}</p>
                    </div>
                  )) : <div className="py-10 text-center text-slate-500 font-medium">Chưa có bình luận diễn đàn nào.</div>}
                </div>
              </div>
            )}

            {activeSection === 'moderation' && (
              <div className="flex flex-col gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <h4 className="text-xl font-black text-slate-900">Nội dung đã ẩn</h4>
                      <p className="text-[14px] text-slate-500 font-medium">Quản lý các nội dung vi phạm bị tự động ẩn hoặc xóa thủ công.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 cursor-pointer focus:outline-none" value={deletedReasonFilter} onChange={event => onReasonChange(event.target.value)}>
                        <option value="all">Tất cả lý do</option>
                        <option value="ai_moderation">AI kiểm duyệt</option>
                        <option value="manual_delete">Thủ công</option>
                        <option value="admin_warn">Admin phạt</option>
                      </select>
                      <button className={ghostButtonClass} onClick={onFetchDeletedPosts}>{isLoadingDeletedPosts ? 'Đang tải...' : 'Tải bài viết'}</button>
                      <button className={ghostButtonClass} onClick={onFetchDeletedComments}>{isLoadingDeletedComments ? 'Đang tải...' : 'Tải bình luận'}</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Deleted Posts */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h4 className="text-lg font-black text-slate-900">Bài viết đã ẩn</h4>
                      <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-[12px] font-bold">{formatCount(deletedPosts.length)}</span>
                    </div>
                    <div className="flex flex-col gap-3 p-5 overflow-y-auto max-h-[600px]">
                      {deletedPosts.length ? deletedPosts.map(post => (
                        <div key={post._id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-slate-300">
                          <p className="text-[13px] font-bold text-slate-800 mb-2"><strong>{post.title}</strong> <span className="text-slate-400 font-medium">· {post.author} · {post.category}</span></p>
                          <p className="text-[14px] text-slate-600 mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-3">{post.content}</p>
                          <p className="text-[12px] font-bold text-red-600 mb-3 bg-red-50 inline-block px-2 py-1 rounded">Lý do: {post.deletionReason || 'Không rõ'}</p>
                          <div className="flex items-center gap-2">
                            <button className={baseButtonClass} style={{height: '36px', padding: '0 12px'}} onClick={() => onRestorePost(post._id)}>Khôi phục</button>
                            <button className={dangerButtonClass} style={{height: '36px'}} onClick={() => onPermanentDeletePost(post._id)}>Xóa vĩnh viễn</button>
                          </div>
                        </div>
                      )) : <p className="text-center text-slate-500 font-medium py-8">Chưa có bài viết bị ẩn.</p>}
                    </div>
                  </div>

                  {/* Deleted Comments */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h4 className="text-lg font-black text-slate-900">Bình luận đã ẩn</h4>
                      <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-[12px] font-bold">{formatCount(deletedComments.length)}</span>
                    </div>
                    <div className="flex flex-col gap-3 p-5 overflow-y-auto max-h-[600px]">
                      {deletedComments.length ? deletedComments.map(comment => (
                        <div key={comment._id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-slate-300">
                          <p className="text-[13px] font-bold text-slate-800 mb-2"><strong>{comment.author}</strong> <span className="text-slate-400 font-medium">· Post: {String(comment.postId)}</span></p>
                          <p className="text-[14px] text-slate-600 mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100">{comment.text}</p>
                          <p className="text-[12px] font-bold text-red-600 mb-3 bg-red-50 inline-block px-2 py-1 rounded">Lý do: {comment.deletionReason || 'Không rõ'}</p>
                          <div className="flex items-center gap-2">
                            <button className={baseButtonClass} style={{height: '36px', padding: '0 12px'}} onClick={() => onRestoreComment(comment._id)}>Khôi phục</button>
                            <button className={dangerButtonClass} style={{height: '36px'}} onClick={() => onPermanentDeleteComment(comment._id)}>Xóa vĩnh viễn</button>
                          </div>
                        </div>
                      )) : <p className="text-center text-slate-500 font-medium py-8">Chưa có bình luận bị ẩn.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'reports' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-black text-slate-900">Lịch sử kiểm duyệt AI</h4>
                    <span className="text-[14px] text-slate-500 font-medium">{formatCount(moderationReports.length)} báo cáo hệ thống ghi nhận</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className={ghostButtonClass} onClick={onFetchReports}>{isLoadingReports ? 'Đang tải...' : 'Làm mới'}</button>
                    <button className={dangerButtonClass} onClick={onClearModerationReports}>Xóa tất cả</button>
                  </div>
                </div>
                <div className="flex flex-col gap-4 p-6 bg-slate-50">
                  {moderationReports.length ? moderationReports.map(report => (
                    <div key={report._id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-3">
                        <p className="text-[13px] font-bold text-slate-800">
                          <button type="button" className="text-blue-600 hover:underline cursor-pointer" onClick={() => onOpenProfile?.(report.targetAuthor)}>
                            {report.targetAuthor || 'Không rõ người đăng'}
                          </button>
                          <span className="text-slate-400 font-medium ml-2">· {getReportTargetLabel(report.targetType)}</span>
                        </p>
                        <button className={ghostButtonClass} style={{height: '32px'}} onClick={() => onDeleteModerationReport(report._id)}>Xóa report này</button>
                      </div>
                      <p className="text-[14px] text-slate-700 p-4 bg-rose-50/50 rounded-lg border border-rose-100 mb-3">{report.content}</p>
                      <p className="text-[12px] font-bold text-red-600 bg-red-50 inline-block px-2.5 py-1 rounded-md">Lý do AI bắt: {report.reason || 'Không rõ'}</p>
                    </div>
                  )) : <div className="py-10 text-center text-slate-500 font-medium">Hệ thống AI chưa ghi nhận vi phạm nào.</div>}
                </div>
              </div>
            )}

            {activeSection === 'content' && (
              <div className="flex flex-col gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <div className="mb-6 pb-4 border-b border-slate-100">
                    <h4 className="text-xl font-black text-slate-900">Tiện ích Upload Video</h4>
                    <p className="text-[14px] text-slate-500 font-medium">Tải video trực tiếp lên Cloudinary để lấy link nhúng vào bài viết/bài giảng.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4 max-w-2xl bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <input
                      type="file"
                      accept="video/*"
                      className="block w-full text-[13px] text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[13px] file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer bg-white border border-slate-200 rounded-xl"
                      onChange={event => {
                        const file = event.target.files?.[0]
                        if (file) onAdminUploadVideo?.(file)
                        event.target.value = ''
                      }}
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button className={`${baseButtonClass} whitespace-nowrap`} onClick={handleCopyUploadUrl} disabled={!adminUploadUrl}>
                        {adminUploadUrl ? 'Copy Link' : 'Chưa có link'}
                      </button>
                      {adminUploadUrl && <button className={ghostButtonClass} onClick={onClearAdminUploadUrl}>Xóa</button>}
                    </div>
                  </div>
                  {isAdminUploadLoading && <p className="mt-4 text-[13px] font-bold text-blue-600 animate-pulse">Đang upload video lên mây...</p>}
                  {adminUploadUrl && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="block text-[12px] font-bold text-emerald-800 mb-1 uppercase">Upload thành công!</span>
                      <a className="text-[14px] font-medium text-emerald-600 hover:text-emerald-800 break-all" href={adminUploadUrl} target="_blank" rel="noreferrer">{adminUploadUrl}</a>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-slate-900">Bài viết Diễn đàn chung</h4>
                      <span className="text-[14px] text-slate-500 font-medium">Quản lý toàn bộ các chủ đề.</span>
                    </div>
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[13px] font-bold">{formatCount(forumPosts.length)} bài</span>
                  </div>
                  <div className="flex flex-col gap-4 p-6 bg-slate-50">
                    {forumPosts.length ? forumPosts.map(post => (
                      <div key={post.id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex-1">
                          <p className="text-[14px] font-bold text-slate-800 mb-2"><strong className="text-lg text-slate-900 block mb-1">{post.title}</strong> Đăng bởi <span className="text-blue-600">{post.author}</span> · Chuyên mục: <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{post.category}</span></p>
                          <div className="text-[14px] text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 line-clamp-3 prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: post.content }}></div>
                        </div>
                        <button className={`${dangerButtonClass} flex-shrink-0 mt-2`} onClick={() => onAdminDeletePost(post)}>Xóa bài viết này</button>
                      </div>
                    )) : <div className="py-10 text-center text-slate-500 font-medium">Không có bài viết diễn đàn nào.</div>}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
    </div>
  )
}

export default ManageView
