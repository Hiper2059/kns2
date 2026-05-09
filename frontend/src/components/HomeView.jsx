import YouTube from 'react-youtube'
import { getYouTubeVideoId } from '../utils/appUtils'
import './HomeView.css'

const HomeView = ({
  searchTerm,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  totalPosts,
  totalCategories,
  topContributors,
  currentUser,
  currentRank,
  currentUserPoints,
  nextRank,
  pointsToNext,
  rankLeaderboard,
  categoryVideos,
  currentRole,
  onDeleteVideo,
  watchedVideosByUser,
  onVideoEnded,
  currentQuiz,
  selectedQuizAnswer,
  onSelectQuizAnswer,
  isCurrentQuizDone,
  onSubmitQuiz,
  quizFeedback,
  newPost,
  onNewPostChange,
  onPostSubmit,
  postsBySelectedCategory,
  onGoForumTab
}) => (
  <div className="home-view">
    <div className="hero-section">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Tìm kiếm kỹ năng, bài viết..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
        />
        <button className="btn-search" onClick={onGoForumTab}>
          Khám phá diễn đàn
        </button>
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <span>Tổng bài viết</span>
          <strong>{totalPosts}</strong>
        </div>
        <div className="kpi-card">
          <span>Danh mục học tập</span>
          <strong>{totalCategories}</strong>
        </div>
        <div className="kpi-card">
          <span>Thành viên nổi bật</span>
          <strong>{topContributors.length ? topContributors[0][0] : 'Chưa có'}</strong>
        </div>
      </div>

      <div className="rank-board">
        <div className="rank-progress-card">
          <h3>Hệ thống rank cá nhân</h3>
          {currentUser ? (
            <>
              <p>
                Cấp hiện tại: <strong>{currentRank.name}</strong> với <strong>{currentUserPoints}</strong> điểm.
              </p>
              <p>
                {nextRank
                  ? `Cần thêm ${pointsToNext} điểm để lên ${nextRank.name}.`
                  : 'Cậu đã chạm cấp cao nhất, quá đỉnh!'}
              </p>
            </>
          ) : (
            <p>Đăng nhập để theo dõi điểm và rank của cậu.</p>
          )}
        </div>

        <div className="rank-progress-card leaderboard-card">
          <h3>Bảng xếp hạng điểm</h3>
          {rankLeaderboard.length ? (
            rankLeaderboard.map(([username, points], idx) => (
              <div key={username} className="leaderboard-row">
                <span>#{idx + 1} {username}</span>
                <strong>{points} điểm</strong>
              </div>
            ))
          ) : (
            <p>Chưa có dữ liệu xếp hạng.</p>
          )}
        </div>
      </div>

      <div className="hero-content">
        <div className="sidebar-categories">
          <h3>Danh mục kỹ năng</h3>
          <ul>
            <li
              onClick={() => onSelectCategory(null)}
              className={selectedCategory === null ? 'active-cat' : ''}
            >
              🌟 Tổng quan
            </li>
            {categories.map((cat, index) => (
              <li
                key={index}
                onClick={() => onSelectCategory(cat)}
                className={selectedCategory === cat ? 'active-cat' : ''}
              >
                {cat} <span>&gt;</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="main-panel">
          {!selectedCategory && (
            <div className="banner">
              <h2>Phát triển bản thân, Kiến tạo tương lai</h2>
              <p>Hệ sinh thái rèn luyện kỹ năng sống dành riêng cho thế hệ trẻ.</p>
              <button className="btn-post banner-cta" onClick={() => onSelectCategory(categories[0])}>
                Bắt đầu học ngay
              </button>
            </div>
          )}

          {selectedCategory && (
            <div className="category-detail">
              <h2 className="cat-title">Học kỹ năng: {selectedCategory}</h2>

              <div className="video-section">
                <h3>Bài giảng video</h3>
                <div className="video-grid">
                  {(categoryVideos[selectedCategory] || []).map((video, index) => (
                    <div key={video._id || `${video.url}-${index}`} className="video-card">
                      <YouTube
                        videoId={getYouTubeVideoId(video.url)}
                        title={`Video bài giảng ${selectedCategory} ${index + 1}`}
                        className="video-frame-wrap"
                        iframeClassName="video-frame"
                        opts={{
                          width: '100%',
                          height: '220',
                          playerVars: { modestbranding: 1, rel: 0 }
                        }}
                        onEnd={() => onVideoEnded(selectedCategory, video.url, index)}
                      />
                      <p className="video-note">
                        {currentUser && watchedVideosByUser[currentUser]?.[`${selectedCategory}-${index}-${video.url}`]
                          ? 'Đã xem hết video này và nhận +10 điểm.'
                          : 'Hệ thống chỉ cộng điểm khi video chạy hết đến cuối (+10 điểm).'}
                      </p>
                      {currentRole === 'admin' && (
                        <button
                          className="btn-danger"
                          onClick={() => onDeleteVideo(video._id)}
                          disabled={!video._id || String(video._id).startsWith('default-')}
                        >
                          Xóa video
                        </button>
                      )}
                    </div>
                  ))}
                  {!(categoryVideos[selectedCategory]) && <p>Chưa có video nào cho mục này.</p>}
                </div>
              </div>

              {currentQuiz && (
                <div className="quiz-card">
                  <h3>Thử thách câu hỏi nhanh (+15 điểm)</h3>
                  <p>{currentQuiz.question}</p>

                  <div className="quiz-options">
                    {currentQuiz.options.map(option => (
                      <label key={option} className="quiz-option-item">
                        <input
                          type="radio"
                          name={`quiz-${currentQuiz.id}`}
                          value={option}
                          checked={selectedQuizAnswer === option}
                          onChange={e => onSelectQuizAnswer(e.target.value)}
                          disabled={isCurrentQuizDone}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>

                  <button className="btn-post" onClick={onSubmitQuiz} disabled={isCurrentQuizDone}>
                    {isCurrentQuizDone ? 'Đã hoàn thành câu hỏi này' : 'Gửi đáp án'}
                  </button>

                  {quizFeedback && <p className="quiz-feedback">{quizFeedback}</p>}
                </div>
              )}

              <div className="article-section">
                <h3>Bài viết và thảo luận</h3>

                <div className="quick-post-box">
                  <input
                    type="text"
                    placeholder="Tiêu đề bài viết..."
                    value={newPost.title}
                    onChange={e => onNewPostChange({ ...newPost, title: e.target.value })}
                  />
                  <textarea
                    placeholder="Viết bài chia sẻ hoặc ghi chép của cậu tại đây..." rows="3"
                    value={newPost.content}
                    onChange={e => onNewPostChange({ ...newPost, content: e.target.value })}
                  ></textarea>
                  <button onClick={() => onPostSubmit(selectedCategory)} className="btn-post">
                    Đăng bài vào {selectedCategory}
                  </button>
                </div>

                <div className="mini-post-list">
                  {postsBySelectedCategory.length ? (
                    postsBySelectedCategory.map(post => (
                      <div key={post.id} className="post-card mini-card">
                        <h4>{post.title}</h4>
                        <p>{post.content}</p>
                        <span className="post-author">Viết bởi: {post.author}</span>
                      </div>
                    ))
                  ) : (
                    <p className="empty-posts">Chưa có bài viết nào trong mục này. Cậu là người mở đầu nhé.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)

export default HomeView
