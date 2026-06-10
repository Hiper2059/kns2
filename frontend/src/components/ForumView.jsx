import React from 'react'
import RichTextEditor from './RichTextEditor'
import { MessageSquare, Heart, AlertTriangle, Send, ChevronLeft, ChevronRight, PenSquare, Hash, UserCircle2 } from 'lucide-react'

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
  forumCourse
}) => (
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
      {/* Composer Column */}
      <div className="flex flex-col gap-6 p-6 md:p-8 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-orange-100 text-orange-600">
            <PenSquare size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800">Tạo chủ đề mới</h3>
            {forumScope === 'course' && forumCourse && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold tracking-wide">
                Trong: {forumCourse.title}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <ComposeField
            label="Tiêu đề"
            hint="Tóm tắt ngắn gọn nội dung bạn muốn hỏi hoặc chia sẻ."
          >
            <input
              type="text"
              placeholder="VD: Làm sao để ghi nhớ lâu hơn?"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              value={newPost.title}
              onChange={e => onNewPostChange({ ...newPost, title: e.target.value })}
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

          <ComposeField
            label="Nội dung"
            hint="Miêu tả chi tiết vấn đề của bạn."
            as="div"
          >
            <div className="rounded-xl overflow-hidden border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all bg-white">
              <RichTextEditor
                toolbarId="forum-post-toolbar"
                value={newPost.content}
                onChange={value => onNewPostChange({ ...newPost, content: value })}
                placeholder="Nội dung chi tiết..."
              />
            </div>
          </ComposeField>
        </div>

        <button
          onClick={() => onPostSubmit()}
          disabled={forumScope === 'course' && !forumCourse}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-bold shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <Send size={18} />
          <span>Đăng bài thảo luận</span>
        </button>
      </div>

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
            {paginatedForumPosts.map(post => (
              <div key={post.id} className="flex flex-col bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Post Header */}
                <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid place-items-center w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex-shrink-0">
                      <UserCircle2 size={24} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] font-bold text-slate-800 truncate">{post.author}</span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wide w-fit mt-0.5">
                        <Hash size={12} />
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <button
                    className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors ${post.isHearted ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                    onClick={() => onTogglePostReaction?.(post)}
                    aria-label={post.isHearted ? 'Bỏ tim bài viết' : 'Thả tim bài viết'}
                  >
                    <Heart size={16} className={post.isHearted ? 'fill-current' : ''} />
                    <span>{post.heartCount || 0}</span>
                  </button>
                </div>

                {/* Post Content */}
                <div className="p-5">
                  <h4 className="text-xl font-black text-slate-900 mb-3">{post.title}</h4>
                  <div className="prose prose-slate max-w-none text-[15px] prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }}></div>
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
                            <strong className="text-[13px] font-extrabold text-slate-800">{comment.author}</strong>
                            <button
                              className="opacity-0 cursor-pointer group-hover:opacity-100 inline-flex items-center text-[11px] font-bold text-slate-400 hover:text-red-500 transition-all"
                              onClick={() => onReportContent({ targetType: 'comment', targetId: comment.id, targetAuthor: comment.author, content: comment.text })}
                            >
                              Báo cáo
                            </button>
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
            ))}
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

export default ForumView
