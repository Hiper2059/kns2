import { useEffect, useMemo, useRef, useState } from 'react'
import Hls from 'hls.js'
import dashjs from 'dashjs'
import RichTextEditor from './RichTextEditor'
import LessonVideoUploadButton from './LessonVideoUploadButton'
import { getApiErrorMessage } from '../utils/apiMessages'
import { getPlayableCloudinaryVideoUrl, transformHtmlVideoUrls } from '../utils/cloudinaryVideo'
import { useUI } from '../context/UIContext'
import { ArrowLeft, Heart, Edit3, CheckCircle2, AlertCircle, MessageSquare, Reply, Flag, Trash2, ListVideo } from 'lucide-react'

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

const baseInputClass = "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
const baseButtonClass = "inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] cursor-pointer"
const ghostButtonClass = "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer text-[13px]"
const dangerButtonClass = "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all cursor-pointer text-[13px]"
const createEmptyQuizQuestion = () => ({ question: '', options: ['', '', '', ''], correctOptionIndex: 0 })

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
  onUploadLessonVideoFile,
  api,
  currentUser,
  currentRole,
  onReportContent,
  onOpenProfile,
  assignments,
  newAssignmentData,
  onNewAssignmentDataChange,
  onCreateAssignment,
  editAssignmentId,
  editAssignmentData,
  onEditAssignmentStart,
  onEditAssignmentChange,
  onEditAssignmentCancel,
  onUpdateAssignment,
  onDeleteAssignment,
  assignmentSubmissions,
  onLoadAssignmentSubmissions,
  onGradeSubmission,
  assignmentDrafts,
  onAssignmentDraftChange,
  onSubmitAssignment,
  onSubmitQuizAssignment
}) => {
  const { showWarning, showError, showSuccess } = useUI()
  const [quizDrafts, setQuizDrafts] = useState({})
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false)
  const [hasVideoEnded, setHasVideoEnded] = useState(false)
  const [hasSeeked, setHasSeeked] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [youtubeContainerEl, setYoutubeContainerEl] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isUploadingLessonVideo, setIsUploadingLessonVideo] = useState(false)
  const [videoPlaybackError, setVideoPlaybackError] = useState('')
  const playerRef = useRef(null)
  const videoElRef = useRef(null)
  const contentRef = useRef(null)
  const playbackIntervalRef = useRef(null)
  const lastTimeRef = useRef(0)

  const sortedLessons = [...lessons].sort((a, b) => (a.order || 1) - (b.order || 1))
  const currentLessonId = String(lesson?._id || '')

  const handleLessonSelect = (lessonId) => {
    const nextLesson = sortedLessons.find(item => String(item._id) === lessonId)
    if (nextLesson) {
      onOpenLesson?.(nextLesson)
      if (window.innerWidth < 1024) setIsSidebarOpen(false)
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
  const playbackVideoUrl = useMemo(
    () => getPlayableCloudinaryVideoUrl(lesson?.videoUrl),
    [lesson?.videoUrl]
  )
  const isDirectVideo = useMemo(() => {
    const url = playbackVideoUrl
    if (!url) return false
    return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url) || url.includes('res.cloudinary.com/')
  }, [playbackVideoUrl])

  const isHls = useMemo(() => {
    const url = lesson?.videoUrl || ''
    return /\.m3u8(\?|$)/i.test(url)
  }, [lesson?.videoUrl])

  const isDash = useMemo(() => {
    const url = lesson?.videoUrl || ''
    return /\.mpd(\?|$)/i.test(url)
  }, [lesson?.videoUrl])

  const lessonAssignments = useMemo(() => {
    return Array.isArray(assignments) ? assignments.filter(a => String(a.lesson || a.lessonId) === String(lesson?._id)) : []
  }, [assignments, lesson?._id])

  const handleQuizAnswer = (assignmentId, questionIndex, optionIndex) => {
    setQuizDrafts(prev => {
      const nextAnswers = [...(prev[assignmentId] || [])]
      nextAnswers[questionIndex] = optionIndex
      return { ...prev, [assignmentId]: nextAnswers }
    })
  }

  const handleSubmitQuiz = async assignment => {
    const answers = quizDrafts[assignment._id] || []
    const questions = Array.isArray(assignment.questions) ? assignment.questions : []
    const hasMissingAnswer = questions.some((question, index) => {
      const answer = answers[index]
      return !Number.isInteger(answer) || answer < 0 || answer >= (question.options || []).length
    })

    if (hasMissingAnswer) {
      showWarning('Cậu trả lời hết các câu trước khi nộp nhé.')
      return
    }

    const ok = await onSubmitQuizAssignment?.(assignment._id, answers)
    if (ok) {
      setQuizDrafts(prev => {
        const next = { ...prev }
        delete next[assignment._id]
        return next
      })
    }
  }

  const getNewQuizQuestions = () => {
    const questions = Array.isArray(newAssignmentData?.questions) && newAssignmentData.questions.length
      ? newAssignmentData.questions
      : [createEmptyQuizQuestion()]

    return questions.map(question => ({
      question: question.question || '',
      options: [...(question.options || []), '', '', '', ''].slice(0, 4),
      correctOptionIndex: Number(question.correctOptionIndex) || 0
    }))
  }

  const updateNewQuizQuestion = (questionIndex, nextQuestion) => {
    const questions = getNewQuizQuestions()
    questions[questionIndex] = nextQuestion
    onNewAssignmentDataChange?.({ ...newAssignmentData, questions })
  }

  const addNewQuizQuestion = () => {
    onNewAssignmentDataChange?.({
      ...newAssignmentData,
      questions: [...getNewQuizQuestions(), createEmptyQuizQuestion()]
    })
  }

  const removeNewQuizQuestion = questionIndex => {
    const questions = getNewQuizQuestions().filter((_, index) => index !== questionIndex)
    onNewAssignmentDataChange?.({
      ...newAssignmentData,
      questions: questions.length ? questions : [createEmptyQuizQuestion()]
    })
  }

  const handleCreateLessonQuiz = () => {
    const title = String(newAssignmentData?.title || '').trim()
    const type = newAssignmentData?.type || 'quiz'
    if (!title) {
      showWarning('Vui lòng nhập tiêu đề bài tập!')
      return
    }

    if (type === 'quiz') {
      const questions = getNewQuizQuestions()
        .map(item => {
          const options = (item.options || []).map(option => String(option || '').trim()).filter(Boolean)
          return {
            question: String(item.question || '').trim(),
            options,
            correctOptionIndex: Math.min(Number(item.correctOptionIndex) || 0, Math.max(options.length - 1, 0))
          }
        })
        .filter(item => item.question && item.options.length >= 2)

      if (!questions.length) {
        showWarning('Quiz cần ít nhất 1 câu hỏi và mỗi câu có tối thiểu 2 đáp án.')
        return
      }

      onCreateAssignment?.({
        courseId: course?._id,
        lessonId: lesson?._id,
        title,
        description: newAssignmentData?.description || '',
        type,
        questions
      })
    } else {
      onCreateAssignment?.({
        courseId: course?._id,
        lessonId: lesson?._id,
        title,
        description: newAssignmentData?.description || '',
        type,
        questions: []
      })
    }
  }

  const renderAssignmentBody = assignment => {
    const isQuiz = assignment.type === 'quiz'
    const questions = Array.isArray(assignment.questions) ? assignment.questions : []
    const draftAnswers = quizDrafts[assignment._id] || []
    const isTeacherOrAdmin = currentRole === 'teacher' || currentRole === 'admin'
    const answerLabel = index => String.fromCharCode(65 + index)
    const myAnswers = assignment.mySubmission?.answers || []

    if (!isQuiz || !questions.length) {
      return null
    }

    return (
      <div className="flex flex-col gap-6 mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl">
        {questions.map((question, index) => (
          <div key={`${assignment._id}-question-${index}`}>
            <strong className="block text-[15px] font-bold text-slate-800 mb-3">Câu {index + 1}: {question.question}</strong>
            {currentUser && !isTeacherOrAdmin && !assignment.mySubmission ? (
              <div className="flex flex-col gap-2.5">
                {(question.options || []).map((option, optionIndex) => (
                  <label key={`${assignment._id}-option-${index}-${optionIndex}`} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500"
                      name={`${assignment._id}-${index}`}
                      checked={draftAnswers[index] === optionIndex}
                      onChange={() => handleQuizAnswer(assignment._id, index, optionIndex)}
                    />
                    <span className="text-[14px] text-slate-700 font-medium">{answerLabel(optionIndex)}. {option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {(question.options || []).map((option, optionIndex) => {
                  const isCorrectAnswer = question.correctOptionIndex === optionIndex
                  const studentPickedThis = myAnswers[index] === optionIndex
                  const hasSubmission = Boolean(assignment.mySubmission)

                  let optionClass = 'bg-white border-slate-200 text-slate-600'
                  let badge = null

                  if (hasSubmission && !isTeacherOrAdmin && isCorrectAnswer) {
                    optionClass = 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    badge = <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[12px] font-black">✓ Đáp án đúng</span>
                  } else if (hasSubmission && !isTeacherOrAdmin && studentPickedThis && !isCorrectAnswer) {
                    optionClass = 'bg-red-50 border-red-300 text-red-700'
                    badge = <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[12px] font-black">✗ Bạn chọn sai</span>
                  } else if (isTeacherOrAdmin && isCorrectAnswer) {
                    optionClass = 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    badge = <span className="ml-auto shrink-0 text-[12px] font-bold text-emerald-600">(Đúng)</span>
                  }

                  return (
                    <span key={`${assignment._id}-option-${index}-${optionIndex}`} className={`flex items-center text-[14px] font-medium p-3 rounded-lg border transition-colors ${optionClass}`}>
                      <span>{answerLabel(optionIndex)}. {option}</span>
                      {badge}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

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
    // Find the main scrollable container. It could be window or a specific div.
    // For a fullscreen view, usually it's the window or a specific wrapper.
    // We'll attach to both window and the .lesson-main-scroll wrapper just in case.
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    
    const scrollContainer = document.querySelector('.lesson-main-scroll')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll)
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
      setVideoPlaybackError('')
      lastTimeRef.current = 0
      setHasVideoEnded(false)
      setHasSeeked(false)
    }

    const src = playbackVideoUrl
    const handleError = () => {
      if (!mounted) return
      const error = video.error
      console.error('[LessonFullPage] Video playback error:', {
        code: error?.code,
        message: error?.message || '',
        src
      })
      setVideoReady(false)
      setVideoPlaybackError('Không thể phát video. Video có thể đang được Cloudinary xử lý hoặc codec chưa tương thích.')
    }

    setVideoPlaybackError('')

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
        video.addEventListener('loadedmetadata', handleLoaded)
      } catch (err) {
        console.warn('dash init error', err)
      }
    } else if (isDirectVideo) {
      console.log('[LessonFullPage] Setting direct video source natively via JSX')
      video.addEventListener('loadedmetadata', handleLoaded)
      if (video.readyState >= 1) handleLoaded()
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('seeking', handleSeeking)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    return () => {
      mounted = false
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('seeking', handleSeeking)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadedmetadata', handleLoaded)
      video.removeEventListener('error', handleError)
      if (hls) {
        hls.destroy()
        hls = null
      }
      if (dashPlayer) {
        try { dashPlayer.reset() } catch (err) { console.warn('dash reset error', err) }
        dashPlayer = null
      }
      if (!isDirectVideo) {
        try { video.removeAttribute('src'); video.load() } catch (err) { console.warn('video cleanup error', err) }
      }
    }
  }, [isDirectVideo, isHls, isDash, lesson?._id, playbackVideoUrl])

  const allAssignmentsSubmitted = lessonAssignments.length > 0 
    ? lessonAssignments.every(a => a.mySubmission)
    : true;

  const canMarkComplete = canComplete && !isCompleted && allAssignmentsSubmitted
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
    if (!lesson?._id) return
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
      showWarning('Cậu cần đăng nhập để thả tim.')
      return
    }

    if (!lesson?._id) return

    try {
      const response = await api.patch(`/api/lessons/${lesson._id}/reaction`)
      setLessonHeart({
        count: response.data?.heartCount || 0,
        isHearted: Boolean(response.data?.isHearted)
      })
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không thả tim được.'))
    }
  }

  const handleSubmitComment = async parentCommentId => {
    const text = parentCommentId ? (replyDrafts[parentCommentId] || '').trim() : newComment.trim()
    if (!text) return

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
      showError(getApiErrorMessage(err, 'Không gửi được bình luận.'))
    } finally {
      setPosting(false)
    }
  }

  const handleSaveLessonEdit = async () => {
    if (!lesson?._id) return

    if (isUploadingLessonVideo) {
      showWarning('Video đang được tải lên, cậu chờ hoàn tất nhé.')
      return
    }

    if (!editDraft.title.trim()) {
      showWarning('Cậu điền tiêu đề bài học trước nhé.')
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
      showSuccess('Đã cập nhật bài học thành công.')
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không cập nhật được bài học.'))
    } finally {
      setIsSavingLesson(false)
    }
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      
      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-[300px] bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-200 bg-white flex-shrink-0">
          <h4 className="text-[16px] font-black text-slate-900">Mục lục bài học</h4>
          <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors" onClick={() => setIsSidebarOpen(false)}>
            <ArrowLeft size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {!sortedLessons.length && <p className="text-center text-[14px] text-slate-500 p-4">Chưa có bài học</p>}
          {sortedLessons.map(item => {
            const isCurrent = String(item._id) === currentLessonId
            return (
              <button
                key={item._id}
                className={`flex items-start gap-3 p-3 text-left rounded-xl transition-all cursor-pointer border ${isCurrent ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                onClick={() => handleLessonSelect(String(item._id))}
              >
                <span className={`flex items-center justify-center w-6 h-6 rounded-md text-[12px] font-black flex-shrink-0 ${isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {item.order}
                </span>
                <span className={`text-[14px] font-bold mt-0.5 ${isCurrent ? 'text-blue-900' : 'text-slate-700'}`}>
                  {item.title}
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white h-full relative">
        {/* Topbar */}
        <header className="h-[72px] px-4 md:px-6 flex items-center justify-between border-b border-slate-200 bg-white flex-shrink-0 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
              <ListVideo size={20} />
            </button>
            <div className="min-w-0">
              <h2 className="text-[16px] md:text-xl font-black text-slate-900 truncate">{course?.title || 'Bài học'}</h2>
              <div className="text-[12px] text-slate-500 truncate hidden md:block">Khóa học hiện tại</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 md:px-4 rounded-lg font-bold transition-all cursor-pointer text-[13px] ${lessonHeart.isHearted ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'}`}
              onClick={handleToggleHeart}
            >
              <Heart size={16} className={lessonHeart.isHearted ? "fill-rose-500 text-rose-500" : ""} />
              <span className="hidden sm:inline">{lessonHeart.count}</span>
            </button>
            
            {canEditLesson && lesson && (
              <button className="hidden sm:inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold transition-all cursor-pointer text-[13px]" onClick={() => setEditMode(prev => !prev)}>
                <Edit3 size={16} /> {editMode ? 'Đóng sửa' : 'Sửa bài'}
              </button>
            )}
            
            <button className={ghostButtonClass} onClick={onClose}>
              <span className="hidden sm:inline">Thoát</span>
              <ArrowLeft size={16} className="sm:hidden" />
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="lesson-main-scroll flex-1 overflow-y-auto w-full">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[15px] font-bold text-slate-500">Đang tải bài học...</p>
            </div>
          )}

          {!isLoading && lesson && (
            <div className="w-full max-w-5xl mx-auto pb-20">
              {/* Video Player Section */}
              {lesson.videoUrl ? (
                <div className="w-full bg-slate-900 aspect-video relative group">
                  {videoId ? (
                    <div className="absolute inset-0 w-full h-full" ref={setYoutubeContainerEl}></div>
                  ) : isDirectVideo || isHls || isDash ? (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                      <video 
                        ref={videoElRef} 
                        src={isDirectVideo ? playbackVideoUrl : undefined}
                        preload="metadata"
                        controls 
                        className="max-w-full max-h-full w-full h-full" 
                        playsInline 
                      />
                      {videoPlaybackError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 px-6 text-center text-sm font-bold text-red-300">
                          {videoPlaybackError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {getVideoEmbedUrl(lesson.videoUrl) ? (
                        <iframe
                          src={getVideoEmbedUrl(lesson.videoUrl)}
                          title={lesson.title}
                          className="absolute inset-0 w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-red-400 bg-red-950/30 p-6 text-center">
                          Video URL không hợp lệ: {lesson.videoUrl}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full bg-slate-100 aspect-[21/9] flex items-center justify-center text-slate-400 border-b border-slate-200">
                  <span className="text-[14px] font-bold">Chưa có video cho bài học này.</span>
                </div>
              )}

              {/* Lesson Content Area */}
              <div className="px-4 md:px-8 xl:px-12 py-8 md:py-12 flex flex-col min-w-0">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">{lesson.title}</h1>

                {lesson.attachmentUrl && (
                  <div className="mb-8 flex items-center">
                    <a 
                      href={lesson.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 transition-colors w-fit"
                    >
                      <FileText size={20} />
                      {lesson.attachmentName || 'Tải tài liệu đính kèm'}
                    </a>
                  </div>
                )}

                {/* Edit Mode Panel */}
                {canEditLesson && editMode && (
                  <div className="mb-10 p-6 bg-amber-50 border border-amber-200 rounded-2xl shadow-inner">
                    <h4 className="text-lg font-black text-amber-900 mb-6 flex items-center gap-2"><Edit3 size={18} /> Chỉnh sửa bài học</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-amber-900/70">Tiêu đề</label>
                        <input type="text" className="w-full h-11 px-4 bg-white border border-amber-200 rounded-xl text-[14px] font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20" value={editDraft.title} onChange={e => setEditDraft(prev => ({ ...prev, title: e.target.value }))} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-amber-900/70">Video URL</label>
                        <div className="flex gap-2">
                          <input type="text" className="w-full h-11 px-4 bg-white border border-amber-200 rounded-xl text-[14px] font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20" value={editDraft.videoUrl} onChange={e => setEditDraft(prev => ({ ...prev, videoUrl: e.target.value }))} />
                          <LessonVideoUploadButton
                            className="inline-flex shrink-0 items-center justify-center gap-2 h-11 px-4 rounded-xl bg-white hover:bg-amber-100 text-amber-800 font-bold transition-all border border-amber-200"
                            onUpload={onUploadLessonVideoFile}
                            onUploaded={videoUrl => setEditDraft(prev => ({ ...prev, videoUrl }))}
                            onUploadingChange={setIsUploadingLessonVideo}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-amber-900/70">Ảnh minh họa (URL)</label>
                        <input type="text" className="w-full h-11 px-4 bg-white border border-amber-200 rounded-xl text-[14px] font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20" value={editDraft.imageUrl} onChange={e => setEditDraft(prev => ({ ...prev, imageUrl: e.target.value }))} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-amber-900/70">Thứ tự</label>
                        <input type="number" className="w-full h-11 px-4 bg-white border border-amber-200 rounded-xl text-[14px] font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20" value={editDraft.order} onChange={e => setEditDraft(prev => ({ ...prev, order: Number(e.target.value) || 1 }))} />
                      </div>
                    </div>
                    <div className="mb-6 bg-white rounded-xl border border-amber-200 overflow-hidden">
                      <RichTextEditor
                        toolbarId="lesson-full-editor"
                        value={editDraft.content}
                        onChange={value => setEditDraft(prev => ({ ...prev, content: value }))}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 border-t border-amber-200/50 pt-5">
                      <button className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-sm disabled:opacity-60" onClick={handleSaveLessonEdit} disabled={isSavingLesson || isUploadingLessonVideo}>
                        {isSavingLesson ? 'Đang lưu...' : 'Lưu cập nhật'}
                      </button>
                      <button className="inline-flex items-center justify-center h-11 px-4 rounded-xl bg-white hover:bg-amber-100 text-amber-800 font-bold transition-all border border-amber-200" onClick={() => setEditMode(false)}>
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                {/* Lesson Rich Text Content */}
                <div 
                  ref={contentRef}
                  className="prose prose-slate md:prose-lg max-w-none prose-headings:font-black prose-a:text-blue-600 prose-img:rounded-2xl prose-img:shadow-sm"
                  dangerouslySetInnerHTML={{ __html: transformHtmlVideoUrls(lesson.content) || '' }}
                ></div>

                {/* Completion Block */}
                {canComplete && (
                  <div className="mt-16 pt-10 border-t border-slate-200 flex flex-col items-center text-center">
                    <button
                      className={`inline-flex items-center justify-center gap-2 h-14 px-8 rounded-[16px] font-black text-[16px] transition-all duration-300 shadow-lg ${isCompleted ? 'bg-emerald-500 text-white shadow-emerald-500/30' : canMarkComplete ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30 hover:scale-105 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                      onClick={() => onCompleteLesson?.(lesson._id)}
                      disabled={!canMarkComplete && !isCompleted}
                    >
                      <CheckCircle2 size={24} />
                      {isCompleted ? 'Đã hoàn thành xuất sắc' : 'Hoàn thành bài học'}
                    </button>
                    
                    {!isCompleted && !canMarkComplete && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-[14px] font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                        <AlertCircle size={16} />
                        <span>
                          {lessonAssignments.length > 0
                            ? 'Vui lòng nộp tất cả bài tập để hoàn thành bài học.'
                            : 'Vui lòng đọc hết nội dung bài học.'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Assignments / Quiz Section */}
                <div className="mt-16 pt-10 border-t border-slate-200">
                  <h4 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                    <CheckCircle2 className="text-blue-600" /> Bài tập / Quiz cho bài học này
                    {lessonAssignments.length === 0 && <span className="text-[14px] font-medium text-slate-400 font-normal">(Không bắt buộc)</span>}
                  </h4>
                  {canEditLesson && (
                    <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                      <h5 className="font-bold text-blue-800 mb-4">Tạo Bài tập / Quiz mới</h5>
                      <div className="flex flex-col gap-4">
                        <select
                          className={baseInputClass}
                          value={newAssignmentData?.type || 'quiz'}
                          onChange={e => onNewAssignmentDataChange({ ...newAssignmentData, type: e.target.value })}
                        >
                          <option value="quiz">Trắc nghiệm</option>
                          <option value="text">Tự luận</option>
                          <option value="practical">Báo cáo / Thực hành (Video)</option>

                        </select>
                        <input
                          type="text"
                          className={baseInputClass}
                          placeholder="Tiêu đề bài tập"
                          value={newAssignmentData?.title || ''}
                          onChange={e => onNewAssignmentDataChange({ ...newAssignmentData, title: e.target.value })}
                        />
                        {(newAssignmentData?.type || 'quiz') !== 'quiz' && (
                          <textarea
                            className={baseInputClass}
                            placeholder="Mô tả / Yêu cầu đề bài (Tùy chọn)"
                            rows={3}
                            value={newAssignmentData?.description || ''}
                            onChange={e => onNewAssignmentDataChange({ ...newAssignmentData, description: e.target.value })}
                          />
                        )}
                        {(newAssignmentData?.type || 'quiz') === 'quiz' && getNewQuizQuestions().map((question, questionIndex) => (
                          <div key={`new-quiz-question-${questionIndex}`} className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <strong className="text-[14px] font-black text-slate-800">Câu {questionIndex + 1}</strong>
                              {getNewQuizQuestions().length > 1 && (
                                <button type="button" className={dangerButtonClass} onClick={() => removeNewQuizQuestion(questionIndex)}>
                                  Xóa câu
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              className={baseInputClass}
                              placeholder="Nội dung câu hỏi"
                              value={question.question}
                              onChange={e => updateNewQuizQuestion(questionIndex, { ...question, question: e.target.value })}
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                              {question.options.map((option, optionIndex) => (
                                <label key={`new-quiz-option-${questionIndex}-${optionIndex}`} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`new-quiz-correct-${questionIndex}`}
                                    checked={question.correctOptionIndex === optionIndex}
                                    onChange={() => updateNewQuizQuestion(questionIndex, { ...question, correctOptionIndex: optionIndex })}
                                  />
                                  <input
                                    type="text"
                                    className={baseInputClass}
                                    placeholder={`Đáp án ${String.fromCharCode(65 + optionIndex)}`}
                                    value={option}
                                    onChange={e => {
                                      const options = [...question.options]
                                      options[optionIndex] = e.target.value
                                      updateNewQuizQuestion(questionIndex, { ...question, options })
                                    }}
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        {(newAssignmentData?.type || 'quiz') === 'quiz' && (
                          <button type="button" className={ghostButtonClass} onClick={addNewQuizQuestion}>
                            Thêm câu hỏi
                          </button>
                        )}
                        <button
                          className={baseButtonClass}
                          onClick={handleCreateLessonQuiz}
                        >
                          Tạo bài tập
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-6">
                    {lessonAssignments.length ? (
                      lessonAssignments.map(assignment => {
                        const isQuiz = assignment.type === 'quiz'
                        const isTeacherOrAdmin = currentRole === 'teacher' || currentRole === 'admin'
                        return (
                          <div key={assignment._id} className="flex flex-col gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <div>
                              <div className="flex items-center justify-between">
                                <h4 className="text-xl font-black text-slate-900 mb-2">{assignment.title}</h4>
                                {canEditLesson && (
                                  <div className="flex gap-2">
                                    <button className={dangerButtonClass} onClick={() => onDeleteAssignment(assignment._id)}>Xóa</button>
                                  </div>
                                )}
                              </div>
                              <p className="text-[15px] text-slate-600">{assignment.description || ''}</p>
                              {renderAssignmentBody(assignment)}
                            </div>

                            {assignment.mySubmission && (
                              <div className="mt-2 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex items-center justify-between text-[14px] mb-3">
                                  <span className="font-bold text-slate-600">Trạng thái bài làm:</span>
                                  <strong className={`px-3 py-1 rounded-lg font-bold ${assignment.mySubmission.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                    {assignment.mySubmission.status === 'graded'
                                      ? `Đã chấm - ${assignment.mySubmission.score}${assignment.type === 'quiz' ? '%' : ' điểm'}`
                                      : assignment.mySubmission.status === 'submitted' ? 'Đã nộp - Đang chờ chấm' : 'Đang chờ chấm'}
                                  </strong>
                                </div>
                              </div>
                            )}

                            {currentUser && !isTeacherOrAdmin && isQuiz && !assignment.mySubmission && (
                              <div className="mt-4 flex flex-col gap-3">
                                <button
                                  className="inline-flex cursor-pointer self-start items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-all"
                                  onClick={() => handleSubmitQuiz(assignment)}
                                >
                                  Nộp bài trắc nghiệm
                                </button>
                              </div>
                            )}

                            {currentUser && !isTeacherOrAdmin && !isQuiz && (!assignment.mySubmission || assignment.mySubmission.status === 'revision_requested') && (
                              <div className="mt-4 flex flex-col gap-3 p-5 bg-blue-50 border border-blue-200 rounded-xl">
                                <h5 className="font-bold text-blue-800 mb-2">Nộp bài của bạn</h5>
                                {assignment.type === 'practical' && (
                                  <div className="flex flex-col gap-2">
                                    <label className="text-[14px] font-bold text-slate-700">Video minh chứng (Bắt buộc nếu bài yêu cầu thực hành):</label>
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="text"
                                        className={baseInputClass}
                                        placeholder="Link Youtube/Drive hoặc tải lên video..."
                                        value={assignmentDrafts[assignment._id]?.videoUrl || ''}
                                        onChange={e => onAssignmentDraftChange?.(assignment._id, { ...assignmentDrafts[assignment._id], videoUrl: e.target.value })}
                                      />
                                      <LessonVideoUploadButton 
                                        onUploadSuccess={(url) => onAssignmentDraftChange?.(assignment._id, { ...assignmentDrafts[assignment._id], videoUrl: url })}
                                      />
                                    </div>
                                    {assignmentDrafts[assignment._id]?.videoUrl && (
                                      <video src={getPlayableCloudinaryVideoUrl(assignmentDrafts[assignment._id]?.videoUrl)} controls className="w-full max-w-sm rounded-lg mt-2 bg-black" />
                                    )}
                                  </div>
                                )}
                                <textarea
                                  className={baseInputClass}
                                  placeholder={assignment.type === 'text' ? 'Nhập nội dung bài nộp...' : 'Ghi chú thêm (Tùy chọn)...'}
                                  rows={4}
                                  value={assignmentDrafts[assignment._id]?.content || ''}
                                  onChange={e => onAssignmentDraftChange?.(assignment._id, { ...assignmentDrafts[assignment._id], content: e.target.value })}
                                />
                                <button
                                  className="inline-flex cursor-pointer self-start items-center justify-center gap-2 h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all mt-2"
                                  onClick={() => onSubmitAssignment?.(assignment._id, assignmentDrafts[assignment._id] || {})}
                                >
                                  Nộp bài
                                </button>
                              </div>
                            )}

                            {isTeacherOrAdmin && (
                              <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="font-bold text-slate-800">Danh sách bài nộp</h5>
                                  <button className={ghostButtonClass} onClick={() => onLoadAssignmentSubmissions?.(assignment._id)}>
                                    Tải / Làm mới danh sách
                                  </button>
                                </div>
                                
                                {assignmentSubmissions?.[assignment._id] ? (
                                  assignmentSubmissions[assignment._id].length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                      {assignmentSubmissions[assignment._id].map(sub => (
                                        <div key={sub._id} className="p-4 bg-white border border-slate-200 rounded-lg">
                                          <div className="flex justify-between items-center mb-2">
                                            <strong className="text-[15px] text-slate-800">{sub.studentName}</strong>
                                            <span className={`px-2 py-1 rounded text-[12px] font-bold ${sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : sub.status === 'revision_requested' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                                              {sub.status === 'graded' ? `Đã chấm (${sub.score})` : sub.status === 'revision_requested' ? 'Yêu cầu làm lại' : 'Chưa chấm'}
                                            </span>
                                          </div>
                                          {sub.content && <div className="text-[14px] text-slate-600 mb-3 bg-slate-50 p-3 rounded-md">{sub.content}</div>}
                                          {isQuiz && sub.answers && sub.answers.length > 0 && (
                                            <div className="mt-3 flex flex-col gap-3 mb-3">
                                              {Array.isArray(assignment.questions) && assignment.questions.map((q, qIndex) => {
                                                const studentAns = sub.answers[qIndex];
                                                const isTrueCorrect = Number(q.correctOptionIndex);
                                                return (
                                                  <div key={`quiz-sub-${qIndex}`} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                    <p className="font-bold text-[13px] text-slate-800 mb-2">Câu {qIndex + 1}: {q.question}</p>
                                                    <div className="flex flex-col gap-1">
                                                      {(q.options || []).map((opt, optIdx) => {
                                                        const isSelected = studentAns === optIdx;
                                                        const isCorrect = isTrueCorrect === optIdx;
                                                        let color = 'text-slate-600';
                                                        let bg = '';
                                                        let label = '';
                                                        if (isSelected && isCorrect) {
                                                          color = 'text-emerald-700 font-bold';
                                                          bg = 'bg-emerald-100';
                                                          label = ' (Học sinh chọn - Đúng)';
                                                        } else if (isSelected && !isCorrect) {
                                                          color = 'text-red-600 font-bold';
                                                          bg = 'bg-red-50';
                                                          label = ' (Học sinh chọn - Sai)';
                                                        } else if (isCorrect) {
                                                          color = 'text-emerald-600 font-bold';
                                                          label = ' (Đáp án đúng)';
                                                        }
                                                        return (
                                                          <div key={`quiz-sub-opt-${optIdx}`} className={`text-[13px] px-2 py-1.5 rounded ${bg} ${color}`}>
                                                            {String.fromCharCode(65 + optIdx)}. {opt}
                                                            {label && <span className="ml-1 opacity-80">{label}</span>}
                                                          </div>
                                                        )
                                                      })}
                                                    </div>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}
                                          {sub.videoUrl && (
                                            <div className="mb-3">
                                              <a href={sub.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-[14px] underline mb-2 font-bold inline-block">Xem Video / Link Báo cáo</a>
                                              <video src={getPlayableCloudinaryVideoUrl(sub.videoUrl)} controls className="w-full max-w-md rounded-lg bg-black" />
                                            </div>
                                          )}
                                          
                                          {!isQuiz && (
                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
                                              <input
                                                type="number"
                                                className="h-10 px-3 rounded-lg border border-slate-300 text-[14px] w-24 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                placeholder="Điểm"
                                                id={`score-${sub._id}`}
                                                defaultValue={sub.score ?? ''}
                                              />
                                              <select 
                                                id={`status-${sub._id}`} 
                                                className="h-10 px-3 rounded-lg border border-slate-300 text-[14px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                defaultValue={sub.status === 'revision_requested' ? 'revision_requested' : 'graded'}
                                              >
                                                <option value="graded">Chấm hoàn thành</option>
                                                <option value="revision_requested">Yêu cầu làm lại</option>
                                              </select>
                                              <button
                                                className="h-10 px-5 rounded-lg bg-emerald-600 text-white font-bold text-[14px] hover:bg-emerald-700 transition-colors"
                                                onClick={() => {
                                                  const score = document.getElementById(`score-${sub._id}`).value;
                                                  const status = document.getElementById(`status-${sub._id}`).value;
                                                  onGradeSubmission?.(sub._id, { score, status });
                                                }}
                                              >
                                                Lưu điểm
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[14px] text-slate-500 italic">Chưa có ai nộp bài.</p>
                                  )
                                ) : (
                                  <p className="text-[14px] text-slate-500 italic">Bấm "Tải danh sách" để xem danh sách bài nộp.</p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="py-8 text-center text-[15px] font-medium text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        Chưa có bài tập nào cho bài học này.
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mt-16 pt-10 border-t border-slate-200">
                  <h4 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                    <MessageSquare className="text-blue-600" /> Thảo luận bài học
                  </h4>
                  
                  <div className="flex flex-col gap-8">
                    {commentsTree.length === 0 ? (
                      <div className="py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-center">
                        <p className="text-[15px] font-bold text-slate-500">Chưa có bình luận nào. Trở thành người đầu tiên thảo luận!</p>
                      </div>
                    ) : (
                      commentsTree.map(comment => {
                        const renderComment = (item, depth = 0) => {
                          const canManage = currentRole === 'admin' || currentRole === 'teacher' || item.authorName === currentUser
                          const isReplyOpen = replyingTo === item._id
                          const replyValue = replyDrafts[item._id] || ''

                          return (
                            <div key={item._id} className={`flex flex-col gap-3 ${depth > 0 ? 'ml-6 md:ml-12 pl-4 md:pl-6 border-l-2 border-slate-100 mt-4' : 'mt-6'}`}>
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[12px]">
                                    {(item.authorName || 'K').slice(0, 1).toUpperCase()}
                                  </div>
                                  <div>
                                    <button 
                                      className="text-[14px] font-black text-slate-900 text-left hover:text-blue-600 hover:underline transition-colors disabled:hover:no-underline disabled:hover:text-slate-900 cursor-pointer disabled:cursor-default"
                                      onClick={() => onOpenProfile?.(item.authorName)}
                                      disabled={!item.authorName}
                                    >
                                      {item.authorName || 'Khách'}
                                    </button>
                                    <span className="text-[12px] font-medium text-slate-400 ml-2">{new Date(item.createdAt).toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-11 md:ml-0">
                                  {currentUser && (
                                    <button
                                      className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                                      onClick={() => {
                                        setReplyingTo(prev => (prev === item._id ? null : item._id))
                                        setReplyDrafts(prev => ({ ...prev, [item._id]: prev[item._id] || '' }))
                                      }}
                                    >
                                      <Reply size={14} /> Phản hồi
                                    </button>
                                  )}
                                  {currentUser && onReportContent && (
                                    <button
                                      className="text-[12px] font-bold text-slate-500 hover:text-amber-600 transition-colors flex items-center gap-1 cursor-pointer"
                                      onClick={() => onReportContent({ targetType: 'lesson_comment', targetId: item._id, targetAuthor: item.authorName, content: item.content })}
                                    >
                                      <Flag size={14} /> Báo cáo
                                    </button>
                                  )}
                                  {canManage && (
                                    <button
                                      className="text-[12px] font-bold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                                      onClick={async () => {
                                        if (!confirm('Xóa bình luận này?')) return
                                        try {
                                          await api.delete(`/api/comments/${item._id}`)
                                          removeCommentBranch(item._id)
                                        } catch (err) {
                                          console.error('Delete comment error', err)
                                          showError(getApiErrorMessage(err, 'Không xóa được bình luận.'))
                                        }
                                      }}
                                    >
                                      <Trash2 size={14} /> Xóa
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-[15px] text-slate-700 ml-11 bg-slate-50 p-4 rounded-xl rounded-tl-none border border-slate-100">{item.content}</p>

                              {isReplyOpen && (
                                <div className="ml-11 mt-2 bg-white border border-blue-200 rounded-xl p-4 shadow-sm">
                                  <textarea
                                    className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 rounded-lg text-[14px] font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y mb-3"
                                    value={replyValue}
                                    onChange={e => setReplyDrafts(prev => ({ ...prev, [item._id]: e.target.value }))}
                                    placeholder="Viết câu trả lời của cậu..."
                                  />
                                  <div className="flex items-center gap-2 justify-end">
                                    <button className="h-9 px-4 rounded-lg bg-slate-100 text-slate-600 font-bold text-[13px] hover:bg-slate-200" onClick={() => setReplyingTo(null)}>Hủy</button>
                                    <button className="h-9 px-4 rounded-lg bg-blue-600 text-white font-bold text-[13px] hover:bg-blue-700" onClick={() => handleSubmitComment(item._id)} disabled={posting}>
                                      Gửi trả lời
                                    </button>
                                  </div>
                                </div>
                              )}

                              {Array.isArray(item.replies) && item.replies.length > 0 && (
                                <div className="ml-2">
                                  {item.replies.map(reply => renderComment(reply, depth + 1))}
                                </div>
                              )}
                            </div>
                          )
                        }

                        return renderComment(comment)
                      })
                    )}

                    {currentUser ? (
                      <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h5 className="text-[14px] font-black uppercase text-slate-800 tracking-wide mb-4">Để lại bình luận mới</h5>
                        <textarea
                          className="w-full min-h-[120px] p-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-y mb-4 shadow-sm"
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          placeholder="Chia sẻ suy nghĩ hoặc câu hỏi của cậu về bài học này..."
                        />
                        <div className="flex justify-end">
                          <button className={baseButtonClass} onClick={() => handleSubmitComment(null)} disabled={posting}>
                            Gửi bình luận
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-8 py-6 text-center bg-blue-50 text-blue-800 rounded-xl border border-blue-100 font-bold">
                        Vui lòng đăng nhập để tham gia thảo luận.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !lesson && (
            <div className="flex items-center justify-center py-32 h-full">
              <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
                <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-800 mb-2">Không tìm thấy bài học</h3>
                <p className="text-slate-500">Vui lòng chọn một bài học khác từ danh sách bên trái.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default LessonFullPage
