import { useEffect, useRef } from 'react'
import gsap from 'gsap'
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
  const containerRef = useRef(null)

  useEffect(() => {
    const scope = containerRef.current
    if (!scope || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray('.gsap-animate')
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.06,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform'
        }
      )
    }, scope)

    return () => {
      const items = gsap.utils.toArray('.gsap-animate', scope)
      gsap.killTweensOf(items)
      gsap.set(items, { clearProps: 'opacity,visibility,transform' })
      ctx.revert()
    }
  }, [])

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
    <div ref={containerRef} className="flex min-w-0 flex-col gap-6 w-full mx-auto pb-10">
      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Rank Progress Card */}
        <div className="gsap-animate glass-card min-w-0 p-5 sm:p-8 flex flex-col justify-center bg-white/85 border border-zinc-200 rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <div className="flex min-w-0 flex-wrap items-center gap-4 mb-4">
            <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-zinc-800">Hệ thống Rank</h3>
          </div>

          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100/50">
                <p className="text-base sm:text-lg text-zinc-700 break-words">
                  Cấp hiện tại: <span className="font-extrabold text-teal-700 text-xl">{currentRank.name}</span>
                </p>
                <p className="text-zinc-500 font-medium">Bạn có {currentUserPoints} điểm.</p>
              </div>
              <p className="text-zinc-500 text-sm font-medium pl-1">
                {nextRank
                  ? `🚀 Cần thêm ${pointsToNext} điểm để lên ${nextRank.name}.`
                  : '🏆 Bạn đã đạt cấp bậc cao nhất!'}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50 text-amber-800">
              Vui lòng đăng nhập để theo dõi điểm và rank của bạn.
            </div>
          )}
        </div>

        {/* Leaderboard Card */}
        <div className="gsap-animate glass-card min-w-0 p-5 sm:p-8 flex flex-col bg-white/85 border border-zinc-200 rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <div className="flex min-w-0 flex-wrap items-center gap-4 mb-6">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-zinc-800">Bảng vàng xếp hạng</h3>
          </div>

          <div className="space-y-3 flex-1">
            {rankLeaderboard.length ? (
              rankLeaderboard.map(([username, points], idx) => (
                <div key={username} className="flex min-w-0 flex-col gap-3 p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100 hover:bg-zinc-100/80 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-zinc-300 text-zinc-700' : idx === 2 ? 'bg-amber-600 text-amber-100' : 'bg-zinc-200 text-zinc-600'}`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-zinc-700 break-words">{username}</span>
                  </div>
                  <strong className="text-teal-700 font-bold bg-teal-50 px-3 py-1 rounded-full text-sm">{points} điểm</strong>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl">
                Chưa có dữ liệu xếp hạng.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Section */}
      <div className="gsap-animate glass-card min-w-0 p-5 sm:p-8 bg-white/85 border border-zinc-200 rounded-3xl shadow-xl mt-4">
        <div className="flex min-w-0 flex-wrap items-center gap-4 mb-6">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          <h3 className="text-2xl font-bold text-zinc-800">Video hướng dẫn tiêu biểu</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(categoryVideos[categories[0]] || []).slice(0, 2).map((video, index) => (
            <div key={video._id || `${video.url}-${index}`} className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm hover:shadow-lg transition-[box-shadow,border-color,transform] duration-300">
              <div className="aspect-w-16 aspect-h-9 w-full">
                <iframe
                  src={getVideoEmbedUrl(video.url)}
                  title="Video huong dan"
                  className="w-full h-full object-cover"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              {currentRole === 'admin' && (
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    className="px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white text-sm font-bold rounded-xl backdrop-blur-sm shadow-md"
                    onClick={() => onDeleteVideo(video._id)}
                    disabled={!video._id || String(video._id).startsWith('default-')}
                  >
                    Xóa video
                  </button>
                </div>
              )}
            </div>
          ))}
          {!(categoryVideos[categories[0]] || []).length && (
            <div className="col-span-full p-12 text-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl">
              Chưa có video nào trong danh mục này.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomeView
