import { useEffect, useMemo, useRef, useState } from 'react'
import Hls from 'hls.js'
import dashjs from 'dashjs'
import RichTextEditor from './RichTextEditor'
import './LessonFullPage.css'

const loadYouTubeApi = (() => {
  let promise = null
  return () => {
    if (window.YT?.Player) {
      return Promise.resolve(window.YT)
    }

    if (!promise) {
      promise = new Promise((resolve, reject) => {
        const existingCallback = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
          existingCallback?.()
          resolve(window.YT)
        }

        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        script.async = true
        script.onerror = () => reject(new Error('Khong the tai YouTube API.'))
        document.body.appendChild(script)
      })
    }

    return promise
  }
})()

const getYouTubeId = url => {
  if (!url) return ''
  // Remove any query params first
  const cleanUrl = url.split('?')[0]
  
  if (cleanUrl.includes('embed/')) return cleanUrl.split('embed/')[1] || ''
  if (url.includes('watch?v=')) return url.split('watch?v=')[1]?.split('&')[0] || ''
  if (cleanUrl.includes('youtu.be/')) return cleanUrl.split('youtu.be/')[1] || ''
  
  // If URL is just the video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  
  return ''
}

const LessonFullPage = ({
  lesson,
  course,
  lessons,
  courses,
  categories,
  onClose,
  onOpenLesson,
  onSelectCourse,
  onSelectCategory,
  isLoading,
  onCompleteLesson,
  canComplete,
  isCompleted,
  onLessonUpdated,
  api,
  currentUser,
  currentRole
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false)
  const [hasVideoEnded, setHasVideoEnded] = useState(false)
  const [hasSeeked, setHasSeeked] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [youtubeContainerEl, setYoutubeContainerEl] = useState(null)
  const playerRef = useRef(null)
  const videoElRef = useRef(null)
  const contentRef = useRef(null)
  const playbackIntervalRef = useRef(null)
  const lastTimeRef = useRef(0)

  const sortedLessons = [...lessons].sort((a, b) => (a.order || 1) - (b.order || 1))
  const sidebarTitle = 'Muc luc'

  const getVideoEmbedUrl = url => {
    if (!url) return ''
    
    // Already embed URL
    if (url.includes('embed/')) return url
    
    // watch?v= format
    if (url.includes('watch?v=')) {
      const id = url.split('watch?v=')[1]?.split('&')[0]
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    
    // youtu.be short URL
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0]
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    
    // If just video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return `https://www.youtube.com/embed/${url}`
    }
    
    return ''
  }

  const videoId = useMemo(() => getYouTubeId(lesson?.videoUrl), [lesson?.videoUrl])
  const requiresVideo = Boolean(lesson?.videoUrl)
  const isDirectVideo = useMemo(() => {
    const url = lesson?.videoUrl || ''
    if (!url) return false
    return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)
  }, [lesson?.videoUrl])

  const isHls = useMemo(() => {
    const url = lesson?.videoUrl || ''
    return /\.m3u8(\?|$)/i.test(url)
  }, [lesson?.videoUrl])

  const isDash = useMemo(() => {
    const url = lesson?.videoUrl || ''
    return /\.mpd(\?|$)/i.test(url)
  }, [lesson?.videoUrl])

  // Debug logging
  useEffect(() => {
    if (lesson?.videoUrl) {
      console.log('[LessonFullPage] Video URL:', lesson.videoUrl, {
        videoId,
        isDirectVideo,
        isHls,
        isDash,
        embedUrl: getVideoEmbedUrl(lesson.videoUrl)
      })
    }
  }, [lesson?.videoUrl, videoId, isDirectVideo, isHls, isDash])

  useEffect(() => {
    setHasScrolledToEnd(false)
    setHasVideoEnded(false)
    setHasSeeked(false)
    setVideoReady(false)
    lastTimeRef.current = 0
  }, [lesson?._id])

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return
      const rect = contentRef.current.getBoundingClientRect()
      const reachedEnd = rect.bottom <= window.innerHeight + 8
      setHasScrolledToEnd(reachedEnd)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [lesson?.content])

  useEffect(() => {
    if (!videoId || !youtubeContainerEl) {
      console.log('[LessonFullPage] YouTube player setup skipped:', { videoId, hasContainer: !!youtubeContainerEl })
      setVideoReady(false)
      return undefined
    }

    let isMounted = true

    const clearPlaybackInterval = () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
    }

    const startPlaybackInterval = player => {
      clearPlaybackInterval()
      playbackIntervalRef.current = setInterval(() => {
        if (!player?.getCurrentTime) return
        const current = player.getCurrentTime()
        const delta = current - lastTimeRef.current
        if (Math.abs(delta) > 2.5) {
          setHasSeeked(true)
        }
        lastTimeRef.current = current
      }, 1000)
    }

    loadYouTubeApi()
      .then(YT => {
        if (!isMounted || !youtubeContainerEl) return

        console.log('[LessonFullPage] YouTube API loaded, creating player...')
        playerRef.current?.destroy?.()
        playerRef.current = new YT.Player(youtubeContainerEl, {
          videoId,
          playerVars: {
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin
          },
          events: {
            onReady: () => {
              if (!isMounted) return
              console.log('[LessonFullPage] YouTube player ready')
              setVideoReady(true)
              lastTimeRef.current = 0
            },
            onStateChange: event => {
              if (!isMounted) return
              console.log('[LessonFullPage] Player state changed:', event.data)
              if (event.data === YT.PlayerState.ENDED) {
                setHasVideoEnded(true)
                clearPlaybackInterval()
                return
              }
              if (event.data === YT.PlayerState.PLAYING) {
                startPlaybackInterval(event.target)
              } else {
                clearPlaybackInterval()
              }
            }
          }
        })
      })
      .catch(err => {
        console.error('[LessonFullPage] YouTube API error:', err)
        if (isMounted) {
          setVideoReady(false)
        }
      })

    return () => {
      isMounted = false
      clearPlaybackInterval()
      playerRef.current?.destroy?.()
      playerRef.current = null
    }
  }, [videoId, youtubeContainerEl])

  useEffect(() => {
    const video = videoElRef.current
    if (!video) return

    let hls = null
    let dashPlayer = null
    let mounted = true
    lastTimeRef.current = 0

    const handleTimeUpdate = () => {
      const current = video.currentTime || 0
      const delta = current - lastTimeRef.current
      if (Math.abs(delta) > 2.5) {
        setHasSeeked(true)
      }
      lastTimeRef.current = current
    }

    const handleSeeking = () => setHasSeeked(true)
    const handleEnded = () => setHasVideoEnded(true)
    const handleLoaded = () => {
      if (!mounted) return
      setVideoReady(true)
      lastTimeRef.current = 0
      setHasVideoEnded(false)
      setHasSeeked(false)
    }

    const src = lesson?.videoUrl || ''

    if (isHls) {
      if (Hls.isSupported()) {
        hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, handleLoaded)
        hls.on(Hls.Events.ERROR, () => {})
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
        video.addEventListener('loadedmetadata', handleLoaded)
      }
    } else if (isDash) {
      try {
        dashPlayer = dashjs.MediaPlayer().create()
        dashPlayer.initialize(video, src, false)
        // dashjs doesn't expose loadedmetadata event in same way; listen timeupdate
        video.addEventListener('loadedmetadata', handleLoaded)
      } catch (err) {
        console.warn('dash init error', err)
      }
    } else if (isDirectVideo) {
      video.src = src
      video.addEventListener('loadedmetadata', handleLoaded)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('seeking', handleSeeking)
    video.addEventListener('ended', handleEnded)

    return () => {
      mounted = false
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('seeking', handleSeeking)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadedmetadata', handleLoaded)
      if (hls) {
        hls.destroy()
        hls = null
      }
      if (dashPlayer) {
        try { dashPlayer.reset() } catch (err) { console.warn('dash reset error', err) }
        dashPlayer = null
      }
      // clear src for cleanup
      try { video.removeAttribute('src'); video.load() } catch (err) { console.warn('video cleanup error', err) }
    }
  }, [isDirectVideo, isHls, isDash, lesson?._id, lesson?.videoUrl])

  const videoSatisfied =
    !requiresVideo ||
    (videoId && videoReady && hasVideoEnded && !hasSeeked) ||
    (isDirectVideo && videoReady && hasVideoEnded && !hasSeeked)

  const canMarkComplete = canComplete && !isCompleted && hasScrolledToEnd && videoSatisfied
  const canEditLesson = currentRole === 'teacher' || currentRole === 'admin'

  const [editMode, setEditMode] = useState(false)
  const [editDraft, setEditDraft] = useState({
    title: '',
    content: '',
    videoUrl: '',
    imageUrl: '',
    order: 1
  })
  const [isSavingLesson, setIsSavingLesson] = useState(false)

  // Comments state
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!lesson?._id) {
        setComments([])
        return
      }
      try {
        const res = await api.get(`/api/lessons/${lesson._id}/comments`)
        if (!cancelled) setComments(res.data.comments || [])
      } catch (err) {
        console.error('Error loading comments', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [api, lesson?._id])

  useEffect(() => {
    if (!lesson?._id) {
      return
    }
    setEditDraft({
      title: lesson.title || '',
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      imageUrl: lesson.imageUrl || '',
      order: lesson.order || 1
    })
    setEditMode(false)
  }, [lesson?._id, lesson?.title, lesson?.content, lesson?.videoUrl, lesson?.imageUrl, lesson?.order])

  const handleSaveLessonEdit = async () => {
    if (!lesson?._id) {
      return
    }

    if (!editDraft.title.trim()) {
      alert('Cậu điền tiêu đề bài học trước nhé.')
      return
    }

    setIsSavingLesson(true)
    try {
      const payload = {
        title: editDraft.title.trim(),
        content: editDraft.content || '',
        videoUrl: editDraft.videoUrl || '',
        imageUrl: editDraft.imageUrl || '',
        order: editDraft.order
      }
      const response = await api.patch(`/api/lessons/${lesson._id}`, payload)
      const updated = response.data?.lesson || { ...lesson, ...payload }
      onLessonUpdated?.(updated)
      setEditMode(false)
    } catch (err) {
      alert(err?.response?.data?.message || 'Không cập nhật được bài học.')
    } finally {
      setIsSavingLesson(false)
    }
  }

  return (
    <div className="lesson-full-page">
      <aside className="lesson-sidebar">
        <div className="lesson-sidebar-header">
          <h4>{sidebarTitle}</h4>
          <button
            className="lesson-sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            aria-expanded={!isSidebarCollapsed}
            aria-controls="lesson-sidebar-content"
          >
            {isSidebarCollapsed ? 'Mo ra' : 'Thu gon'}
          </button>
        </div>

        {!isSidebarCollapsed && (
          <div id="lesson-sidebar-content" className="lesson-sidebar-content">
            <div className="sidebar-section">
              <h4>Danh muc ky nang</h4>
              <ul>
                {categories.map(category => (
                  <li key={category}>
                    <button className="sidebar-link" onClick={() => onSelectCategory?.(category)}>
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar-section">
              <h4>Lop hoc</h4>
              <ul>
                {courses.map(item => (
                  <li key={item._id}>
                    <button className="sidebar-link" onClick={() => onSelectCourse?.(item)}>
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar-section">
              <h4>Bai hoc</h4>
              <ul>
                {sortedLessons.map(item => (
                  <li key={item._id}>
                    <button
                      className={String(item._id) === String(lesson?._id) ? 'sidebar-link active' : 'sidebar-link'}
                      onClick={() => onOpenLesson?.(item)}
                    >
                      {item.order}. {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </aside>

      <section className="lesson-body">
        <div className="lesson-topbar">
          <div>
            <h2>{course?.title || 'Bai hoc'}</h2>
            <div
              className="rich-text"
              dangerouslySetInnerHTML={{ __html: course?.description || '' }}
            ></div>
          </div>
          <div className="lesson-topbar-actions">
            {canEditLesson && lesson && (
              <button className="btn-ghost" onClick={() => setEditMode(prev => !prev)}>
                {editMode ? 'Dong sua bai' : 'Sua bai hoc'}
              </button>
            )}
            <button className="btn-ghost" onClick={onClose}>Quay lai lop hoc</button>
          </div>
        </div>

        {isLoading && <p>Dang tai bai hoc...</p>}

        {!isLoading && lesson && (
          <div className="lesson-content card-panel">
            {lesson.videoUrl ? (
              <div className="lesson-video">
                {videoId ? (
                  <div className="lesson-video-embed" ref={setYoutubeContainerEl}></div>
                ) : isDirectVideo ? (
                  <div className="lesson-video-embed">
                    <video ref={videoElRef} controls src={lesson.videoUrl} style={{ width: '100%', height: 'auto' }} />
                  </div>
                ) : isHls ? (
                  <div className="lesson-video-embed">
                    <video ref={videoElRef} controls style={{ width: '100%', height: 'auto' }} />
                  </div>
                ) : isDash ? (
                  <div className="lesson-video-embed">
                    <video ref={videoElRef} controls style={{ width: '100%', height: 'auto' }} />
                  </div>
                ) : (
                  <>
                    {getVideoEmbedUrl(lesson.videoUrl) ? (
                      <iframe
                        src={getVideoEmbedUrl(lesson.videoUrl)}
                        title={lesson.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: '100%', height: '600px', minHeight: '400px' }}
                      ></iframe>
                    ) : (
                      <p style={{ color: 'red' }}>
                        Video URL khong hop le: {lesson.videoUrl}
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p>Chua co video cho bai hoc nay.</p>
            )}

            <h3>{lesson.title}</h3>

            {canEditLesson && editMode && (
              <div className="card-panel lesson-edit-panel">
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Tieu de bai hoc"
                    value={editDraft.title}
                    onChange={e => setEditDraft(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Video URL"
                    value={editDraft.videoUrl}
                    onChange={e => setEditDraft(prev => ({ ...prev, videoUrl: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Anh minh hoa (URL - tuy chon)"
                    value={editDraft.imageUrl}
                    onChange={e => setEditDraft(prev => ({ ...prev, imageUrl: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Thu tu bai"
                    value={editDraft.order}
                    onChange={e => setEditDraft(prev => ({ ...prev, order: Number(e.target.value) || 1 }))}
                  />
                  <RichTextEditor
                    toolbarId="lesson-full-editor"
                    value={editDraft.content}
                    onChange={value => setEditDraft(prev => ({ ...prev, content: value }))}
                    placeholder="Nội dung bài học"
                  />
                  <div className="lesson-edit-actions">
                    <button className="btn-post" onClick={handleSaveLessonEdit} disabled={isSavingLesson}>
                      {isSavingLesson ? 'Dang luu...' : 'Luu bai hoc'}
                    </button>
                    <button className="btn-ghost" onClick={() => setEditMode(false)}>
                      Huy
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div
              ref={contentRef}
              className="lesson-text rich-text card-panel"
              dangerouslySetInnerHTML={{ __html: lesson.content || '' }}
            ></div>

            {canComplete && (
              <div className="lesson-complete-block">
                <button
                  className="btn-post"
                  onClick={() => onCompleteLesson?.(lesson._id)}
                  disabled={!canMarkComplete}
                >
                  {isCompleted ? 'Da hoan thanh' : 'Danh dau hoan thanh'}
                </button>
                {!isCompleted && !canMarkComplete && (
                  <p className="completion-hint">
                    {requiresVideo && (!videoId || !videoReady)
                      ? 'Khong the kiem tra video, vui long thu lai.'
                      : requiresVideo && hasSeeked
                        ? 'Vui long xem video tu dau den cuoi, khong tua.'
                        : requiresVideo && !hasVideoEnded
                          ? 'Hay xem het video truoc khi hoan thanh.'
                          : 'Hay cuon het noi dung bai hoc.'}
                  </p>
                )}
              </div>
            )}

            <div className="lesson-comments">
              <h4>Bình luận / Hỏi đáp</h4>
              {comments.length === 0 && <p>Chưa có bình luận nào.</p>}
              {comments.map(c => (
                <div key={c._id} className="comment-item">
                  <div className="comment-meta">
                    <strong>{c.authorName || 'Khách'}</strong>
                    <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                    {(currentRole === 'admin' || currentRole === 'teacher' || c.authorName === currentUser) && (
                      <button
                        className="btn-ghost btn-delete-comment"
                        onClick={async () => {
                          if (!confirm('Xác nhận xóa bình luận này?')) return
                          try {
                            await api.delete(`/api/comments/${c._id}`)
                            setComments(prev => prev.filter(x => x._id !== c._id))
                          } catch (err) {
                            console.error('Delete comment error', err)
                            alert(err?.response?.data?.message || 'Không xóa được bình luận.')
                          }
                        }}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                  <div className="comment-content">{c.content}</div>
                </div>
              ))}

              {currentUser ? (
                <div className="comment-form">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Viết câu hỏi hoặc bình luận..."
                  />
                  <div className="comment-actions">
                    <button
                      className="btn-post"
                      onClick={async () => {
                        if (!newComment.trim()) return
                        setPosting(true)
                        try {
                          const res = await api.post(`/api/lessons/${lesson._id}/comments`, { content: newComment })
                          setNewComment('')
                          setComments(prev => [...prev, res.data.comment])
                        } catch (err) {
                          console.error('Post comment error', err)
                          alert(err?.response?.data?.message || 'Không gửi được bình luận.')
                        } finally {
                          setPosting(false)
                        }
                      }}
                      disabled={posting}
                    >
                      Gửi
                    </button>
                  </div>
                </div>
              ) : (
                <p>Vui lòng đăng nhập để tham gia thảo luận.</p>
              )}
            </div>
          </div>
        )}

        {!isLoading && !lesson && <p>Khong tim thay bai hoc.</p>}
      </section>
    </div>
  )
}

export default LessonFullPage
