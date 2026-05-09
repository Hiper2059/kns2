import './ForumView.css'

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
  searchTerm,
  onSearchChange,
  forumPage,
  forumTotalPages,
  onPageChange,
  filteredForumPosts
}) => (
  <div className="forum-view">
    <div className="forum-layout">
      <div className="create-post-box">
        <h3>Tạo bài viết mới</h3>
        <input
          type="text"
          placeholder="Tiêu đề bài viết..."
          value={newPost.title}
          onChange={e => onNewPostChange({ ...newPost, title: e.target.value })}
        />
        <select
          value={newPost.category}
          onChange={e => onNewPostChange({ ...newPost, category: e.target.value })}
        >
          {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
        </select>
        <textarea
          placeholder="Nội dung bạn muốn chia sẻ..." rows="4"
          value={newPost.content}
          onChange={e => onNewPostChange({ ...newPost, content: e.target.value })}
        ></textarea>
        <button onClick={() => onPostSubmit()} className="btn-post">Đăng bài</button>
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
            <div key={post.id} className="post-card">
              <div className="post-header">
                <span className="post-category">{post.category}</span>
                <span className="post-author">Bởi: {post.author}</span>
              </div>
              <h4>{post.title}</h4>
              <p>{post.content}</p>
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
                    <p className="empty-comment">Chưa có bình luận, cậu mở màn nhé.</p>
                  )}
                </div>

                <div className="comment-form">
                  <input
                    type="text"
                    placeholder="Viết bình luận của cậu..."
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
          <div className="post-card empty-state">
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
