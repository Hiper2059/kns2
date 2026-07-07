import React from 'react'
import RichTextEditor from './RichTextEditor'
import SafeRichHtml from './ui/SafeRichHtml'
import { MessageSquare, Heart, AlertTriangle, Send, ChevronLeft, ChevronRight, PenSquare, Hash, UserCircle2, Trash2 } from 'lucide-react'

const ComposeField = ({ label, hint, children, className = '', as = 'label' }) => {
  const FieldTag = as
  return (
    <FieldTag className={`block space-y-1.5 ${className}`}>
      <div className="flex flex-col gap-0.5 mb-2">
        <span className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">{label}</span>
        {hint && <span className="text-[12px] font-medium text-slate-500 leading-snug">{hint}</span>}
      </div>
      {children}
    </FieldTag>
  )
}

const ForumView = ({
  newPost,
  onNewPostChange,
  categories,
  onPostSubmit,
  paginatedForumPosts,
  commentsByPost,
  commentDrafts,
  onCommentDraftChange,
  onAddComment,
  onReportContent,
  onTogglePostReaction,
  searchTerm,
  onSearchChange,
  forumPage,
  forumTotalPages,
  onPageChange,
  filteredForumPosts,
  forumScope,
  forumCourse,
  onOpenProfile,
  currentUser,
  currentRole,
  onAdminDeletePost,
  onUpdatePost,
  onAdminPunishComment
}) => {
  const [isComposerOpen, setIsComposerOpen] = React.useState(false)
  const [editingPostId, setEditingPostId] = React.useState(null)
  const [editDraft, setEditDraft] = React.useState({ title: '', content: '', category: '' })

  const handlePostSubmit = async () => {
    await onPostSubmit();
    setIsComposerOpen(false);
  }

  const startEditPost = post => {
    setEditingPostId(post.id)
    setEditDraft({
      title: post.title || '',
      content: post.content || '',
      category: post.category || ''
    })
  }

  const cancelEditPost = () => {
    setEditingPostId(null)
    setEditDraft({ title: '', content: '', category: '' })
  }

  const saveEditPost = async post => {
    const ok = await onUpdatePost?.(post, editDraft)
    if (ok) {
      cancelEditPost()
    }
  }

  return (
  <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 min-w-0">
    <div className="flex items-center gap-3 mb-8">
      <div className="grid place-items-center w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 shadow-inner">
        <MessageSquare size={24} strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {forumScope === 'course' ? 'Diễn đàn lớp học' : 'Cộng đồng thảo luận'}
        </h2>
        <p className="text-sm font-medium text-slate-500">
          Nơi giao lưu, trao đổi kiến thức và hỗ trợ lẫn nhau.
        </p>
      </div>
    </div>

    <div className="flex flex-col max-w-4xl mx-auto gap-10 items-stretch w-full">
      {/* Dummy Input (Facebook style) */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-[24px] shadow-sm border border-slate-200/60 w-full cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsComposerOpen(true)}>
        <div className="grid place-items-center w-10 h-10 rounded-full bg-slate-100 text-slate-400 overflow-hidden shrink-0">
          <UserCircle2 size={24} />
        </div>
        <div className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full px-4 flex items-center">
          <span className="text-[15px] text-slate-500 font-medium">Bạn đang nghĩ gì thế?</span>
        </div>
      </div>

      {/* Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <div className="w-8"></div>
              <h3 className="text-lg font-black text-slate-900">Tạo chủ đề mới</h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                onClick={() => setIsComposerOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5">
              {forumScope === 'course' && forumCourse && (
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-[13px] font-bold">
                  Đang đăng trong: {forumCourse.title}
                </div>
              )}

              <ComposeField label="Tiêu đề" hint="Tóm tắt ngắn gọn nội dung bạn muốn hỏi hoặc chia sẻ.">
                <input
                  type="text"
                  placeholder="VD: Làm sao để ghi nhớ lâu hơn?"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  value={newPost.title}
                  onChange={e => onNewPostChange({ ...newPost, title: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handlePostSubmit()}
                />
              </ComposeField>

              {forumScope === 'general' && (
                <ComposeField label="Danh mục" hint="Chọn chuyên mục phù hợp để mọi người dễ tìm.">
                  <div className="relative">
                    <select
                      className="w-full h-11 pl-10 pr-4 appearance-none bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                      value={newPost.category}
                      onChange={e => onNewPostChange({ ...newPost, category: e.target.value })}
                    >
                      {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                    </select>
                    <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </ComposeField>
              )}

              <ComposeField label="Nội dung" hint="Miêu tả chi tiết vấn đề của bạn." as="div">
                <div className="rounded-xl overflow-hidden border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all bg-white min-h-[200px] flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <RichTextEditor
                      toolbarId="forum-post-toolbar"
                      value={newPost.content}
                      onChange={value => onNewPostChange({ ...newPost, content: value })}
                      placeholder="Nội dung chi tiết..."
                    />
                  </div>
                </div>
              </ComposeField>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 shrink-0">
              <button
                onClick={handlePostSubmit}
                disabled={forumScope === 'course' && !forumCourse}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-bold shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <Send size={18} />
                <span>Đăng bài thảo luận</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Column */}
      <div className="flex flex-col gap-6 min-w-0">
        <div className="relative">
          <input
            type="text"
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-[15px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            placeholder="Tìm kiếm chủ đề, câu hỏi..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {paginatedForumPosts.length ? (
          <div className="flex flex-col gap-5 min-w-0">
            {paginatedForumPosts.map(post => {
              const canManagePost = currentRole === 'admin' || post.author === currentUser
              const isEditing = editingPostId === post.id
              return (
              <div key={post.id} className="flex flex-col bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Post Header */}
                <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid place-items-center w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex-shrink-0">
                      <UserCircle2 size={24} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <button 
                        className="text-[14px] font-bold text-slate-800 truncate text-left hover:text-blue-600 hover:underline transition-colors"
                        onClick={() => onOpenProfile?.(post.author)}
                      >
                        {post.authorDisplayName || post.author}
                      </button>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wide w-fit mt-0.5">
                        <Hash size={12} />
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors ${post.isHearted ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                      onClick={() => onTogglePostReaction?.(post)}
                      aria-label={post.isHearted ? 'Bỏ tim bài viết' : 'Thả tim bài viết'}
                    >
                      <Heart size={16} className={post.isHearted ? 'fill-current' : ''} />
                      <span>{post.heartCount || 0}</span>
                    </button>
                    {canManagePost && (
                      <>
                        <button
                          className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100"
                          onClick={() => isEditing ? cancelEditPost() : startEditPost(post)}
                          aria-label="Sửa bài viết"
                        >
                          <PenSquare size={16} />
                          <span>{isEditing ? 'Hủy sửa' : 'Sửa'}</span>
                        </button>
                        <button
                          className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors bg-red-50 text-red-600 hover:bg-red-100"
                          onClick={() => onAdminDeletePost?.(post)}
                          aria-label="Xóa bài viết"
                        >
                          <Trash2 size={16} />
                          <span>Xóa bài</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-5">
                  {isEditing ? (
                    <div className="flex flex-col gap-4">
                      <input
                        type="text"
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        value={editDraft.title}
                        onChange={e => setEditDraft(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Tiêu đề bài viết"
                      />
                      {forumScope === 'general' ? (
                        <select
                          className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          value={editDraft.category}
                          onChange={e => setEditDraft(prev => ({ ...prev, category: e.target.value }))}
                        >
                          {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="w-full h-11 px-4 bg-slate-100 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-500"
                          value={editDraft.category}
                          disabled
                        />
                      )}
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <RichTextEditor
                          toolbarId={`forum-edit-toolbar-${post.id}`}
                          value={editDraft.content}
                          onChange={value => setEditDraft(prev => ({ ...prev, content: value }))}
                          placeholder="Nội dung bài viết..."
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="inline-flex cursor-pointer items-center justify-center h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold transition-colors"
                          onClick={cancelEditPost}
                        >
                          Hủy
                        </button>
                        <button
                          className="inline-flex cursor-pointer items-center justify-center h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors"
                          onClick={() => saveEditPost(post)}
                        >
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-xl font-black text-slate-900 mb-3">{post.title}</h4>
                      <SafeRichHtml className="prose prose-slate max-w-none text-[15px] prose-p:leading-relaxed" html={post.content} />
                    </>
                  )}
                </div>

                {/* Comments Section */}
                <div className="p-5 bg-slate-50/50 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-[14px] font-bold text-slate-700">
                      Bình luận ({(commentsByPost[post.id] || []).length})
                    </h5>
                    <button
                      className="inline-flex items-center cursor-pointer gap-1.5 text-[12px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                      onClick={() => onReportContent({ targetType: 'post', targetId: post.id, targetAuthor: post.author, content: `${post.title}. ${post.content}` })}
                    >
                      <AlertTriangle size={14} />
                      <span>Báo cáo</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 mb-4">
                    {(commentsByPost[post.id] || []).length ? (
                      (commentsByPost[post.id] || []).map(comment => (
                        <div key={comment.id} className="group relative flex flex-col gap-1 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                          <div className="flex items-center justify-between">
                            <button 
                              className="text-[13px] font-extrabold text-slate-800 hover:text-blue-600 hover:underline transition-colors text-left"
                              onClick={() => onOpenProfile?.(comment.author)}
                            >
                              {comment.authorDisplayName || comment.author}
                            </button>
                            <button
                              className="opacity-0 cursor-pointer group-hover:opacity-100 inline-flex items-center text-[11px] font-bold text-slate-400 hover:text-red-500 transition-all"
                              onClick={() => onReportContent({ targetType: 'comment', targetId: comment.id, targetAuthor: comment.author, content: comment.text })}
                            >
                              Báo cáo
                            </button>
                            {currentRole === 'admin' && (
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  className="cursor-pointer inline-flex items-center text-[11px] font-bold text-red-500 hover:text-red-700 transition-all"
                                  onClick={() => onAdminPunishComment?.(comment, 'warn')}
                                >
                                  Xóa
                                </button>
                                <button
                                  className="cursor-pointer inline-flex items-center text-[11px] font-bold text-red-500 hover:text-red-700 transition-all"
                                  onClick={() => onAdminPunishComment?.(comment, 'ban')}
                                >
                                  Ban User
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="text-[14px] text-slate-600 leading-snug">{comment.text}</span>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-[13px] font-medium text-slate-400 italic">
                        Chưa có bình luận, bạn hãy mở lời nhé!
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 relative">
                    <input
                      type="text"
                      className="w-full h-11 pl-4 pr-12 bg-white border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                      placeholder="Viết bình luận..."
                      value={commentDrafts[post.id] || ''}
                      onChange={e => onCommentDraftChange(post.id, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') onAddComment(post.id)
                      }}
                    />
                    <button
                      className="absolute right-1 top-1 w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                      onClick={() => onAddComment(post.id)}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-slate-200 border-dashed rounded-[24px]">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
              <MessageSquare size={32} />
            </div>
            <h4 className="text-lg font-bold text-slate-700 mb-1">Không tìm thấy bài viết</h4>
            <p className="text-[14px] text-slate-500 max-w-sm">Thử đổi từ khóa tìm kiếm hoặc trở thành người đầu tiên đăng chủ đề mới nhé.</p>
          </div>
        )}

        {filteredForumPosts.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm cursor-pointer"
              onClick={() => onPageChange(Math.max(1, forumPage - 1))}
              disabled={forumPage <= 1}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-[14px] font-bold text-slate-700">
              Trang {forumPage} / {forumTotalPages}
            </span>
            <button
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm cursor-pointer"
              onClick={() => onPageChange(Math.min(forumTotalPages, forumPage + 1))}
              disabled={forumPage >= forumTotalPages}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
  )
}

export default ForumView
