import RichTextEditor from './RichTextEditor'
import './ForumView.css'

const ComposeField = ({ label, hint, children, className = '', as = 'label' }) => {
  const FieldTag = as

  return (
  <FieldTag className={`compose-field${className ? ` ${className}` : ''}`}>
    <div className="compose-field-copy">
      <span className="compose-label">{label}</span>
      {hint && <span className="compose-hint">{hint}</span>}
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
  <div className="forum-view">
    <div className="forum-layout">
      <div className="create-post-box forum-composer card-panel">
        <div className="composer-header">
          <div>
            <span className="composer-kicker">
              {forumScope === 'course' ? 'Diễn đàn lớp' : 'Diễn đàn chung'}
            </span>
            <h3>Viết bài mới</h3>
            <p>Đặt câu hỏi, chia sẻ tiến độ hoặc mở thảo luận cho lớp.</p>
          </div>
          {forumScope === 'course' && forumCourse && (
            <span className="composer-privacy">Lớp: {forumCourse.title}</span>
          )}
        </div>

        {forumScope === 'course' && forumCourse && (
          <div className="composer-section forum-course-context">
            <div className="forum-course-label">
              Bài viết chỉ hiển thị trong lớp {forumCourse.title}.
            </div>
          </div>
        )}

        <div className="composer-section">
          <div className="compose-field-copy">
            <span className="compose-label">Nơi đăng</span>
            <span className="compose-hint">
              {forumScope === 'course'
                ? 'Bài viết sẽ đăng trong diễn đàn của lớp đang mở.'
                : 'Bài viết sẽ đăng công khai trong diễn đàn chung.'}
            </span>
          </div>
        </div>

        <div className="composer-section">
          <ComposeField
            label="Tiêu đề"
            hint="Nêu rõ câu hỏi hoặc chủ đề để người khác hiểu nhanh."
          >
            <input
              type="text"
              placeholder="Ví dụ: Cách giữ thăng bằng khi xoay hông?"
              value={newPost.title}
              onChange={e => onNewPostChange({ ...newPost, title: e.target.value })}
              aria-label="Tiêu đề bài viết"
            />
          </ComposeField>

          {forumScope === 'general' && (
            <ComposeField label="Chủ đề" hint="Giúp bài viết xuất hiện đúng khu vực thảo luận.">
              <select
                value={newPost.category}
                onChange={e => onNewPostChange({ ...newPost, category: e.target.value })}
                aria-label="Chủ đề bài viết"
              >
                {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
              </select>
            </ComposeField>
          )}
        </div>

        <div className="composer-section composer-section-editor">
          <ComposeField
            label="Nội dung"
            hint="Viết đủ bối cảnh, điều đã thử, ảnh hoặc video nếu cần."
            className="compose-field-editor"
            as="div"
          >
            <RichTextEditor
              toolbarId="forum-post-toolbar"
              value={newPost.content}
              onChange={value => onNewPostChange({ ...newPost, content: value })}
              placeholder="Nội dung bạn muốn chia sẻ..."
            />
          </ComposeField>
        </div>

        <div className="composer-actions">
          <p className="composer-note">
            {forumScope === 'course' ? 'Đăng trong diễn đàn lớp đã chọn.' : 'Đăng công khai trong diễn đàn chung.'}
          </p>
          <button
            onClick={() => onPostSubmit()}
            className="btn-post"
            disabled={forumScope === 'course' && !forumCourse}
          >
            Đăng bài
          </button>
        </div>
      </div>

      <div className="post-list">
        <div className="forum-head">
          <h3>Tất cả chủ đề</h3>
          <input
            type="text"
            className="forum-filter"
            placeholder="Lọc theo từ khóa..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        {paginatedForumPosts.length ? (
          paginatedForumPosts.map(post => (
            <div key={post.id} className="post-card card-panel">
              <div className="post-header">
                <span className="post-category">{post.category}</span>
                <span className="post-author">Bởi: {post.author}</span>
              </div>
              <div className="post-reactions">
                <button
                  className={post.isHearted ? 'btn-heart active' : 'btn-heart'}
                  onClick={() => onTogglePostReaction?.(post)}
                  aria-label={post.isHearted ? 'Bỏ tim bài viết' : 'Thả tim bài viết'}
                >
                  <span aria-hidden="true">♥</span> {post.heartCount || 0}
                </button>
              </div>
              <h4>{post.title}</h4>
              <div className="rich-text" dangerouslySetInnerHTML={{ __html: post.content }}></div>
              <button
                className="btn-report"
                onClick={() =>
                  onReportContent({
                    targetType: 'post',
                    targetId: post.id,
                    targetAuthor: post.author,
                    content: `${post.title}. ${post.content}`
                  })
                }
              >
                Báo cáo bài viết
              </button>

              <div className="comment-block">
                <h5>Bình luận ({(commentsByPost[post.id] || []).length})</h5>
                <div className="comment-list">
                  {(commentsByPost[post.id] || []).length ? (
                    (commentsByPost[post.id] || []).map(comment => (
                      <div key={comment.id} className="comment-item">
                        <strong>{comment.author}:</strong> <span>{comment.text}</span>
                        <button
                          className="btn-report"
                          onClick={() =>
                            onReportContent({
                              targetType: 'comment',
                              targetId: comment.id,
                              targetAuthor: comment.author,
                              content: comment.text
                            })
                          }
                        >
                          Báo cáo
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="empty-comment">Chưa có bình luận, bạn mở màn nhé.</p>
                  )}
                </div>

                <div className="comment-form">
                  <input
                    type="text"
                    placeholder="Viết bình luận của bạn..."
                    value={commentDrafts[post.id] || ''}
                    onChange={e => onCommentDraftChange(post.id, e.target.value)}
                  />
                  <button className="btn-post" onClick={() => onAddComment(post.id)}>
                    Bình luận
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="post-card empty-state card-panel">
            <h4>Không tìm thấy bài viết phù hợp</h4>
            <p>Thử đổi từ khóa tìm kiếm hoặc đăng một chủ đề mới nhé.</p>
          </div>
        )}

        {filteredForumPosts.length > 0 && (
          <div className="forum-pagination">
            <button
              className="btn-login"
              onClick={() => onPageChange(Math.max(1, forumPage - 1))}
              disabled={forumPage <= 1}
            >
              Trang trước
            </button>
            <span>Trang {forumPage}/{forumTotalPages}</span>
            <button
              className="btn-login"
              onClick={() => onPageChange(Math.min(forumTotalPages, forumPage + 1))}
              disabled={forumPage >= forumTotalPages}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)

export default ForumView
