import './ManageView.css'

const ManageView = ({
  isLoadingUsers,
  isLoadingReports,
  isLoadingDeletedPosts,
  isLoadingDeletedComments,
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
  onPermanentDeleteComment
}) => (
  <div className="forum-view">
    <div className="management-board">
      <div className="forum-head">
        <h3>Quản lý người dùng</h3>
        <div className="management-actions">
          <button className="btn-post" onClick={onFetchUsers} disabled={isLoadingUsers}>
            {isLoadingUsers ? 'Đang tải...' : 'Tải lại user'}
          </button>
          <button className="btn-post" onClick={onFetchReports} disabled={isLoadingReports}>
            {isLoadingReports ? 'Đang tải...' : 'Tải lại report'}
          </button>
          <button className="btn-post" onClick={onFetchDeletedPosts} disabled={isLoadingDeletedPosts}>
            {isLoadingDeletedPosts ? 'Đang tải...' : 'Tải lại bài ẩn'}
          </button>
          <button className="btn-post" onClick={onFetchDeletedComments} disabled={isLoadingDeletedComments}>
            {isLoadingDeletedComments ? 'Đang tải...' : 'Tải lại bình luận ẩn'}
          </button>
        </div>
      </div>

      <div className="management-card">
        <h4>Lọc nội dung bị ẩn theo lý do</h4>
        <div className="management-actions">
          <select value={deletedReasonFilter} onChange={e => onReasonChange(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="ai_moderation">AI kiểm duyệt</option>
            <option value="manual_delete">Xóa thủ công</option>
            <option value="post_deleted">Bị ẩn theo bài viết</option>
          </select>
        </div>
      </div>

      <div className="management-card">
        <h4>Tạo tài khoản mới</h4>
        <div className="video-admin-form">
          <input
            type="text"
            placeholder="Username"
            value={newUserData.username}
            onChange={e => onNewUserDataChange({ ...newUserData, username: e.target.value })}
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
            <option value="student">student</option>
            <option value="teacher">teacher</option>
            <option value="admin">admin</option>
          </select>
          <button className="btn-post" onClick={onCreateUser}>Tạo tài khoản</button>
        </div>
        <p className="helper-text">
          Tạo tài khoản giáo viên xong, vào tab "Giảng viên" để thêm lớp học, bài học và video.
        </p>
      </div>

      <div className="management-card">
        <h4>Admin thêm video YouTube theo danh mục</h4>
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
            placeholder="Dán link YouTube (watch, youtu.be, hoặc embed)"
            value={newVideoData.url}
            onChange={e => onVideoDataChange({ ...newVideoData, url: e.target.value })}
          />
          <button className="btn-post" onClick={onAddVideo}>Thêm video</button>
        </div>
      </div>

      <div className="management-list">
        {managedUsers.length ? (
          managedUsers.map(user => (
            <div key={user.username} className="management-item">
              <div>
                <strong>{user.username}</strong>
                <p>Vai trò hiện tại: {user.role}</p>
                <p>Trạng thái: {user.status || 'active'}</p>
                <p>Số lỗi bị bắt: {user.violationCount || 0}</p>
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
            <h4>Chưa có dữ liệu user</h4>
            <p>Đăng nhập bằng tài khoản admin để tải danh sách.</p>
          </div>
        )}
      </div>

      <div className="management-card">
        <h4>Lịch sử AI kiểm duyệt report</h4>
        <div className="management-actions">
          <button
            className="btn-danger"
            onClick={onClearModerationReports}
            disabled={!moderationReports.length}
          >
            Xóa toàn bộ lịch sử
          </button>
        </div>
        {moderationReports.length ? (
          <div className="report-list">
            {moderationReports.map(report => (
              <div key={report._id} className="report-item">
                <p>
                  <strong>{report.targetType}</strong> · {report.targetAuthor || 'Không rõ tác giả'} · {report.decision}
                </p>
                <p>Nội dung: {report.content}</p>
                <p>Lý do: {report.reason || 'Không có'}</p>
                <button className="btn-danger" onClick={() => onDeleteModerationReport(report._id)}>
                  Xóa report này
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>Chưa có report nào.</p>
        )}
      </div>

      <div className="management-card">
        <h4>Xóa nhanh bài viết đang hiển thị</h4>
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

      <div className="management-card">
        <h4>Bài viết đã bị ẩn (soft-delete)</h4>
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

      <div className="management-card">
        <h4>Bình luận đã bị ẩn (soft-delete)</h4>
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
    </div>
  </div>
)

export default ManageView
