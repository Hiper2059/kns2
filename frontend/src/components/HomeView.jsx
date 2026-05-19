import './HomeView.css'

const HomeView = ({
  categories,
  currentUser,
  currentRank,
  currentUserPoints,
  nextRank,
  pointsToNext,
  rankLeaderboard,
  categoryVideos,
  currentRole,
  onDeleteVideo
}) => {
  const getVideoEmbedUrl = url => {
    if (!url) return ''
    if (url.includes('embed/')) return url
    if (url.includes('watch?v=')) {
      const id = url.split('watch?v=')[1]?.split('&')[0]
      return id ? `https://www.youtube.com/embed/${id}` : url
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0]
      return id ? `https://www.youtube.com/embed/${id}` : url
    }
    return url
  }

  return (
  <div className="home-view">
    <div className="hero-section">
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

      <div className="video-section">
        <h3>Video huong dan</h3>
        <div className="video-grid">
          {(categoryVideos[categories[0]] || []).slice(0, 1).map((video, index) => (
            <div key={video._id || `${video.url}-${index}`} className="video-card">
              <div className="video-frame-wrap">
                <iframe
                  src={getVideoEmbedUrl(video.url)}
                  title="Video huong dan"
                  className="video-frame"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
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
          {!(categoryVideos[categories[0]] || []).length && <p>Chưa có video nào.</p>}
        </div>
      </div>
    </div>
  </div>
  )
}

export default HomeView
