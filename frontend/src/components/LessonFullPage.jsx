import { useEffect, useMemo, useRef, useState } from 'react'
import Hls from 'hls.js'
import dashjs from 'dashjs'
import RichTextEditor from './RichTextEditor'
import { getApiErrorMessage } from '../utils/apiMessages'
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
        script.onerror = () => reject(new Error('Không thể tải YouTube API.'))
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
  onClose,
  onOpenLesson,
  isLoading,
  onCompleteLesson,
  canComplete,
  isCompleted,
  onLessonUpdated,
  api,
  currentUser,
  currentRole,
  onReportContent
}) => {
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
  const currentLessonId = String(lesson?._id || '')

  const handleLessonSelect = event => {
    const nextLesson = sortedLessons.find(item => String(item._id) === event.target.value)
    if (nextLesson) {
      onOpenLesson?.(nextLesson)
    }
  }

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
              setVideoReady(true)
              lastTimeRef.current = 0
            },
            onStateChange: event => {
              if (!isMounted) return
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
  const [lessonHeart, setLessonHeart] = useState({ count: 0, isHearted: false })

  // Comments state
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)

  const commentsTree = useMemo(() => {
    const roots = []
    const childrenByParent = new Map()

    comments.forEach(comment => {
      const parentKey = comment.parentComment ? String(comment.parentComment) : ''
      if (!parentKey) {
        roots.push(comment)
        return
      }

      if (!childrenByParent.has(parentKey)) {
        childrenByParent.set(parentKey, [])
      }

      childrenByParent.get(parentKey).push(comment)
    })

    const attachReplies = comment => ({
      ...comment,
      replies: (childrenByParent.get(String(comment._id)) || [])
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map(attachReplies)
    })

    return roots
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(attachReplies)
  }, [comments])

  const removeCommentBranch = commentId => {
    const targetId = String(commentId)
    setComments(prev => prev.filter(item => String(item._id) !== targetId && String(item.parentComment || '') !== targetId))
  }

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

  useEffect(() => {
    setLessonHeart({
      count: lesson?.heartCount || 0,
      isHearted: Boolean(lesson?.isHearted)
    })
  }, [lesson?._id, lesson?.heartCount, lesson?.isHearted])

  const handleToggleHeart = async () => {
    if (!currentUser) {
      alert('Cậu cần đăng nhập để thả tim.')
      return
    }

    if (!lesson?._id) {
      return
    }

    try {
      const response = await api.patch(`/api/lessons/${lesson._id}/reaction`)
      setLessonHeart({
        count: response.data?.heartCount || 0,
        isHearted: Boolean(response.data?.isHearted)
      })
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thả tim được.'))
    }
  }

  const handleSubmitComment = async parentCommentId => {
    const text = parentCommentId ? (replyDrafts[parentCommentId] || '').trim() : newComment.trim()
    if (!text) {
      return
    }

    setPosting(true)
    try {
      const payload = { content: text }
      if (parentCommentId) {
        payload.parentCommentId = parentCommentId
      }

      const res = await api.post(`/api/lessons/${lesson._id}/comments`, payload)
      setComments(prev => [...prev, res.data.comment])

      if (parentCommentId) {
        setReplyDrafts(prev => ({ ...prev, [parentCommentId]: '' }))
        setReplyingTo(null)
      } else {
        setNewComment('')
      }
    } catch (err) {
      console.error('Post comment error', err)
      alert(getApiErrorMessage(err, 'Không gửi được bình luận.'))
    } finally {
      setPosting(false)
    }
  }

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
      alert(getApiErrorMessage(err, 'Không cập nhật được bài học.'))
    } finally {
      setIsSavingLesson(false)
    }
  }

  return (
    <div className="lesson-full-page">
      <aside className="lesson-sidebar">
        <div className="lesson-sidebar-header">
          <h4>Mục lục bài học</h4>
        </div>

        <div className="lesson-combobox">
          <label htmlFor="lesson-selector">Bài học</label>
          <select
            id="lesson-selector"
            value={currentLessonId}
            onChange={handleLessonSelect}
            disabled={!sortedLessons.length}
          >
            {!sortedLessons.length && <option value="">Chưa có bài học</option>}
            {sortedLessons.map(item => (
              <option key={item._id} value={String(item._id)}>
                {item.order}. {item.title}
              </option>
            ))}
          </select>
        </div>
      </aside>

      <section className="lesson-body">
        <div className="lesson-topbar">
          <div>
            <h2>{course?.title || 'Bài học'}</h2>
            <div
              className="rich-text"
              dangerouslySetInnerHTML={{ __html: course?.description || '' }}
            ></div>
          </div>
          <div className="lesson-topbar-actions">
            <button
              className={lessonHeart.isHearted ? 'btn-heart active' : 'btn-heart'}
              onClick={handleToggleHeart}
            >
              ❤ {lessonHeart.count}
            </button>
            {canEditLesson && lesson && (
              <button className="btn-ghost" onClick={() => setEditMode(prev => !prev)}>
                {editMode ? 'Đóng sửa bài' : 'Sửa bài học'}
              </button>
            )}
            <button className="btn-ghost" onClick={onClose}>Quay lại trang khóa học</button>
          </div>
        </div>

        {isLoading && <p>Đang tải bài học...</p>}

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
                        Video URL không hợp lệ: {lesson.videoUrl}
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p>Chưa có video cho bài học này.</p>
            )}

            <h3>{lesson.title}</h3>

            {canEditLesson && editMode && (
              <div className="card-panel lesson-edit-panel">
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Tiêu đề bài học"
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
                    placeholder="Ảnh minh họa (URL - tùy chọn)"
                    value={editDraft.imageUrl}
                    onChange={e => setEditDraft(prev => ({ ...prev, imageUrl: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Thứ tự bài"
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
                      {isSavingLesson ? 'Đang lưu...' : 'Lưu bài học'}
                    </button>
                    <button className="btn-ghost" onClick={() => setEditMode(false)}>
                      Hủy
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
                  {isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                </button>
                {!isCompleted && !canMarkComplete && (
                  <p className="completion-hint">
                    {requiresVideo && (!videoId || !videoReady)
                      ? 'Không thể kiểm tra video, vui lòng thử lại.'
                      : requiresVideo && hasSeeked
                        ? 'Vui lòng xem video từ đầu đến cuối, không tua.'
                        : requiresVideo && !hasVideoEnded
                          ? 'Hãy xem hết video trước khi hoàn thành.'
                          : 'Hãy cuộn hết nội dung bài học.'}
                  </p>
                )}
              </div>
            )}

            <div className="lesson-comments">
              <h4>Bình luận / Hỏi đáp</h4>
              {commentsTree.length === 0 && <p>Chưa có bình luận nào.</p>}

              {commentsTree.map(comment => {
                const renderComment = (item, depth = 0) => {
                  const canManage = currentRole === 'admin' || currentRole === 'teacher' || item.authorName === currentUser
                  const isReplyOpen = replyingTo === item._id
                  const replyValue = replyDrafts[item._id] || ''

                  return (
                    <div key={item._id} className={`comment-item ${depth > 0 ? 'is-reply' : ''}`}>
                      <div className="comment-meta">
                        <strong>{item.authorName || 'Khách'}</strong>
                        <span className="comment-time">{new Date(item.createdAt).toLocaleString()}</span>
                        {currentUser && (
                          <button
                            className="btn-ghost btn-reply-comment"
                            onClick={() => {
                              setReplyingTo(prev => (prev === item._id ? null : item._id))
                              setReplyDrafts(prev => ({ ...prev, [item._id]: prev[item._id] || '' }))
                            }}
                          >
                            Trả lời
                          </button>
                        )}
                        {currentUser && onReportContent && (
                          <button
                            className="btn-ghost btn-report-comment"
                            onClick={() =>
                              onReportContent({
                                targetType: 'lesson_comment',
                                targetId: item._id,
                                targetAuthor: item.authorName,
                                content: item.content
                              })
                            }
                          >
                            Báo cáo
                          </button>
                        )}
                        {canManage && (
                          <button
                            className="btn-ghost btn-delete-comment"
                            onClick={async () => {
                              if (!confirm('Xác nhận xóa bình luận này?')) return
                              try {
                                await api.delete(`/api/comments/${item._id}`)
                                removeCommentBranch(item._id)
                              } catch (err) {
                                console.error('Delete comment error', err)
                                alert(getApiErrorMessage(err, 'Không xóa được bình luận.'))
                              }
                            }}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                      <div className="comment-content">{item.content}</div>

                      {isReplyOpen && (
                        <div className="comment-reply-box">
                          <textarea
                            value={replyValue}
                            onChange={e => setReplyDrafts(prev => ({ ...prev, [item._id]: e.target.value }))}
                            placeholder="Viết trả lời..."
                          />
                          <div className="comment-actions">
                            <button className="btn-post" onClick={() => handleSubmitComment(item._id)} disabled={posting}>
                              Gửi trả lời
                            </button>
                            <button className="btn-ghost" onClick={() => setReplyingTo(null)}>
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}

                      {Array.isArray(item.replies) && item.replies.length > 0 && (
                        <div className="comment-replies">
                          {item.replies.map(reply => renderComment(reply, depth + 1))}
                        </div>
                      )}
                    </div>
                  )
                }

                return renderComment(comment)
              })}

              {currentUser ? (
                <div className="comment-form">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Viết câu hỏi hoặc bình luận..."
                  />
                  <div className="comment-actions">
                    <button className="btn-post" onClick={() => handleSubmitComment(null)} disabled={posting}>
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

        {!isLoading && !lesson && <p>Không tìm thấy bài học.</p>}
      </section>
    </div>
  )
}

export default LessonFullPage
